<?php
// /propfe/backend/view/components/communities/get_user_communities.php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

try {
    require_once __DIR__ . '/../../../config/database.php';
    
    $userId = (int) $_SESSION['user_id'];
    
    // IMPORTANT: Filter by user's joined communities only
    $stmt = $cnx->prepare("
        SELECT c.id, c.name, c.icon, c.memberCount
        FROM community c
        INNER JOIN communitymember cm ON cm.communityId = c.id
        WHERE cm.userId = :userId AND cm.isBanned = 0
        ORDER BY c.name ASC
    ");
    $stmt->execute([':userId' => $userId]);
    
    $communities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the response
    $result = array_map(function($row) {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'iconLetter' => $row['icon'] ?: strtoupper(substr($row['name'], 0, 2)),
            'memberCount' => (int) ($row['memberCount'] ?? 0)
        ];
    }, $communities);
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Error in get_user_communities.php: ' . $e->getMessage());
    echo json_encode([]);
}