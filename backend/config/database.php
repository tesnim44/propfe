<?php
declare(strict_types=1);

function getDatabaseConnection(): PDO
{
    static $instance = null;

    if ($instance instanceof PDO) {
        return $instance;
    }

    $host   = 'localhost';
    
    $dbname = 'blogdyn';
    $user   = 'root';
    $pass   = '';

    $instance = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    return $instance;
}

// Always expose $cnx at file scope so every require_once caller gets it directly.
// getDatabaseConnection() uses a static, so this is a single connection regardless
// of how many files require_once this.
$cnx = getDatabaseConnection();