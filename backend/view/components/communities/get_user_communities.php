<?php
declare(strict_types=1);

session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controller/CommunityController.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

try {
    $userId = (int) $_SESSION['user_id'];

    $stmt = $cnx->prepare('
        SELECT c.id, c.name, c.icon, c.memberCount
        FROM community c
        INNER JOIN communitymember cm ON cm.communityId = c.id
        WHERE cm.userId = :userId AND cm.isBanned = 0
        ORDER BY c.name
    ');
    $stmt->execute([':userId' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $output = array_map(function ($row) {
        return [
            'id'          => (int) $row['id'],
            'name'        => $row['name'],
            'iconLetter'  => $row['icon'] ?: strtoupper(substr($row['name'], 0, 2)),
            'memberCount' => (int) $row['memberCount'],
        ];
    }, $rows);

    echo json_encode($output);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load user communities', 'detail' => $e->getMessage()]);
}