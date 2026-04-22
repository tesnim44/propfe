<?php

declare(strict_types=1);

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/community.php';

// ----------------------------------------------------------------------
// CREATE
// ----------------------------------------------------------------------
function createCommunity(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO community (creatorId, name, description, icon, topics, memberCount, createdAt)
            VALUES (:creatorId, :name, :description, :icon, :topics, :memberCount, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':creatorId' => $data['creatorId'] ?? null,
        ':name'      => $data['name'] ?? '',
        ':description'=> $data['description'] ?? '',
        ':icon'      => $data['icon'] ?? '',
        ':topics'    => $data['topics'] ?? null,
        ':memberCount'=> 1,
    ]);
}

function createCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    if (!isset($_SESSION['isPremium']) || !$_SESSION['isPremium']) {
        echo json_encode(['success' => false, 'error' => 'Premium subscription required']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['name'] ?? '');
    $desc = trim($input['description'] ?? '');
    $tags = trim($input['topics'] ?? '');

    if (empty($name) || empty($desc)) {
        echo json_encode(['success' => false, 'error' => 'Name and description required']);
        return;
    }

    $icon = strtoupper(substr($name, 0, 2));
    $topics = !empty($tags) ? implode(',', array_map('trim', explode(',', $tags))) : null;

    // Prepare data for the helper function
    $data = [
        'creatorId'   => $_SESSION['user_id'],
        'name'        => $name,
        'description' => $desc,
        'icon'        => $icon,
        'topics'      => $topics
    ];

    // Call the helper function
    $success = createCommunity($cnx, $data);

    if (!$success) {
        echo json_encode(['success' => false, 'error' => 'Failed to create community']);
        return;
    }

    // Get the last inserted ID
    $communityId = $cnx->lastInsertId();

    // Insert creator as member
    $stmt2 = $cnx->prepare("
        INSERT INTO communitymember (communityId, userId, role, joinedAt)
        VALUES (:communityId, :userId, 'creator', NOW())
    ");
    $stmt2->execute([
        ':communityId' => $communityId,
        ':userId'      => $_SESSION['user_id']
    ]);

    echo json_encode(['success' => true]);
}


// ----------------------------------------------------------------------
// READ / LIST
// ----------------------------------------------------------------------
function getAllCommunities(PDO $cnx): array
{
    $stmt = $cnx->query("
        SELECT c.*, u.name as creator_name
        FROM community c
        LEFT JOIN users u ON u.id = c.creatorId
        ORDER BY c.createdAt DESC
    ");
    $rows = $stmt->fetchAll();

    $communities = [];
    foreach ($rows as $row) {
        $communities[] = [
            'id'          => $row['id'],
            'name'        => $row['name'],
            'description' => $row['description'],
            'iconLetter'  => $row['icon'] ?? substr($row['name'], 0, 2),
            'memberCount' => $row['memberCount'],
            'creatorName' => $row['creator_name'],
            'tags'        => !empty($row['topics']) ? explode(',', $row['topics']) : []
        ];
    }
    return $communities;
}


function getCommunityById(PDO $cnx, int $id): ?Community
{
    $stmt = $cnx->prepare('
        SELECT c.*, u.name as creator_name
        FROM community c
        LEFT JOIN users u ON u.id = c.creatorId
        WHERE c.id = :id LIMIT 1
    ');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateCommunity($row) : null;
}

function getUserCommunities(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare('
        SELECT c.*, u.name as creator_name, cm.role as user_role
        FROM community c
        INNER JOIN communitymember cm ON cm.communityId = c.id
        LEFT JOIN users u ON u.id = c.creatorId
        WHERE cm.userId = :userId AND cm.isBanned = 0
        ORDER BY c.name
    ');
    $stmt->execute([':userId' => $userId]);
    $rows = $stmt->fetchAll();
    return array_map('hydrateCommunity', $rows);
}


//--to retrieve communities that a specific user has joined and return them as a simple associative array--
   function getUserCommunitiesAsArray(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare('
        SELECT c.*, u.name as creator_name, cm.role as user_role
        FROM community c
        INNER JOIN communitymember cm ON cm.communityId = c.id
        LEFT JOIN users u ON u.id = c.creatorId
        WHERE cm.userId = :userId AND cm.isBanned = 0
        ORDER BY c.name
    ');
    $stmt->execute([':userId' => $userId]);
    $rows = $stmt->fetchAll();
    
    $output = [];
    foreach($rows as $row) {
        $output[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'iconLetter' => $row['iconLetter'] ?? substr($row['name'], 0, 2),
            'memberCount' => $row['memberCount']
        ];
    }
    return $output;
}



    
// // ----------------------------------------------------------------------
// // UPDATE / DELETE
// // ----------------------------------------------------------------------
// //function à developper apres
// function updateCommunity(PDO $cnx, int $id, array $data): bool
// {
//     $community = getCommunityById($cnx, $id);
//     if (!$community) {
//         return false;
//     }

//     $sql = 'UPDATE community
//             SET name = :name,
//                 description = :description,
//                 icon = :icon,
//                 topics = :topics
//             WHERE id = :id';

//     $stmt = $cnx->prepare($sql);

//     return $stmt->execute([
//         ':id'          => $id,
//         ':name'        => $data['name'] ?? $community->name,
//         ':description' => $data['description'] ?? $community->description,
//         ':icon'        => $data['icon'] ?? $community->icon,
//         ':topics'      => $data['topics'] ?? $community->topics,
//     ]);
// }

// function deleteCommunity(PDO $cnx, int $id): bool
// {
//     $stmt = $cnx->prepare('DELETE FROM community WHERE id = :id');
//     return $stmt->execute([':id' => $id]);
// }



// ----------------------------------------------------------------------
// JOIN / LEAVE
// ----------------------------------------------------------------------
function joinCommunity(PDO $cnx, int $userId, int $communityId): bool
{
    // Vérifier si déjà membre
    $stmt = $cnx->prepare('SELECT * FROM communitymember WHERE communityId = :communityId AND userId = :userId');
    $stmt->execute([':communityId' => $communityId, ':userId' => $userId]);
    if ($stmt->rowCount() > 0) {
        return false;
    }

    $stmt = $cnx->prepare('
        INSERT INTO communitymember (communityId, userId, role, joinedAt)
        VALUES (:communityId, :userId, "member", NOW())
    ');
    return $stmt->execute([
        ':communityId' => $communityId,
        ':userId'      => $userId
    ]);
}

function leaveCommunity(PDO $cnx, int $userId, int $communityId): bool
{
    $stmt = $cnx->prepare('DELETE FROM communitymember WHERE communityId = :communityId AND userId = :userId');
    return $stmt->execute([':communityId' => $communityId, ':userId' => $userId]);
}




// Actions AJAX pour join / leave
//add a user to a community in the database
function joinCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $communityId = (int)($input['community_id'] ?? 0);
    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    $success = joinCommunity($cnx, $_SESSION['user_id'], $communityId);
    echo json_encode(['success' => $success]);
}

function leaveCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    session_start();

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $communityId = (int)($input['community_id'] ?? 0);
    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    $success = leaveCommunity($cnx, $_SESSION['user_id'], $communityId);
    echo json_encode(['success' => $success]);
}

// ----------------------------------------------------------------------
// HYDRAZION
// ----------------------------------------------------------------------
function hydrateCommunity(array $row): Community
{
    $topics = [];
    if (!empty($row['topics'])) {
        $topics = explode(',', $row['topics']);
        $topics = array_map('trim', $topics);
    }

    $community = new Community(
        $row['creatorId'] ?? null,
        $row['name'] ?? '',
        $row['description'] ?? '',
        $row['icon'] ?? '',
        false,
        $topics,
        $row['category'] ?? null
    );

    $community->id          = (int)($row['id'] ?? 0);
    $community->memberCount = (int)($row['memberCount'] ?? 1);
    $community->createdAt   = $row['createdAt'] ?? null;
    $community->creatorName = $row['creator_name'] ?? null;
    $community->userRole    = $row['user_role'] ?? null;

    return $community;
}


//----------------chat
function getMessagesAction(PDO $cnx): void {
    header('Content-Type: application/json');
    session_start();
    $communityId = (int)($_GET['communityId'] ?? 0);
    if (!$communityId) {
        echo json_encode(['success' => false, 'messages' => []]);
        return;
    }
    $stmt = $cnx->prepare("
        SELECT cm.id, cm.message, cm.created_at, u.name as userName
        FROM community_message cm
        JOIN users u ON u.id = cm.userId
        WHERE cm.communityId = ? AND cm.isDeleted = 0
        ORDER BY cm.created_at ASC
    ");
    $stmt->execute([$communityId]);
    $messages = $stmt->fetchAll();
    echo json_encode(['success' => true, 'messages' => $messages]);
}

function sendMessageAction(PDO $cnx): void {
    header('Content-Type: application/json');
    session_start();
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $communityId = (int)($input['communityId'] ?? 0);
    $message = trim($input['message'] ?? '');
    if (!$communityId || !$message) {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }
    // Optional: check membership
    $stmt = $cnx->prepare("INSERT INTO community_message (communityId, userId, message, createdAt) VALUES (?, ?, ?, NOW())");
    $success = $stmt->execute([$communityId, $_SESSION['user_id'], $message]);
    echo json_encode(['success' => $success, 'message' => $success ? ['id' => $cnx->lastInsertId()] : null]);
}

function checkMembershipAction(PDO $cnx): void {
    header('Content-Type: application/json');
    session_start();
    $communityId = (int)($_GET['communityId'] ?? 0);
    if (!$communityId) {
        echo json_encode(['isMember' => false, 'isBanned' => false]);
        return;
    }
    $stmt = $cnx->prepare("SELECT isBanned FROM communitymember WHERE communityId = ? AND userId = ?");
    $stmt->execute([$communityId, $_SESSION['user_id']]);
    $row = $stmt->fetch();
    if ($row) {
        echo json_encode(['isMember' => true, 'isBanned' => (bool)$row['isBanned']]);
    } else {
        echo json_encode(['isMember' => false, 'isBanned' => false]);
    }
}

// ----------------------------------------------------------------------
// ROUTEUR (exécuté uniquement si ce fichier est le point d'entrée)
// ----------------------------------------------------------------------
if (basename($_SERVER['SCRIPT_FILENAME']) == 'CommunityController.php') {
    $action = $_GET['action'] ?? '';
    switch ($action) {
        case 'create':
            createCommunityAction($cnx);
            break;
        case 'join':
            joinCommunityAction($cnx);
            break;
        case 'leave':
            leaveCommunityAction($cnx);
            break;
        case 'getMessages':
            getMessagesAction($cnx);
            break;
        case 'sendMessage':
            sendMessageAction($cnx);
            break;
        case 'checkMembership':
            checkMembershipAction($cnx);
            break;
        default:
            header('HTTP/1.0 404 Not Found');
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Action not found']);
            break;
    }
}
?>