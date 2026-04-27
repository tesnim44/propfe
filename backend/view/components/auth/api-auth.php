<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/env.php';
require_once __DIR__ . '/../../../controller/UserController.php';
require_once __DIR__ . '/../../../lib/Mailer.php';

session_start();

if (!($cnx instanceof PDO)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => databaseConnectionError() ?? 'Database connection failed.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonOk(array $data = []): never
{
    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonErr(string $message, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function passwordStrongEnough(string $password): bool
{
    return strlen($password) >= 10
        && preg_match('/[A-Z]/', $password) === 1
        && preg_match('/\d/', $password) === 1
        && preg_match('/[^A-Za-z0-9]/', $password) === 1;
}

function userPayload(array $user, bool $onboardingComplete = true): array
{
    return [
        'id' => (int) ($user['id'] ?? 0),
        'name' => $user['name'],
        'email' => $user['email'],
        'plan' => $user['plan'],
        'isPremium' => (bool) ($user['isPremium'] ?? 0),
        'isAdmin' => (bool) ($user['isAdmin'] ?? 0),
        'initial' => strtoupper($user['name'][0] ?? 'A'),
        'bio' => (string) ($user['bio'] ?? ''),
        'avatar' => normalizeProfileImagePath((string) ($user['avatar'] ?? '')),
        'cover' => normalizeProfileImagePath((string) ($user['cover'] ?? '')),
        'onboardingComplete' => $onboardingComplete,
    ];
}

function tableExists(PDO $cnx, string $table): bool
{
    try {
        $stmt = $cnx->prepare('SHOW TABLES LIKE :table');
        $stmt->execute([':table' => $table]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function columnExists(PDO $cnx, string $table, string $column): bool
{
    try {
        $stmt = $cnx->prepare("SHOW COLUMNS FROM `$table` LIKE :column");
        $stmt->execute([':column' => $column]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function ensureUserProfileColumns(PDO $cnx): void
{
    if (!tableExists($cnx, 'users')) {
        return;
    }

    $columns = [
        'bio' => 'ALTER TABLE users ADD COLUMN bio TEXT NULL',
        'avatar' => 'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL',
        'cover' => 'ALTER TABLE users ADD COLUMN cover VARCHAR(255) NULL',
    ];

    foreach ($columns as $column => $sql) {
        if (!columnExists($cnx, 'users', $column)) {
            try {
                $cnx->exec($sql);
            } catch (Throwable) {
            }
        }
    }
}

function userTableSupportsProfileColumns(PDO $cnx): bool
{
    return columnExists($cnx, 'users', 'bio')
        && columnExists($cnx, 'users', 'avatar')
        && columnExists($cnx, 'users', 'cover');
}

function ensureUserProfileTable(PDO $cnx): void
{
    try {
        $cnx->exec(
            "CREATE TABLE IF NOT EXISTS user_profile (
                userId INT NOT NULL PRIMARY KEY,
                bio TEXT NULL,
                avatar VARCHAR(255) NULL,
                cover VARCHAR(255) NULL,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } catch (Throwable) {
    }
}

function profileUploadDir(string $type): string
{
    return dirname(__DIR__, 4) . '/public/uploads/' . ($type === 'cover' ? 'covers' : 'avatars') . '/';
}

function normalizeProfileImagePath(string $image): string
{
    $image = trim($image);
    if ($image === '') {
        return '';
    }

    if (preg_match('#^backend/public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $image) === 1) {
        return substr($image, strlen('backend/'));
    }

    if (preg_match('#^/blog_12(?:3)?/public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $image) === 1) {
        return preg_replace('#^/blog_12(?:3)?/#', '', $image) ?: $image;
    }

    if (preg_match('#^https?://[^/]+/blog_12(?:3)?/public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $image) === 1) {
        return preg_replace('#^https?://[^/]+/blog_12(?:3)?/#', '', $image) ?: $image;
    }

    return $image;
}

function saveProfileImage(string $image, string $type): string
{
    $image = normalizeProfileImagePath($image);
    if ($image === '') {
        return '';
    }

    if (preg_match('#^public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $image) === 1) {
        return $image;
    }

    if (preg_match('#^data:image/(png|jpe?g|webp|gif);base64,#i', $image, $matches) !== 1) {
        return $image;
    }

    $extension = strtolower($matches[1]);
    if ($extension === 'jpeg') {
        $extension = 'jpg';
    }

    $binary = base64_decode(substr($image, strpos($image, ',') + 1), true);
    if ($binary === false) {
        jsonErr('Invalid image data.');
    }

    $directory = profileUploadDir($type);
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        jsonErr('Could not create upload folder.', 500);
    }

    $prefix = $type === 'cover' ? 'cover_' : 'avatar_';
    $fileName = $prefix . bin2hex(random_bytes(8)) . '.' . $extension;
    $target = $directory . $fileName;

    if (file_put_contents($target, $binary) === false) {
        jsonErr('Could not save image.', 500);
    }

    return 'public/uploads/' . ($type === 'cover' ? 'covers' : 'avatars') . '/' . $fileName;
}

function mergeProfileData(PDO $cnx, array $user): array
{
    ensureUserProfileColumns($cnx);
    ensureUserProfileTable($cnx);

    $profile = [
        'bio' => (string) ($user['bio'] ?? ''),
        'avatar' => normalizeProfileImagePath((string) ($user['avatar'] ?? '')),
        'cover' => normalizeProfileImagePath((string) ($user['cover'] ?? '')),
    ];

    try {
        $stmt = $cnx->prepare(
            'SELECT bio, avatar, cover
             FROM user_profile
             WHERE userId = :userId
             LIMIT 1'
        );
        $stmt->execute([':userId' => (int) ($user['id'] ?? 0)]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        foreach (['bio', 'avatar', 'cover'] as $field) {
            $fallbackValue = normalizeProfileImagePath((string) ($row[$field] ?? ''));
            if ($field === 'bio') {
                $fallbackValue = (string) ($row[$field] ?? '');
            }

            if ($profile[$field] === '' && $fallbackValue !== '') {
                $profile[$field] = $fallbackValue;
            }
        }
    } catch (Throwable) {
    }

    return array_merge($user, $profile);
}

function persistProfileData(PDO $cnx, int $userId, string $bio, string $avatar, string $cover): void
{
    ensureUserProfileColumns($cnx);
    ensureUserProfileTable($cnx);

    if (userTableSupportsProfileColumns($cnx)) {
        $stmt = $cnx->prepare(
            'UPDATE users
             SET bio = :bio,
                 avatar = :avatar,
                 cover = :cover
             WHERE id = :id'
        );
        $stmt->execute([
            ':bio' => $bio,
            ':avatar' => $avatar,
            ':cover' => $cover,
            ':id' => $userId,
        ]);
    }

    $profileStmt = $cnx->prepare(
        'INSERT INTO user_profile (userId, bio, avatar, cover)
         VALUES (:userId, :bio, :avatar, :cover)
         ON DUPLICATE KEY UPDATE
            bio = VALUES(bio),
            avatar = VALUES(avatar),
            cover = VALUES(cover)'
    );
    $profileStmt->execute([
        ':userId' => $userId,
        ':bio' => $bio,
        ':avatar' => $avatar,
        ':cover' => $cover,
    ]);
}

function loginUser(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['plan'] = $user['plan'];
    $_SESSION['isPremium'] = (int) ($user['isPremium'] ?? 0);
    $_SESSION['isAdmin'] = (int) ($user['isAdmin'] ?? 0);
}

function ensurePasswordResetTable(PDO $cnx): void
{
    $cnx->exec(
        "CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            used_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_reset_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

function ensurePrivateMessagesTable(PDO $cnx): void
{
    $cnx->exec(
        "CREATE TABLE IF NOT EXISTS private_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            senderId INT NOT NULL,
            recipientId INT NOT NULL,
            body TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            readAt DATETIME DEFAULT NULL,
            INDEX idx_private_messages_sender (senderId),
            INDEX idx_private_messages_recipient (recipientId),
            INDEX idx_private_messages_pair (senderId, recipientId, createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

function messageUserPayload(PDO $cnx, array $user): array
{
    $profile = mergeProfileData($cnx, $user);
    $name = (string) ($profile['name'] ?? 'Unknown');
    return [
        'id' => (int) ($profile['id'] ?? 0),
        'name' => $name,
        'email' => (string) ($profile['email'] ?? ''),
        'plan' => (string) ($profile['plan'] ?? 'free'),
        'isPremium' => (bool) ($profile['isPremium'] ?? 0),
        'avatar' => normalizeProfileImagePath((string) ($profile['avatar'] ?? '')),
        'cover' => normalizeProfileImagePath((string) ($profile['cover'] ?? '')),
        'bio' => (string) ($profile['bio'] ?? ''),
        'initial' => strtoupper(substr($name, 0, 1) ?: 'A'),
    ];
}

function listDirectoryUsers(PDO $cnx, int $currentUserId = 0, string $query = '', int $limit = 24): array
{
    ensureUserProfileColumns($cnx);
    ensureUserProfileTable($cnx);
    $limit = max(1, min($limit, 50));
    $sql = "SELECT id, name, email, plan, isPremium, isAdmin";
    if (columnExists($cnx, 'users', 'avatar')) {
        $sql .= ", COALESCE(avatar, '') AS avatar";
    } else {
        $sql .= ", '' AS avatar";
    }
    if (columnExists($cnx, 'users', 'cover')) {
        $sql .= ", COALESCE(cover, '') AS cover";
    } else {
        $sql .= ", '' AS cover";
    }
    if (columnExists($cnx, 'users', 'bio')) {
        $sql .= ", COALESCE(bio, '') AS bio";
    } else {
        $sql .= ", '' AS bio";
    }
    $sql .= " FROM users WHERE COALESCE(isAdmin, 0) = 0";
    $params = [];
    if ($currentUserId > 0) {
        $sql .= " AND id <> :currentUserId";
        $params[':currentUserId'] = $currentUserId;
    }
    if ($query !== '') {
        $sql .= " AND (name LIKE :nameQuery OR email LIKE :emailQuery)";
        $params[':nameQuery'] = '%' . $query . '%';
        $params[':emailQuery'] = '%' . $query . '%';
    }
    $sql .= " ORDER BY isPremium DESC, name ASC LIMIT {$limit}";

    $stmt = $cnx->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    return array_map(function (array $row) use ($cnx): array {
        return messageUserPayload($cnx, $row);
    }, $rows);
}

function getPrivateMessageThreads(PDO $cnx, int $userId): array
{
    ensurePrivateMessagesTable($cnx);
    $stmt = $cnx->prepare(
        "SELECT id, senderId, recipientId, body, createdAt, readAt
         FROM private_messages
         WHERE senderId = :uid_sender OR recipientId = :uid_recipient
         ORDER BY createdAt DESC, id DESC
         LIMIT 500"
    );
    $stmt->execute([
        ':uid_sender' => $userId,
        ':uid_recipient' => $userId,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $threads = [];
    foreach ($rows as $row) {
        $senderId = (int) ($row['senderId'] ?? 0);
        $recipientId = (int) ($row['recipientId'] ?? 0);
        $partnerId = $senderId === $userId ? $recipientId : $senderId;
        if ($partnerId <= 0) {
            continue;
        }

        if (!isset($threads[$partnerId])) {
            $partner = getUserById($cnx, $partnerId);
            if ($partner === false) {
                continue;
            }
            $threads[$partnerId] = [
                'partner' => messageUserPayload($cnx, $partner),
                'lastMessage' => '',
                'lastAt' => '',
                'unreadCount' => 0,
                'messageCount' => 0,
            ];
        }

        $threads[$partnerId]['messageCount']++;
        if ($threads[$partnerId]['lastMessage'] === '') {
            $threads[$partnerId]['lastMessage'] = (string) ($row['body'] ?? '');
            $threads[$partnerId]['lastAt'] = (string) ($row['createdAt'] ?? '');
        }
        if ($recipientId === $userId && empty($row['readAt'])) {
            $threads[$partnerId]['unreadCount']++;
        }
    }

    return array_values($threads);
}

function getPrivateMessageHistory(PDO $cnx, int $userId, int $partnerId): array
{
    ensurePrivateMessagesTable($cnx);
    if ($partnerId <= 0) {
        return [];
    }

    $stmt = $cnx->prepare(
        "SELECT id, senderId, recipientId, body, createdAt, readAt
         FROM private_messages
         WHERE (senderId = :userIdA AND recipientId = :partnerIdA)
            OR (senderId = :partnerIdB AND recipientId = :userIdB)
         ORDER BY createdAt ASC, id ASC"
    );
    $stmt->execute([
        ':userIdA' => $userId,
        ':partnerIdA' => $partnerId,
        ':partnerIdB' => $partnerId,
        ':userIdB' => $userId,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $cnx->prepare(
        "UPDATE private_messages
         SET readAt = NOW()
         WHERE senderId = :pid AND recipientId = :uid AND readAt IS NULL"
    )->execute([':pid' => $partnerId, ':uid' => $userId]);

    return array_map(static function (array $row) use ($userId): array {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'senderId' => (int) ($row['senderId'] ?? 0),
            'recipientId' => (int) ($row['recipientId'] ?? 0),
            'body' => (string) ($row['body'] ?? ''),
            'createdAt' => (string) ($row['createdAt'] ?? ''),
            'readAt' => (string) ($row['readAt'] ?? ''),
            'isMine' => (int) ($row['senderId'] ?? 0) === $userId,
        ];
    }, $rows);
}

function sendPrivateMessage(PDO $cnx, int $senderId, int $recipientId, string $body): array
{
    ensurePrivateMessagesTable($cnx);
    if ($senderId <= 0 || $recipientId <= 0) {
        jsonErr('Invalid conversation participants.', 400);
    }

    $recipient = getUserById($cnx, $recipientId);
    if ($recipient === false) {
        jsonErr('Recipient not found.', 404);
    }

    $body = trim($body);
    if ($body === '') {
        jsonErr('Message cannot be empty.', 400);
    }

    $stmt = $cnx->prepare(
        'INSERT INTO private_messages (senderId, recipientId, body, createdAt) VALUES (:senderId, :recipientId, :body, NOW())'
    );
    $stmt->execute([
        ':senderId' => $senderId,
        ':recipientId' => $recipientId,
        ':body' => $body,
    ]);

    $id = (int) $cnx->lastInsertId();
    return [
        'id' => $id,
        'senderId' => $senderId,
        'recipientId' => $recipientId,
        'body' => $body,
        'createdAt' => date('c'),
        'readAt' => '',
        'isMine' => true,
    ];
}

function sendPasswordResetEmail(string $email, string $name, string $token): void
{
    $baseUrl = rtrim(env('APP_URL', 'http://localhost/iblog3'), '/');
    $url = $baseUrl . '/reset-password.php?token=' . urlencode($token) . '&email=' . urlencode($email);

    $subject = 'Reset your IBlog password';
    $html = '<div style="font-family:Arial,sans-serif;color:#1c1a16;line-height:1.6">'
        . '<h2 style="margin-bottom:12px;">Reset your password</h2>'
        . '<p>Hello ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>We received a request to reset your IBlog password. Use the button below to choose a new one.</p>'
        . '<p><a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;padding:12px 18px;background:#b8960c;color:#fff;border-radius:999px;text-decoration:none;font-weight:700">Reset Password</a></p>'
        . '<p>This link expires in 60 minutes.</p>'
        . '<p>If you did not request this, you can ignore this email.</p>'
        . '</div>';
    $text = "Hello {$name},\n\nReset your IBlog password using this link:\n{$url}\n\nThis link expires in 60 minutes.";

    Mailer::send($email, $subject, $html, $text);
}

function sendWelcomeEmail(array $user): void
{
    $subject = 'Welcome to IBlog';
    $html = '<div style="font-family:Arial,sans-serif;color:#1c1a16;line-height:1.6">'
        . '<h2>Welcome to IBlog</h2>'
        . '<p>Hello ' . htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>Your account is ready. You can now sign in and start reading, writing and exploring premium tools.</p>'
        . '</div>';
    $text = "Welcome to IBlog, {$user['name']}.\n\nYour account is ready.";

    Mailer::send($user['email'], $subject, $html, $text);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonErr('Method not allowed.', 405);
    }

    loadEnvFile();
    $body = readJsonBody();
    $action = (string) ($body['action'] ?? '');

    if ($action === 'signup') {
        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $plan = ($body['plan'] ?? 'free') === 'premium' ? 'premium' : 'free';

        if (mb_strlen($name) < 2) jsonErr('Name must contain at least 2 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');
        if (!passwordStrongEnough($password)) jsonErr('Password must be at least 10 characters and include a capital letter, a number and a symbol.');
        if (getUserByEmail($cnx, $email) !== false) jsonErr('This email is already registered.');

        if (!AddUser($cnx, [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'plan' => $plan,
            'isPremium' => $plan === 'premium' ? 1 : 0,
            'isAdmin' => 0,
        ])) {
            jsonErr('Unable to create the account.', 500);
        }

        $user = getUserByEmail($cnx, $email);
        if ($user === false) jsonErr('Account created but user could not be loaded.', 500);

        loginUser($user);
        try {
            sendWelcomeEmail($user);
        } catch (Throwable) {
        }

        jsonOk(['user' => userPayload(mergeProfileData($cnx, $user), false)]);
    }

    if ($action === 'signin') {
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');
        if (strlen($password) < 6) jsonErr('Password must be at least 6 characters.');

        $user = ConnectUser($cnx, ['email' => $email, 'password' => $password]);
        if ($user === false) {
            jsonErr('Incorrect email or password.', 401);
        }

        loginUser($user);
        if ((int) ($user['isAdmin'] ?? 0) === 1) {
            jsonOk(['redirect' => 'backend/view/components/admin/admin.php']);
        }

        jsonOk(['user' => userPayload(mergeProfileData($cnx, $user), true)]);
    }

    if ($action === 'me') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        $user = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($user === false) jsonErr('User not found.', 404);
        jsonOk(['user' => userPayload(mergeProfileData($cnx, $user), true)]);
    }

    if ($action === 'update_profile') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        $user = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($user === false) jsonErr('User not found.', 404);
        $user = mergeProfileData($cnx, $user);

        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $bio = trim((string) ($body['bio'] ?? ($user['bio'] ?? '')));
        $avatarInput = trim((string) ($body['avatar'] ?? ''));
        $coverInput = trim((string) ($body['cover'] ?? ''));

        if (mb_strlen($name) < 2) jsonErr('Name must contain at least 2 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');

        $existing = getUserByEmail($cnx, $email);
        if ($existing !== false && (int) $existing['id'] !== (int) $_SESSION['user_id']) {
            jsonErr('This email is already used by another account.');
        }

        if (!updateUser($cnx, (int) $_SESSION['user_id'], [
            'name' => $name,
            'email' => $email,
            'password' => '',
            'plan' => $user['plan'],
            'isPremium' => $user['isPremium'],
            'isAdmin' => $user['isAdmin'],
        ])) {
            jsonErr('Unable to update the profile.', 500);
        }

        $avatar = $avatarInput !== '' ? saveProfileImage($avatarInput, 'avatar') : (string) ($user['avatar'] ?? '');
        $cover = $coverInput !== '' ? saveProfileImage($coverInput, 'cover') : (string) ($user['cover'] ?? '');

        try {
            persistProfileData($cnx, (int) $_SESSION['user_id'], $bio, $avatar, $cover);
        } catch (Throwable $e) {
            jsonErr('Could not save profile media: ' . $e->getMessage(), 500);
        }

        $updated = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($updated === false) jsonErr('Profile updated but user could not be loaded.', 500);
        $updated = mergeProfileData($cnx, $updated);
        loginUser($updated);
        jsonOk(['user' => userPayload($updated, true)]);
    }

    if ($action === 'forgot_password') {
        $email = trim((string) ($body['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');

        $user = getUserByEmail($cnx, $email);
        if ($user !== false) {
            ensurePasswordResetTable($cnx);
            $token = bin2hex(random_bytes(32));
            $hash = hash('sha256', $token);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

            $cnx->prepare('UPDATE password_resets SET used_at = NOW() WHERE email = :email AND used_at IS NULL')
                ->execute([':email' => $email]);
            $cnx->prepare('INSERT INTO password_resets (email, token_hash, expires_at) VALUES (:email, :hash, :expires_at)')
                ->execute([
                    ':email' => $email,
                    ':hash' => $hash,
                    ':expires_at' => $expiresAt,
                ]);

            sendPasswordResetEmail($email, $user['name'], $token);
        }

        jsonOk(['email' => $email]);
    }

    if ($action === 'reset_password') {
        $email = trim((string) ($body['email'] ?? ''));
        $token = trim((string) ($body['token'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');
        if ($token === '') jsonErr('Invalid reset token.');
        if (!passwordStrongEnough($password)) jsonErr('Password must be at least 10 characters and include a capital letter, a number and a symbol.');

        ensurePasswordResetTable($cnx);
        $stmt = $cnx->prepare('SELECT * FROM password_resets WHERE email = :email AND used_at IS NULL ORDER BY id DESC LIMIT 1');
        $stmt->execute([':email' => $email]);
        $reset = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reset || !hash_equals($reset['token_hash'], hash('sha256', $token)) || strtotime($reset['expires_at']) < time()) {
            jsonErr('This reset link is invalid or has expired.', 410);
        }

        $user = getUserByEmail($cnx, $email);
        if ($user === false) jsonErr('User account was not found.', 404);

        updateUser($cnx, (int) $user['id'], [
            'name' => $user['name'],
            'email' => $user['email'],
            'password' => $password,
            'plan' => $user['plan'],
            'isPremium' => $user['isPremium'],
            'isAdmin' => $user['isAdmin'],
        ]);

        $cnx->prepare('UPDATE password_resets SET used_at = NOW() WHERE id = :id')->execute([':id' => $reset['id']]);
        jsonOk(['message' => 'Password updated successfully.']);
    }

    if ($action === 'signup_premium') {
        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $method = strtolower(trim((string) ($body['method'] ?? 'card')));
        $amount = (float) ($body['amount'] ?? 9.00);

        if (mb_strlen($name) < 2) jsonErr('Name must contain at least 2 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');
        if (!passwordStrongEnough($password)) jsonErr('Password must be at least 10 characters and include a capital letter, a number and a symbol.');

        $existing = getUserByEmail($cnx, $email);
        if ($existing === false) {
            if (!AddUser($cnx, [
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'plan' => 'premium',
                'isPremium' => 1,
                'isAdmin' => 0,
            ])) {
                jsonErr('Unable to create the premium account.', 500);
            }
            $existing = getUserByEmail($cnx, $email);
        }

        if ($existing === false) jsonErr('Premium user could not be loaded.', 500);
        loginUser($existing);
        if (!upgradeToPremium($cnx, (int) $existing['id'], $method, $amount)) {
            jsonErr('Unable to activate premium access.', 500);
        }

        $updated = getUserById($cnx, (int) $existing['id']);
        if ($updated === false) jsonErr('Premium user could not be reloaded.', 500);
        loginUser($updated);
        jsonOk(['user' => userPayload(mergeProfileData($cnx, $updated), false)]);
    }

    if ($action === 'upgrade_to_premium') {
        if (empty($_SESSION['user_id'])) jsonErr('You need to sign in first.', 401);

        $method = strtolower(trim((string) ($body['method'] ?? 'card')));
        $allowedMethods = ['card', 'd17', 'konnect', 'sobflous', 'ccp'];
        if (!in_array($method, $allowedMethods, true)) {
            jsonErr('Unsupported payment method.');
        }

        $amount = (float) ($body['amount'] ?? 9.00);
        if (!upgradeToPremium($cnx, (int) $_SESSION['user_id'], $method, $amount)) {
            jsonErr('Unable to upgrade the account.', 500);
        }

        $user = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($user === false) jsonErr('User not found after upgrade.', 404);
        loginUser($user);
        try {
            $subject = 'Your IBlog premium access is active';
            $html = '<div style="font-family:Arial,sans-serif;color:#1c1a16;line-height:1.6"><h2>Premium activated</h2><p>Hello ' . htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') . ',</p><p>Your premium access is now active.</p><p>Payment method: <strong>' . htmlspecialchars(strtoupper($method), ENT_QUOTES, 'UTF-8') . '</strong></p></div>';
            $text = "Hello {$user['name']},\n\nYour premium access is now active.\nPayment method: " . strtoupper($method);
            Mailer::send($user['email'], $subject, $html, $text);
        } catch (Throwable) {
        }
        jsonOk(['user' => userPayload(mergeProfileData($cnx, $user), true)]);
    }

    if ($action === 'list_users') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        $query = trim((string) ($body['q'] ?? ''));
        $limit = (int) ($body['limit'] ?? 24);
        jsonOk(['users' => listDirectoryUsers($cnx, (int) $_SESSION['user_id'], $query, $limit)]);
    }

    if ($action === 'dm_threads') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        jsonOk(['threads' => getPrivateMessageThreads($cnx, (int) $_SESSION['user_id'])]);
    }

    if ($action === 'dm_messages') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        $partnerId = (int) ($body['partnerId'] ?? 0);
        $messages = getPrivateMessageHistory($cnx, (int) $_SESSION['user_id'], $partnerId);
        $partner = $partnerId > 0 ? getUserById($cnx, $partnerId) : false;
        jsonOk([
            'partner' => $partner !== false ? messageUserPayload($cnx, $partner) : null,
            'messages' => $messages,
        ]);
    }

    if ($action === 'dm_send') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        $recipientId = (int) ($body['recipientId'] ?? 0);
        $message = (string) ($body['message'] ?? $body['body'] ?? '');
        $saved = sendPrivateMessage($cnx, (int) $_SESSION['user_id'], $recipientId, $message);
        jsonOk(['message' => $saved]);
    }

    jsonErr('Unknown action.');
} catch (Throwable $e) {
    jsonErr($e->getMessage(), 500);
}
