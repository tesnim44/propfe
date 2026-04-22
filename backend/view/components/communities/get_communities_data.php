<?php
declare(strict_types=1);
 
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controller/CommunityController.php';
 
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
 
try {
    $communities = getAllCommunities($cnx);
    echo json_encode($communities);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load communities', 'detail' => $e->getMessage()]);
}
 