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
        'name' => $user['name'],
        'email' => $user['email'],
        'plan' => $user['plan'],
        'isPremium' => (bool) ($user['isPremium'] ?? 0),
        'isAdmin' => (bool) ($user['isAdmin'] ?? 0),
        'initial' => strtoupper($user['name'][0] ?? 'A'),
        'onboardingComplete' => $onboardingComplete,
    ];
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

        jsonOk(['user' => userPayload($user, false)]);
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

        jsonOk(['user' => userPayload($user, true)]);
    }

    if ($action === 'me') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);
        $user = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($user === false) jsonErr('User not found.', 404);
        jsonOk(['user' => userPayload($user, true)]);
    }

    if ($action === 'update_profile') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated.', 401);

        $user = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($user === false) jsonErr('User not found.', 404);

        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));

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

        $updated = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($updated === false) jsonErr('Profile updated but user could not be loaded.', 500);
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
        jsonOk(['user' => userPayload($updated, false)]);
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
        jsonOk(['user' => userPayload($user, true)]);
    }

    jsonErr('Unknown action.');
} catch (Throwable $e) {
    jsonErr($e->getMessage(), 500);
}
