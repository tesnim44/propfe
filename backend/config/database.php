<?php

declare(strict_types=1);

function getDatabaseConnection(): PDO
{
    static $cnx = null;

    if ($cnx instanceof PDO) {
        return $cnx;
    }

    $host = 'localhost';
    $dbname = 'iblog_bd';
    $user = 'root';
    $pass = '';

    $cnx = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $cnx;
}

$cnx = getDatabaseConnection();
