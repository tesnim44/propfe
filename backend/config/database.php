<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

loadEnvFile();

$db_server="127.0.0.1";
$db_username="root";
$db_pwd="";
$db_name="blogdyn";

if (($envHost = env('DB_HOST')) !== null) {
    $db_server = $envHost;
}
if (($envUser = env('DB_USER')) !== null) {
    $db_username = $envUser;
}
if (($envPass = env('DB_PASS')) !== null) {
    $db_pwd = $envPass;
}
if (($envName = env('DB_NAME')) !== null) {
    $db_name = $envName;
}

function databaseConnectionError(): ?string
{
    return $GLOBALS['__iblog_db_error'] ?? null;
}

function databaseConnectionDetails(): ?string
{
    return $GLOBALS['__iblog_db_error_detail'] ?? null;
}

function databaseHosts(): array
{
    $host = $GLOBALS['db_server'] ?? env('DB_HOST');
    $hosts = [];
    if (is_string($host) && $host !== '') {
        $hosts[] = $host;
    }

    $hosts[] = '127.0.0.1';
    $hosts[] = 'localhost';

    return array_values(array_unique(array_filter($hosts, static fn ($value) => is_string($value) && $value !== '')));
}

function databaseNames(): array
{
    $name = $GLOBALS['db_name'] ?? env('DB_NAME');
    $projectName = basename(dirname(__DIR__, 2));
    $candidates = [
        $name,
        $projectName,
        'blog_123',
        'blogdyn',
        $projectName,
        'iblog_bd',
        'iblog',
        'database1',
    ];

    return array_values(array_filter(array_unique($candidates), static fn ($value) => is_string($value) && $value !== ''));
}

function databasePort(): ?string
{
    return env('DB_PORT', '3306');
}

function databaseReachable(string $host, ?string $port): bool
{
    if ($port === null || $port === '') {
        return true;
    }

    $socket = @fsockopen($host, (int) $port, $errno, $errstr, 1.5);
    if (!is_resource($socket)) {
        $GLOBALS['__iblog_db_error_detail'] = sprintf(
            'MySQL is not reachable at %s:%s (%s %s).',
            $host,
            $port,
            $errno,
            trim((string) $errstr)
        );
        return false;
    }

    fclose($socket);
    return true;
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

    $hosts = databaseHosts();
    $port = databasePort();
    $dbNames = databaseNames();
    $user = (string) ($GLOBALS['db_username'] ?? env('DB_USER', 'root'));
    $pass = (string) ($GLOBALS['db_pwd'] ?? env('DB_PASS', ''));
    $attempts = [];
    $lastException = null;
    $lastDetail = null;

    foreach ($hosts as $host) {
        foreach ($dbNames as $dbname) {
            $attempts[] = sprintf('%s:%s/%s', $host, $port ?? '', $dbname);

            if (!databaseReachable($host, $port)) {
                $lastDetail = databaseConnectionDetails();
                continue;
            }

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
                        PDO::ATTR_TIMEOUT => 3,
                    ]
                );
                $GLOBALS['db_server'] = $host;
                $GLOBALS['db_name'] = $dbname;
                $GLOBALS['__iblog_db_error_detail'] = sprintf('Connected using %s:%s/%s.', $host, $port ?? '', $dbname);
                return $instance;
            } catch (Throwable $e) {
                $lastException = $e;
                $lastDetail = $e->getMessage();
            }
        }
    }

    $error = sprintf(
        'Database connection failed. Check MySQL/XAMPP and DB settings. Tried: %s.',
        implode(', ', $attempts)
    );

    if (is_string($lastDetail) && $lastDetail !== '') {
        $error .= ' Last error: ' . $lastDetail;
    }

    $GLOBALS['__iblog_db_error'] = $error;
    throw new RuntimeException($error, 0, $lastException instanceof Throwable ? $lastException : null);
}

try {
    $cnx = getDatabaseConnection();
} catch (Throwable $e) {
    $cnx = null;
    $GLOBALS['__iblog_db_error'] = $e->getMessage();
}
