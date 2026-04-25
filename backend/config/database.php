<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

function databaseConnectionError(): ?string
{
    return $GLOBALS['__iblog_db_error'] ?? null;
}

function getDatabaseConnection(): PDO
{
    static $instance = null;
    static $error = null;

    if ($instance instanceof PDO) {
        return $instance;
    }

    if (is_string($error)) {
        throw new RuntimeException($error);
    }

    loadEnvFile();

    $host = env('DB_HOST', '127.0.0.1');
    $port = env('DB_PORT', '3306');
    $dbname = env('DB_NAME', 'blogdyn');
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASS', '');

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $dbname);
    if ($port !== null && $port !== '') {
        $dsn .= ';port=' . $port;
    }

    try {
        $instance = new PDO(
            $dsn,
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    } catch (Throwable $e) {
        $error = sprintf(
            'Database connection failed. Check MySQL/XAMPP and DB settings (host=%s, port=%s, db=%s).',
            $host,
            $port ?? '',
            $dbname
        );
        $GLOBALS['__iblog_db_error'] = $error;
        throw new RuntimeException($error, 0, $e);
    }

    return $instance;
}

try {
    $cnx = getDatabaseConnection();
} catch (Throwable $e) {
    $cnx = null;
    $GLOBALS['__iblog_db_error'] = $e->getMessage();
}
