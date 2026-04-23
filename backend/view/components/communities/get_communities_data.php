<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

header('Content-Type: application/json');

require_once __DIR__ . '/../../../config/database.php';

try {
    $stmt = $cnx->query("
        SELECT c.id, c.name, c.description, c.icon, c.topics, c.memberCount, c.createdAt,
               u.name AS creator_name
        FROM community c
        LEFT JOIN users u ON u.id = c.creatorId
        ORDER BY c.createdAt DESC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $communities = array_map(function ($row) {
        return [
            'id'          => (int) $row['id'],
            'name'        => $row['name'],
            'description' => $row['description'] ?? '',
            'iconLetter'  => $row['icon'] ?: strtoupper(substr($row['name'], 0, 2)),
            'memberCount' => (int) ($row['memberCount'] ?? 0),
            'creatorName' => $row['creator_name'] ?? null,
            'tags'        => !empty($row['topics'])
                             ? array_map('trim', explode(',', $row['topics']))
                             : [],
        ];
    }, $rows);

    echo json_encode($communities);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}