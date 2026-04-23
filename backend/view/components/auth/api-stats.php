<?php
/**
 * api-stats.php
 * Location : iblog/backend/view/components/auth/api-stats.php
 * Retourne les statistiques publiques de la plateforme.
 */
declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function jsonOk(array $data = []): never
{
    echo json_encode(['ok' => true] + $data);
    exit();
}

function jsonErr(string $msg, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit();
}

try {
    $thisDir     = str_replace('\\', '/', __DIR__);
    $parts       = explode('/', $thisDir);
    $backendPath = implode('/', array_slice($parts, 0, count($parts) - 3));

    if (!file_exists($backendPath . '/config/database.php')) {
        // Return placeholder stats if DB not available
        jsonOk([
            'total_users'    => 0,
            'total_articles' => 0,
            'premium_count'  => 0,
        ]);
    }

    require_once $backendPath . '/config/database.php';

    $totalUsers = (int) $cnx->query("SELECT COUNT(*) FROM users")->fetchColumn();

    $totalArticles = 0;
    try {
        $totalArticles = (int) $cnx->query("SELECT COUNT(*) FROM article WHERE status = 'published'")->fetchColumn();
    } catch (PDOException) {}

    $premiumCount = (int) $cnx->query("SELECT COUNT(*) FROM users WHERE plan = 'premium'")->fetchColumn();

    jsonOk([
        'total_users'    => $totalUsers,
        'total_articles' => $totalArticles,
        'premium_count'  => $premiumCount,
    ]);

} catch (Throwable $e) {
    // Always return valid JSON, never crash
    jsonOk([
        'total_users'    => 0,
        'total_articles' => 0,
        'premium_count'  => 0,
    ]);
}