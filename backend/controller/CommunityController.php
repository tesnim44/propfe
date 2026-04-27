<?php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/community.php';

function resolveCommunityMessageTable(PDO $cnx): string
{
    static $table = null;

    if (is_string($table)) {
        return $table;
    }

    $stmt = $cnx->query("
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name IN ('community_message', 'community_messages')
        ORDER BY FIELD(table_name, 'community_message', 'community_messages')
        LIMIT 1
    ");

    $resolved = $stmt->fetchColumn();
    if (is_string($resolved) && $resolved !== '') {
        $table = $resolved;
        return $table;
    }

    $table = 'community_message';
    return $table;
}

function getTableColumns(PDO $cnx, string $table): array
{
    static $cache = [];

    if (isset($cache[$table])) {
        return $cache[$table];
    }

    $columns = [];

    try {
        $stmt = $cnx->query("SHOW COLUMNS FROM {$table}");
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!empty($row['Field'])) {
                $columns[] = $row['Field'];
            }
        }
    } catch (Throwable $e) {
        $columns = [];
    }

    $cache[$table] = $columns;
    return $columns;
}

function resolveColumnName(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        if (in_array($candidate, $columns, true)) {
            return $candidate;
        }
    }

    return null;
}

function readJsonInput(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function resolveRequestUserId(PDO $cnx, ?array $input = null): int
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $input ??= readJsonInput();
    $userId = (int) ($input['userId'] ?? $_REQUEST['userId'] ?? 0);
    if ($userId > 0) {
        $_SESSION['user_id'] = $userId;
        return $userId;
    }

    $email = trim((string) ($input['userEmail'] ?? $_REQUEST['userEmail'] ?? ''));
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        try {
            $stmt = $cnx->prepare('SELECT id, name FROM users WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            if ($row && !empty($row['id'])) {
                $_SESSION['user_id'] = (int) $row['id'];
                $_SESSION['email'] = $email;
                $_SESSION['user_name'] = (string) ($row['name'] ?? 'Member');
                return (int) $row['id'];
            }
        } catch (Throwable $e) {
            return 0;
        }
    }

    return (int) ($_SESSION['user_id'] ?? 0);
}

// ─────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────
function createCommunity(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO community (creatorId, name, description, icon, topics, memberCount, createdAt)
            VALUES (:creatorId, :name, :description, :icon, :topics, 1, NOW())';

    $stmt = $cnx->prepare($sql);
    return $stmt->execute([
        ':creatorId'   => $data['creatorId']   ?? null,
        ':name'        => $data['name']         ?? '',
        ':description' => $data['description']  ?? '',
        ':icon'        => $data['icon']         ?? '',
        ':topics'      => $data['topics']       ?? null,
    ]);
}

function createCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    if (session_status() === PHP_SESSION_NONE) session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    if (empty($_SESSION['isPremium'])) {
        echo json_encode(['success' => false, 'error' => 'Premium subscription required']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $name  = trim($input['name']        ?? '');
    $desc  = trim($input['description'] ?? '');
    $tags  = trim($input['topics']      ?? '');

    if ($name === '' || $desc === '') {
        echo json_encode(['success' => false, 'error' => 'Name and description required']);
        return;
    }

    $icon   = strtoupper(substr($name, 0, 2));
    $topics = $tags !== '' ? implode(',', array_map('trim', explode(',', $tags))) : null;

    $success = createCommunity($cnx, [
        'creatorId'   => (int) $_SESSION['user_id'],
        'name'        => $name,
        'description' => $desc,
        'icon'        => $icon,
        'topics'      => $topics,
    ]);

    if (!$success) {
        echo json_encode(['success' => false, 'error' => 'Failed to create community']);
        return;
    }

    $communityId = (int) $cnx->lastInsertId();

    $stmt = $cnx->prepare("
        INSERT INTO communitymember (communityId, userId, role, joinedAt)
        VALUES (:communityId, :userId, 'creator', NOW())
    ");
    $stmt->execute([':communityId' => $communityId, ':userId' => (int) $_SESSION['user_id']]);

    echo json_encode(['success' => true, 'id' => $communityId]);
}

// ─────────────────────────────────────────────────────────
// READ / LIST
// ─────────────────────────────────────────────────────────
function getAllCommunities(PDO $cnx): array
{
    $stmt = $cnx->query("
        SELECT c.*, u.name AS creator_name
        FROM community c
        LEFT JOIN users u ON u.id = c.creatorId
        ORDER BY c.createdAt DESC
    ");

    return array_map(function ($row) {
        return [
            'id'          => (int) $row['id'],
            'name'        => $row['name'],
            'description' => $row['description'] ?? '',
            'iconLetter'  => $row['icon'] ?? strtoupper(substr($row['name'], 0, 2)),
            'memberCount' => (int) ($row['memberCount'] ?? 0),
            'creatorName' => $row['creator_name'] ?? null,
            'tags'        => !empty($row['topics'])
                             ? array_map('trim', explode(',', $row['topics']))
                             : [],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getCommunityById(PDO $cnx, int $id): ?array
{
    $stmt = $cnx->prepare("
        SELECT c.*, u.name AS creator_name
        FROM community c
        LEFT JOIN users u ON u.id = c.creatorId
        WHERE c.id = :id LIMIT 1
    ");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;

    return [
        'id'          => (int) $row['id'],
        'name'        => $row['name'],
        'description' => $row['description'] ?? '',
        'iconLetter'  => $row['icon'] ?? strtoupper(substr($row['name'], 0, 2)),
        'memberCount' => (int) ($row['memberCount'] ?? 0),
        'creatorName' => $row['creator_name'] ?? null,
        'tags'        => !empty($row['topics'])
                         ? array_map('trim', explode(',', $row['topics']))
                         : [],
    ];
}

function getUserCommunitiesAsArray(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare("
        SELECT c.id, c.name, c.icon, c.memberCount
        FROM community c
        INNER JOIN communitymember cm ON cm.communityId = c.id
        WHERE cm.userId = :userId AND cm.isBanned = 0
        ORDER BY c.name
    ");
    $stmt->execute([':userId' => $userId]);

    return array_map(function ($row) {
        return [
            'id'          => (int) $row['id'],
            'name'        => $row['name'],
            'iconLetter'  => $row['icon'] ?: strtoupper(substr($row['name'], 0, 2)),
            'memberCount' => (int) $row['memberCount'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

// ─────────────────────────────────────────────────────────
// GET ALL — action HTTP
// ─────────────────────────────────────────────────────────
function getAllCommunitiesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    try {
        $communities = getAllCommunities($cnx);
        echo json_encode($communities);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// ─────────────────────────────────────────────────────────
// GET USER COMMUNITIES — action HTTP
// ─────────────────────────────────────────────────────────
function getUserCommunitiesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $userId = resolveRequestUserId($cnx);
    if ($userId <= 0) {
        echo json_encode([]);
        return;
    }

    try {
        $communities = getUserCommunitiesAsArray($cnx, $userId);
        echo json_encode($communities);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// ─────────────────────────────────────────────────────────
// JOIN / LEAVE
// ─────────────────────────────────────────────────────────
function joinCommunity(PDO $cnx, int $userId, int $communityId): array
{
    $chk = $cnx->prepare('SELECT id FROM communitymember WHERE communityId = :c AND userId = :u');
    $chk->execute([':c' => $communityId, ':u' => $userId]);
    if ($chk->fetch()) {
        return ['success' => true, 'alreadyMember' => true];
    }

    $stmt = $cnx->prepare("
        INSERT INTO communitymember (communityId, userId, role, joinedAt)
        VALUES (:communityId, :userId, 'member', NOW())
    ");
    $ok = $stmt->execute([':communityId' => $communityId, ':userId' => $userId]);

    if ($ok) {
        $cnx->prepare('UPDATE community SET memberCount = memberCount + 1 WHERE id = :id')
            ->execute([':id' => $communityId]);
    }

    return ['success' => $ok, 'alreadyMember' => false];
}

function leaveCommunity(PDO $cnx, int $userId, int $communityId): bool
{
    $stmt = $cnx->prepare('DELETE FROM communitymember WHERE communityId = :c AND userId = :u');
    $ok   = $stmt->execute([':c' => $communityId, ':u' => $userId]);

    if ($ok && $stmt->rowCount() > 0) {
        $cnx->prepare('UPDATE community SET memberCount = GREATEST(memberCount - 1, 0) WHERE id = :id')
            ->execute([':id' => $communityId]);
    }

    return $ok;
}

function joinCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $communityId = (int) ($input['community_id'] ?? 0);

    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    $result = joinCommunity($cnx, $userId, $communityId);
    echo json_encode($result);
}

function leaveCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $communityId = (int) ($input['community_id'] ?? 0);

    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    $success = leaveCommunity($cnx, $userId, $communityId);
    echo json_encode(['success' => $success]);
}

// ─────────────────────────────────────────────────────────
// CHAT MESSAGES
// ─────────────────────────────────────────────────────────
function getMessagesAction(PDO $cnx): void
{
    try {
        header('Content-Type: application/json');

        $communityId = (int) ($_GET['communityId'] ?? 0);
        $currentUserId = resolveRequestUserId($cnx);
        if (!$communityId) {
            echo json_encode(['success' => false, 'messages' => []]);
            return;
        }
        $messageTable = resolveCommunityMessageTable($cnx);
        $messageCols = getTableColumns($cnx, $messageTable);

        $communityIdCol = resolveColumnName($messageCols, ['communityId', 'community_id']);
        $userIdCol      = resolveColumnName($messageCols, ['userId', 'user_id']);
        $messageCol     = resolveColumnName($messageCols, ['message', 'content', 'body']);
        $createdAtCol   = resolveColumnName($messageCols, ['createdAt', 'created_at']);
        $isDeletedCol   = resolveColumnName($messageCols, ['isDeleted', 'is_deleted']);

        if (!$communityIdCol || !$userIdCol || !$messageCol || !$createdAtCol) {
            echo json_encode(['success' => true, 'messages' => []]);
            return;
        }

        $stmt = $cnx->prepare("
            SELECT cm.id, cm.{$userIdCol} AS userId, cm.{$messageCol} AS message, cm.{$createdAtCol} AS createdAt,
                   u.name AS userName
            FROM {$messageTable} cm
            LEFT JOIN users u ON u.id = cm.{$userIdCol}
            WHERE cm.{$communityIdCol} = ?
            " . ($isDeletedCol ? "AND cm.{$isDeletedCol} = 0" : '') . "
            ORDER BY cm.{$createdAtCol} ASC
            LIMIT 200
        ");
        $stmt->execute([$communityId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $messages = array_map(function ($m) use ($currentUserId) {
            $m['isMine'] = ($currentUserId > 0 && (int) $m['userId'] === $currentUserId);
            return $m;
        }, $messages);

        echo json_encode(['success' => true, 'messages' => $messages]);
    } catch (Throwable $e) {
        error_log('[getMessagesAction] ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Unable to load messages', 'detail' => $e->getMessage()]);
        return;
    }
}

function sendMessageAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $communityId = (int) ($input['communityId'] ?? 0);
    $message     = trim($input['message'] ?? '');

    if (!$communityId || $message === '') {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }

    $messageTable = resolveCommunityMessageTable($cnx);
    $messageCols = getTableColumns($cnx, $messageTable);

    $communityIdCol = resolveColumnName($messageCols, ['communityId', 'community_id']);
    $userIdCol      = resolveColumnName($messageCols, ['userId', 'user_id']);
    $messageCol     = resolveColumnName($messageCols, ['message', 'content', 'body']);
    $createdAtCol   = resolveColumnName($messageCols, ['createdAt', 'created_at']);
    $isDeletedCol   = resolveColumnName($messageCols, ['isDeleted', 'is_deleted']);

    if (!$communityIdCol || !$userIdCol || !$messageCol || !$createdAtCol) {
        echo json_encode(['success' => false, 'error' => 'Message schema is invalid']);
        return;
    }

    try {
        $columns = [$communityIdCol, $userIdCol, $messageCol, $createdAtCol];
        $values  = ['?', '?', '?', 'NOW()'];

        if ($isDeletedCol) {
            $columns[] = $isDeletedCol;
            $values[]  = '0';
        }

        $stmt    = $cnx->prepare("
            INSERT INTO {$messageTable} (" . implode(', ', $columns) . ")
            VALUES (" . implode(', ', $values) . ")
        ");
        $success = $stmt->execute([$communityId, $userId, $message]);
        $newId   = $success ? (int) $cnx->lastInsertId() : null;
    } catch (Throwable $e) {
        echo json_encode(['success' => false, 'error' => 'Message could not be saved']);
        return;
    }

    $userName = $_SESSION['user_name'] ?? $_SESSION['name'] ?? 'Member';

    echo json_encode([
        'success' => $success,
        'message' => $success ? [
            'id'       => $newId,
            'userId'   => $userId,
            'userName' => $userName,
        ] : null,
    ]);
}

function checkMembershipAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $communityId = (int) ($_GET['communityId'] ?? 0);
    $userId = resolveRequestUserId($cnx);
    if (!$communityId || $userId <= 0) {
        echo json_encode(['isMember' => false, 'isBanned' => false]);
        return;
    }

    $stmt = $cnx->prepare("
        SELECT isBanned FROM communitymember
        WHERE communityId = ? AND userId = ?
    ");
    $stmt->execute([$communityId, $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(['isMember' => true, 'isBanned' => (bool) $row['isBanned']]);
    } else {
        echo json_encode(['isMember' => false, 'isBanned' => false]);
    }
}

// ─────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────
if (basename($_SERVER['SCRIPT_FILENAME']) === 'CommunityController.php') {
    header('Content-Type: application/json');

    try {
        if (!($cnx instanceof PDO)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed',
                'detail' => databaseConnectionError(),
            ]);
            return;
        }

        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'getAll':             getAllCommunitiesAction($cnx);    break;
            case 'getUserCommunities': getUserCommunitiesAction($cnx);   break;
            case 'create':             createCommunityAction($cnx);      break;
            case 'join':               joinCommunityAction($cnx);        break;
            case 'leave':              leaveCommunityAction($cnx);       break;
            case 'getMessages':        getMessagesAction($cnx);          break;
            case 'sendMessage':        sendMessageAction($cnx);          break;
            case 'checkMembership':    checkMembershipAction($cnx);      break;
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Action not found: ' . htmlspecialchars($action)]);
        }
    } catch (Throwable $e) {
        error_log('[CommunityController router] ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Controller failure', 'detail' => $e->getMessage()]);
    }
}
