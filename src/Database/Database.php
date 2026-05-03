<?php
declare(strict_types=1);

namespace IBlog\Database {
    use PDO;

    final class Database
    {
        private static ?self $instance = null;
        private static ?string $fingerprint = null;

        private PDO $connection;

        private function __construct(array $config)
        {
            $dsn = (string) ($config['dsn'] ?? '');
            $user = $config['user'] ?? $config['username'] ?? null;
            $pass = $config['pass'] ?? $config['password'] ?? null;

            if ($dsn === '') {
                $host = (string) ($config['host'] ?? '127.0.0.1');
                $port = (string) ($config['port'] ?? '');
                $name = (string) ($config['name'] ?? $config['dbname'] ?? 'blogdyn');
                $charset = (string) ($config['charset'] ?? 'utf8mb4');
                $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $host, $name, $charset);
                if ($port !== '') {
                    $dsn .= ';port=' . $port;
                }
            }

            $this->connection = new PDO(
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

            if ($this->driver() === 'sqlite') {
                $this->connection->exec('PRAGMA foreign_keys = ON');
            }
        }

        public static function getInstance(array $config): self
        {
            $fingerprint = md5(serialize($config));
            if (self::$instance === null || self::$fingerprint !== $fingerprint) {
                self::$instance = new self($config);
                self::$fingerprint = $fingerprint;
            }

            return self::$instance;
        }

        public static function reset(): void
        {
            self::$instance = null;
            self::$fingerprint = null;
        }

        public function getConnection(): PDO
        {
            return $this->connection;
        }

        public function driver(): string
        {
            return strtolower((string) $this->connection->getAttribute(PDO::ATTR_DRIVER_NAME));
        }
    }
}

namespace {
    use IBlog\Database\Database;

    require_once __DIR__ . '/../Utils/Env.php';
    require_once dirname(__DIR__, 2) . '/config/config.php';

    $databaseConfig = iblogConfig()['database'];
    $GLOBALS['db_server'] = (string) ($databaseConfig['host'] ?? '127.0.0.1');
    $GLOBALS['db_username'] = (string) ($databaseConfig['user'] ?? 'root');
    $GLOBALS['db_pwd'] = (string) ($databaseConfig['pass'] ?? '');
    $GLOBALS['db_name'] = (string) ($databaseConfig['name'] ?? 'blogdyn');

    function dbDriver(?PDO $pdo): string
    {
        if (!$pdo instanceof PDO) {
            return 'unknown';
        }

        return strtolower((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
    }

    function dbTableExists(PDO $cnx, string $table): bool
    {
        try {
            if (dbDriver($cnx) === 'sqlite') {
                $stmt = $cnx->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table");
                $stmt->execute([':table' => $table]);
                return (bool) $stmt->fetchColumn();
            }

            $stmt = $cnx->prepare('SHOW TABLES LIKE :table');
            $stmt->execute([':table' => $table]);
            return (bool) $stmt->fetchColumn();
        } catch (Throwable) {
            return false;
        }
    }

    function dbColumnExists(PDO $cnx, string $table, string $column): bool
    {
        try {
            if (dbDriver($cnx) === 'sqlite') {
                $stmt = $cnx->query("PRAGMA table_info(\"{$table}\")");
                $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
                foreach ($rows as $row) {
                    if ((string) ($row['name'] ?? '') === $column) {
                        return true;
                    }
                }

                return false;
            }

            $stmt = $cnx->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
            $stmt->execute([':column' => $column]);
            return (bool) $stmt->fetchColumn();
        } catch (Throwable) {
            return false;
        }
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
        $config = iblogConfig()['database'];
        $host = $GLOBALS['db_server'] ?? $config['host'] ?? null;
        $hosts = [];

        if (is_string($host) && $host !== '') {
            $hosts[] = $host;
        }

        $hosts[] = '127.0.0.1';
        $hosts[] = 'localhost';

        return array_values(array_unique(array_filter($hosts, static fn($value) => is_string($value) && $value !== '')));
    }

    function databaseNames(): array
    {
        $config = iblogConfig()['database'];
        $name = $GLOBALS['db_name'] ?? $config['name'] ?? null;
        $fallbackNames = $config['fallback_names'] ?? [];
        $candidates = array_merge([$name], is_array($fallbackNames) ? $fallbackNames : [], ['blogdyn']);

        return array_values(array_filter(array_unique($candidates), static fn($value) => is_string($value) && $value !== ''));
    }

    function databasePort(): ?string
    {
        return iblogConfig()['database']['port'] ?? env('DB_PORT', '3306');
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

        $config = iblogConfig()['database'];
        $dsnOverride = $config['dsn'] ?? env('DB_DSN');

        try {
            if (is_string($dsnOverride) && $dsnOverride !== '') {
                $database = Database::getInstance([
                    'dsn' => $dsnOverride,
                    'user' => null,
                    'pass' => null,
                ]);
                $instance = $database->getConnection();
                $GLOBALS['__iblog_db_error_detail'] = 'Connected using DSN override.';
                return $instance;
            }

            $port = databasePort();
            $user = (string) ($GLOBALS['db_username'] ?? $config['user'] ?? 'root');
            $pass = (string) ($GLOBALS['db_pwd'] ?? $config['pass'] ?? '');
            $attempts = [];
            $lastDetail = null;
            $lastException = null;

            foreach (databaseHosts() as $host) {
                foreach (databaseNames() as $name) {
                    $attempts[] = sprintf('%s:%s/%s', $host, $port ?? '', $name);
                    if (!databaseReachable($host, $port)) {
                        $lastDetail = databaseConnectionDetails();
                        continue;
                    }

                    try {
                        $database = Database::getInstance([
                            'host' => $host,
                            'port' => $port,
                            'name' => $name,
                            'user' => $user,
                            'pass' => $pass,
                            'charset' => 'utf8mb4',
                        ]);
                        $instance = $database->getConnection();
                        $GLOBALS['db_server'] = $host;
                        $GLOBALS['db_name'] = $name;
                        $GLOBALS['__iblog_db_error_detail'] = sprintf('Connected using %s:%s/%s.', $host, $port ?? '', $name);
                        return $instance;
                    } catch (Throwable $e) {
                        $lastException = $e;
                        $lastDetail = $e->getMessage();
                        Database::reset();
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
        } catch (Throwable $e) {
            $error = $e->getMessage();
            $GLOBALS['__iblog_db_error'] = $error;
            throw new RuntimeException($error, 0, $e);
        }
    }

    try {
        $cnx = getDatabaseConnection();
    } catch (Throwable $e) {
        $cnx = null;
        $GLOBALS['__iblog_db_error'] = $e->getMessage();
    }
}
