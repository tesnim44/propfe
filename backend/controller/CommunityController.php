<?php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/community.php';

function readJsonInput(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function resolveRequestUserId(PDO $cnx, ?array $input = null): int
{
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }

    $input ??= readJsonInput();
    $requestedUserId = (int) ($input['userId'] ?? $_REQUEST['userId'] ?? 0);
    $requestedEmail = trim((string) ($input['userEmail'] ?? $_REQUEST['userEmail'] ?? ''));
    $hasExplicitIdentity = ($requestedUserId > 0) || ($requestedEmail !== '');

    if ($requestedEmail !== '') {
        if (!filter_var($requestedEmail, FILTER_VALIDATE_EMAIL)) {
            return 0;
        }
        try {
            $stmt = $cnx->prepare('SELECT id, name, email FROM users WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $requestedEmail]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            if (!$row || empty($row['id'])) {
                return 0;
            }
            $resolvedId = (int) $row['id'];
            if ($requestedUserId > 0 && $resolvedId !== $requestedUserId) {
                return 0;
            }
            return $resolvedId;
        } catch (Throwable $e) {
            return 0;
        }
    }

    if ($requestedUserId > 0) {
        try {
            $stmt = $cnx->prepare('SELECT id, name, email FROM users WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $requestedUserId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            if (!$row || empty($row['id'])) {
                return 0;
            }
            return (int) $row['id'];
        } catch (Throwable $e) {
            return 0;
        }
    }

    if ($hasExplicitIdentity) {
        return 0;
    }

    return (int) ($_SESSION['user_id'] ?? 0);
}

function resolveUserDisplayName(PDO $cnx, int $userId): string
{
    if ($userId <= 0) {
        return 'Member';
    }
    try {
        $stmt = $cnx->prepare('SELECT name FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $userId]);
        $name = $stmt->fetchColumn();
        if (is_string($name) && trim($name) !== '') {
            return trim($name);
        }
    } catch (Throwable $e) {
        // no-op: fall through to default
    }
    return 'Member';
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
    if (session_status() === PHP_SESSION_NONE) @session_start();
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);

    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    if (!isUserPremium($cnx, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Premium subscription required']);
        return;
    }

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
        'creatorId'   => $userId,
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
    $stmt->execute([':communityId' => $communityId, ':userId' => $userId]);

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

        $communityId   = (int) ($_GET['communityId'] ?? 0);
        $currentUserId = resolveRequestUserId($cnx);

        if (!$communityId) {
            echo json_encode(['success' => false, 'messages' => []]);
            return;
        }

        $stmt = $cnx->prepare("
            SELECT cm.id, cm.userId, cm.message, cm.createdAt,
                   u.name AS userName
            FROM community_message cm
            LEFT JOIN users u ON u.id = cm.userId
            WHERE cm.communityId = ?
              AND cm.isDeleted = 0
            ORDER BY cm.createdAt ASC
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
        echo json_encode(['success' => false, 'error' => 'Unable to load messages']);
    }
}

function sendMessageAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input       = readJsonInput();
    $userId      = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['communityId'] ?? 0);
    $message     = trim($input['message'] ?? '');

    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    if (!$communityId || $message === '') {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }

    try {
        $stmt = $cnx->prepare("
            INSERT INTO community_message (communityId, userId, message, isDeleted, createdAt)
            VALUES (?, ?, ?, 0, NOW())
        ");
        $success = $stmt->execute([$communityId, $userId, $message]);
        $newId   = $success ? (int) $cnx->lastInsertId() : null;
    } catch (Throwable $e) {
        echo json_encode(['success' => false, 'error' => 'Message could not be saved']);
        return;
    }

    $userName = resolveUserDisplayName($cnx, $userId);

    echo json_encode([
        'success' => $success,
        'message' => $success ? [
            'id'        => $newId,
            'userId'    => $userId,
            'userName'  => $userName,
            'message'   => $message,
            'createdAt' => date('Y-m-d H:i:s'),
            'isMine'    => true,
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
// THREADS
// ─────────────────────────────────────────────────────────
function ensureCommunityThreadTables(PDO $cnx): void
{
    $cnx->exec("
        CREATE TABLE IF NOT EXISTS community_thread (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            communityId INT UNSIGNED NOT NULL,
            creatorId INT UNSIGNED NOT NULL,
            title VARCHAR(180) NOT NULL,
            isDeleted TINYINT(1) NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ct_community (communityId),
            INDEX idx_ct_creator (creatorId),
            INDEX idx_ct_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $cnx->exec("
        CREATE TABLE IF NOT EXISTS community_thread_message (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            communityId INT UNSIGNED NOT NULL,
            threadId INT UNSIGNED NOT NULL,
            userId INT UNSIGNED NOT NULL,
            message TEXT NOT NULL,
            isDeleted TINYINT(1) NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ctm_thread (threadId),
            INDEX idx_ctm_community (communityId),
            INDEX idx_ctm_user (userId),
            INDEX idx_ctm_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function isCommunityMember(PDO $cnx, int $communityId, int $userId): bool
{
    $stmt = $cnx->prepare("
        SELECT id
        FROM communitymember
        WHERE communityId = :communityId
          AND userId = :userId
          AND isBanned = 0
        LIMIT 1
    ");
    $stmt->execute([':communityId' => $communityId, ':userId' => $userId]);
    return (bool) $stmt->fetchColumn();
}

function isUserPremium(PDO $cnx, int $userId): bool
{
    if ($userId <= 0) return false;

    $stmt = $cnx->prepare("
        SELECT COALESCE(isPremium, 0) AS isPremium, COALESCE(plan, 'free') AS plan
        FROM users
        WHERE id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$row) return false;

    return (int) ($row['isPremium'] ?? 0) === 1 || strtolower((string) ($row['plan'] ?? 'free')) === 'premium';
}

function getThreadsAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $communityId = (int) ($_GET['communityId'] ?? 0);
    $userId      = resolveRequestUserId($cnx);

    if ($communityId <= 0 || $userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid request']);
        return;
    }

    if (!isCommunityMember($cnx, $communityId, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Only community members can access threads']);
        return;
    }

    try {
        ensureCommunityThreadTables($cnx);

        $stmt = $cnx->prepare("
            SELECT t.id, t.communityId, t.creatorId, t.title, t.createdAt,
                   COALESCE(u.name, 'Member') AS creatorName,
                   (
                     SELECT COUNT(*)
                     FROM community_thread_message tm
                     WHERE tm.threadId = t.id AND tm.isDeleted = 0
                   ) AS replyCount
            FROM community_thread t
            LEFT JOIN users u ON u.id = t.creatorId
            WHERE t.communityId = :communityId
              AND t.isDeleted = 0
            ORDER BY t.createdAt DESC
            LIMIT 200
        ");
        $stmt->execute([':communityId' => $communityId]);
        $threads = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'threads' => $threads]);
    } catch (Throwable $e) {
        error_log('[getThreadsAction] ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Unable to load threads']);
    }
}

function createThreadAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input       = readJsonInput();
    $userId      = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['communityId'] ?? 0);
    $title       = trim((string) ($input['title'] ?? ''));

    if ($userId <= 0 || $communityId <= 0 || $title === '') {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }
    if (mb_strlen($title) > 180) {
        echo json_encode(['success' => false, 'error' => 'Thread title is too long']);
        return;
    }
    if (!isCommunityMember($cnx, $communityId, $userId)) {
        echo json_encode(['success' => false, 'error' => 'You must join the community first']);
        return;
    }
    if (!isUserPremium($cnx, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Premium subscription required to create threads']);
        return;
    }

    try {
        ensureCommunityThreadTables($cnx);

        $stmt = $cnx->prepare("
            INSERT INTO community_thread (communityId, creatorId, title, isDeleted, createdAt, updatedAt)
            VALUES (:communityId, :creatorId, :title, 0, NOW(), NOW())
        ");
        $ok = $stmt->execute([
            ':communityId' => $communityId,
            ':creatorId'   => $userId,
            ':title'       => $title,
        ]);

        if (!$ok) {
            echo json_encode(['success' => false, 'error' => 'Unable to create thread']);
            return;
        }

        $threadId = (int) $cnx->lastInsertId();
        $userName = resolveUserDisplayName($cnx, $userId);
        echo json_encode([
            'success' => true,
            'thread'  => [
                'id'          => $threadId,
                'communityId' => $communityId,
                'creatorId'   => $userId,
                'title'       => $title,
                'createdAt'   => date('Y-m-d H:i:s'),
                'creatorName' => $userName,
                'replyCount'  => 0,
            ],
        ]);
    } catch (Throwable $e) {
        error_log('[createThreadAction] ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Unable to create thread']);
    }
}

function deleteThreadAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input       = readJsonInput();
    $userId      = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['communityId'] ?? 0);
    $threadId    = (int) ($input['threadId'] ?? 0);

    if ($userId <= 0 || $communityId <= 0 || $threadId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }
    if (!isCommunityMember($cnx, $communityId, $userId)) {
        echo json_encode(['success' => false, 'error' => 'You must join the community first']);
        return;
    }
    if (!isUserPremium($cnx, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Premium subscription required']);
        return;
    }

    try {
        ensureCommunityThreadTables($cnx);

        $stmt = $cnx->prepare("
            UPDATE community_thread
            SET isDeleted = 1, updatedAt = NOW()
            WHERE id = :threadId AND communityId = :communityId
            LIMIT 1
        ");
        $stmt->execute([':threadId' => $threadId, ':communityId' => $communityId]);

        $stmtMsg = $cnx->prepare("
            UPDATE community_thread_message
            SET isDeleted = 1
            WHERE threadId = :threadId
        ");
        $stmtMsg->execute([':threadId' => $threadId]);

        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        error_log('[deleteThreadAction] ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Unable to delete thread']);
    }
}

function getThreadMessagesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $communityId = (int) ($_GET['communityId'] ?? 0);
    $threadId    = (int) ($_GET['threadId'] ?? 0);
    $userId      = resolveRequestUserId($cnx);

    if ($communityId <= 0 || $threadId <= 0 || $userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid request']);
        return;
    }
    if (!isCommunityMember($cnx, $communityId, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Only community members can access thread messages']);
        return;
    }

    try {
        ensureCommunityThreadTables($cnx);

        $stmt = $cnx->prepare("
            SELECT tm.id, tm.threadId, tm.userId, tm.message, tm.createdAt,
                   COALESCE(u.name, 'Member') AS userName
            FROM community_thread_message tm
            LEFT JOIN users u ON u.id = tm.userId
            INNER JOIN community_thread t ON t.id = tm.threadId AND t.isDeleted = 0
            WHERE tm.threadId = :threadId
              AND tm.communityId = :communityId
              AND tm.isDeleted = 0
            ORDER BY tm.createdAt ASC
            LIMIT 500
        ");
        $stmt->execute([':threadId' => $threadId, ':communityId' => $communityId]);

        $messages = array_map(function (array $row) use ($userId) {
            $row['isMine'] = ((int) ($row['userId'] ?? 0) === $userId);
            return $row;
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));

        echo json_encode(['success' => true, 'messages' => $messages]);
    } catch (Throwable $e) {
        error_log('[getThreadMessagesAction] ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Unable to load thread messages']);
    }
}

function sendThreadMessageAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input       = readJsonInput();
    $userId      = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['communityId'] ?? 0);
    $threadId    = (int) ($input['threadId'] ?? 0);
    $message     = trim((string) ($input['message'] ?? ''));

    if ($userId <= 0 || $communityId <= 0 || $threadId <= 0 || $message === '') {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }
    if (!isCommunityMember($cnx, $communityId, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Only community members can post in threads']);
        return;
    }

    try {
        ensureCommunityThreadTables($cnx);

        $threadCheck = $cnx->prepare("
            SELECT id FROM community_thread
            WHERE id = :threadId AND communityId = :communityId AND isDeleted = 0
            LIMIT 1
        ");
        $threadCheck->execute([':threadId' => $threadId, ':communityId' => $communityId]);
        if (!$threadCheck->fetchColumn()) {
            echo json_encode(['success' => false, 'error' => 'Thread not found']);
            return;
        }

        $stmt = $cnx->prepare("
            INSERT INTO community_thread_message (communityId, threadId, userId, message, isDeleted, createdAt)
            VALUES (:communityId, :threadId, :userId, :message, 0, NOW())
        ");
        $ok = $stmt->execute([
            ':communityId' => $communityId,
            ':threadId'    => $threadId,
            ':userId'      => $userId,
            ':message'     => $message,
        ]);

        if (!$ok) {
            echo json_encode(['success' => false, 'error' => 'Unable to send message']);
            return;
        }

        $userName = resolveUserDisplayName($cnx, $userId);
        echo json_encode([
            'success' => true,
            'message' => [
                'id'        => (int) $cnx->lastInsertId(),
                'threadId'  => $threadId,
                'userId'    => $userId,
                'userName'  => $userName,
                'message'   => $message,
                'createdAt' => date('Y-m-d H:i:s'),
                'isMine'    => true,
            ],
        ]);
    } catch (Throwable $e) {
        error_log('[sendThreadMessageAction] ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Unable to send thread message']);
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
                'error'   => 'Database connection failed',
                'detail'  => databaseConnectionError(),
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
            case 'getThreads':         getThreadsAction($cnx);           break;
            case 'createThread':       createThreadAction($cnx);         break;
            case 'deleteThread':       deleteThreadAction($cnx);         break;
            case 'getThreadMessages':  getThreadMessagesAction($cnx);    break;
            case 'sendThreadMessage':  sendThreadMessageAction($cnx);    break;
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
