<?php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/community.php';

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

    // Insert creator as member
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
// JOIN / LEAVE
// ─────────────────────────────────────────────────────────
function joinCommunity(PDO $cnx, int $userId, int $communityId): array
{
    // Check already member
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
        // Increment memberCount
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
    if (session_status() === PHP_SESSION_NONE) session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $input       = json_decode(file_get_contents('php://input'), true) ?? [];
    $communityId = (int) ($input['community_id'] ?? 0);

    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    $result = joinCommunity($cnx, (int) $_SESSION['user_id'], $communityId);
    echo json_encode($result);
}

function leaveCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    if (session_status() === PHP_SESSION_NONE) session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $input       = json_decode(file_get_contents('php://input'), true) ?? [];
    $communityId = (int) ($input['community_id'] ?? 0);

    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    $success = leaveCommunity($cnx, (int) $_SESSION['user_id'], $communityId);
    echo json_encode(['success' => $success]);
}

// ─────────────────────────────────────────────────────────
// CHAT MESSAGES
// ─────────────────────────────────────────────────────────
function getMessagesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    if (session_status() === PHP_SESSION_NONE) session_start();

    $communityId = (int) ($_GET['communityId'] ?? 0);
    if (!$communityId) {
        echo json_encode(['success' => false, 'messages' => []]);
        return;
    }

    $stmt = $cnx->prepare("
        SELECT cm.id, cm.userId, cm.message, cm.createdAt,
               u.name AS userName
        FROM community_message cm
        JOIN users u ON u.id = cm.userId
        WHERE cm.communityId = ? AND cm.isDeleted = 0
        ORDER BY cm.createdAt ASC
        LIMIT 200
    ");
    $stmt->execute([$communityId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'messages' => $messages]);
}

function sendMessageAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    if (session_status() === PHP_SESSION_NONE) session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $input       = json_decode(file_get_contents('php://input'), true) ?? [];
    $communityId = (int) ($input['communityId'] ?? 0);
    $message     = trim($input['message'] ?? '');

    if (!$communityId || $message === '') {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }

    $stmt    = $cnx->prepare("
        INSERT INTO community_message (communityId, userId, message, createdAt)
        VALUES (?, ?, ?, NOW())
    ");
    $success = $stmt->execute([$communityId, (int) $_SESSION['user_id'], $message]);
    $newId   = $success ? (int) $cnx->lastInsertId() : null;

    echo json_encode([
        'success' => $success,
        'message' => $success ? ['id' => $newId] : null,
    ]);
}

function checkMembershipAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    if (session_status() === PHP_SESSION_NONE) session_start();

    $communityId = (int) ($_GET['communityId'] ?? 0);
    if (!$communityId || !isset($_SESSION['user_id'])) {
        echo json_encode(['isMember' => false, 'isBanned' => false]);
        return;
    }

    $stmt = $cnx->prepare("
        SELECT isBanned FROM communitymember
        WHERE communityId = ? AND userId = ?
    ");
    $stmt->execute([$communityId, (int) $_SESSION['user_id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(['isMember' => true, 'isBanned' => (bool) $row['isBanned']]);
    } else {
        echo json_encode(['isMember' => false, 'isBanned' => false]);
    }
}

// ─────────────────────────────────────────────────────────
// ROUTER  (only runs when this file is the entry point)
// ─────────────────────────────────────────────────────────
if (basename($_SERVER['SCRIPT_FILENAME']) === 'CommunityController.php') {
    $action = $_GET['action'] ?? '';
    switch ($action) {
        case 'create':          createCommunityAction($cnx);    break;
        case 'join':            joinCommunityAction($cnx);       break;
        case 'leave':           leaveCommunityAction($cnx);      break;
        case 'getMessages':     getMessagesAction($cnx);         break;
        case 'sendMessage':     sendMessageAction($cnx);         break;
        case 'checkMembership': checkMembershipAction($cnx);     break;
        default:
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Action not found: ' . htmlspecialchars($action)]);
    }
}