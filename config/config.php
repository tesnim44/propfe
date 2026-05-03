<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Utils/Env.php';

loadEnvFile();

function iblogConfig(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    $projectName = basename(dirname(__DIR__));

    $config = [
        'app' => [
            'name' => 'IBlog',
            'env' => env('APP_ENV', 'production') ?? 'production',
            'root' => dirname(__DIR__),
        ],
        'database' => [
            'dsn' => env('DB_DSN'),
            'host' => env('DB_HOST', '127.0.0.1') ?? '127.0.0.1',
            'port' => env('DB_PORT', '3306') ?? '3306',
            'user' => env('DB_USER', 'root') ?? 'root',
            'pass' => env('DB_PASS', '') ?? '',
            'name' => env('DB_NAME', 'blogdyn') ?? 'blogdyn',
            'fallback_names' => array_values(array_unique([$projectName, 'blogdyn'])),
        ],
    ];

    return $config;
}
