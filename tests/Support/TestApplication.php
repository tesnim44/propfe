<?php
declare(strict_types=1);

namespace IBlog\Tests\Support;

use PDO;
use RuntimeException;

final class TestApplication
{
    private static ?string $baseUrl = null;
    private static ?string $databasePath = null;
    private static ?PDO $pdo = null;
    private static $serverProcess = null;
    private static bool $ownsServer = false;
    private static bool $shutdownRegistered = false;

    public static function rootPath(): string
    {
        return dirname(__DIR__, 2);
    }

    public static function runtimeDirectory(): string
    {
        $path = self::rootPath() . DIRECTORY_SEPARATOR . 'tests' . DIRECTORY_SEPARATOR . 'runtime';
        if (!is_dir($path) && !mkdir($path, 0777, true) && !is_dir($path)) {
            throw new RuntimeException('Unable to create test runtime directory.');
        }

        return $path;
    }

    public static function databasePath(): string
    {
        if (self::$databasePath === null) {
            self::$databasePath = rtrim(sys_get_temp_dir(), '\\/') . DIRECTORY_SEPARATOR . 'iblog-functional-' . getmypid() . '.sqlite';
        }

        return self::$databasePath;
    }

    public static function databaseDsn(): string
    {
        return 'sqlite:' . str_replace('\\', '/', self::databasePath());
    }

    public static function sessionDirectory(): string
    {
        $path = rtrim(sys_get_temp_dir(), '\\/') . DIRECTORY_SEPARATOR . 'iblog-functional-sessions-' . getmypid();
        if (!is_dir($path) && !mkdir($path, 0777, true) && !is_dir($path)) {
            throw new RuntimeException('Unable to create test session directory.');
        }

        return $path;
    }

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        self::$pdo = new PDO(self::databaseDsn());
        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        self::$pdo->exec('PRAGMA foreign_keys = ON');

        return self::$pdo;
    }

    public static function resetDatabase(): void
    {
        self::$pdo = null;
        $pdo = self::pdo();
        self::dropSchema($pdo);
        self::createSchema($pdo);
        self::seedBaseData($pdo);
    }

    public static function baseUrl(): string
    {
        if (self::$baseUrl === null) {
            $configured = getenv('IBLOG_TEST_BASE_URL');
            self::$baseUrl = rtrim($configured !== false && $configured !== '' ? $configured : self::defaultBaseUrl(), '/');
            self::startServer();
        }

        return self::$baseUrl ?? throw new RuntimeException('Test server did not start.');
    }

    public static function startServer(): void
    {
        $healthUrl = self::$baseUrl . '/backend/view/components/auth/api-auth.php';
        if (self::waitForServer($healthUrl)) {
            return;
        }

        if (!self::canAutoStartServer()) {
            throw new RuntimeException(
                'Test server is not reachable. Start the suite with tests/run-test-suite.ps1 or provide IBLOG_TEST_BASE_URL.'
            );
        }

        if (!self::spawnServer()) {
            $details = self::serverErrorSummary();
            self::stopServer();
            throw new RuntimeException('Test server did not start correctly.' . ($details !== '' ? ' ' . $details : ''));
        }
    }

    public static function stopServer(): void
    {
        if (self::$ownsServer && is_resource(self::$serverProcess)) {
            @proc_terminate(self::$serverProcess);
            @proc_close(self::$serverProcess);
        }

        self::$serverProcess = null;
        self::$ownsServer = false;
        self::$baseUrl = null;
    }

    public static function createClient(): WebClient
    {
        $configured = getenv('IBLOG_TEST_BASE_URL');
        if ($configured === false || $configured === '') {
            self::bootstrapEnvironment();
            return new WebClient('local://iblog', self::rootPath());
        }

        return new WebClient(self::baseUrl());
    }

    private static function waitForServer(string $url, float $timeoutSeconds = 5.0): bool
    {
        $start = microtime(true);
        do {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HEADER => false,
                CURLOPT_TIMEOUT_MS => 500,
                CURLOPT_CUSTOMREQUEST => 'GET',
            ]);
            curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            curl_close($ch);

            if ($status > 0) {
                return true;
            }

            usleep(100000);
        } while ((microtime(true) - $start) < $timeoutSeconds);

        return false;
    }

    private static function defaultBaseUrl(): string
    {
        return 'http://127.0.0.1:18080';
    }

    private static function canAutoStartServer(): bool
    {
        $parts = parse_url((string) self::$baseUrl);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $scheme = strtolower((string) ($parts['scheme'] ?? 'http'));

        return $scheme === 'http' && in_array($host, ['127.0.0.1', 'localhost'], true);
    }

    private static function bootstrapEnvironment(): void
    {
        self::setEnvValue('DB_DSN', self::databaseDsn());
        self::setEnvValue('APP_ENV', 'test');
        self::setEnvValue('MAIL_DISABLE', '1');
        self::setEnvValue('IBLOG_TEST_BASE_URL', (string) self::$baseUrl);
    }

    private static function setEnvValue(string $name, string $value): void
    {
        $_ENV[$name] = $value;
        putenv($name . '=' . $value);
    }

    private static function spawnServer(): bool
    {
        if (self::$serverProcess !== null) {
            return true;
        }

        if (!function_exists('proc_open')) {
            throw new RuntimeException('Cannot auto-start the test server because proc_open is unavailable.');
        }

        $stdout = self::runtimeDirectory() . DIRECTORY_SEPARATOR . 'server.out.log';
        $stderr = self::runtimeDirectory() . DIRECTORY_SEPARATOR . 'server.err.log';
        foreach (self::serverCandidates() as $candidateBaseUrl) {
            self::$baseUrl = $candidateBaseUrl;
            self::bootstrapEnvironment();
            file_put_contents($stdout, '');
            file_put_contents($stderr, '');

            $parts = parse_url($candidateBaseUrl);
            $host = (string) ($parts['host'] ?? '127.0.0.1');
            $port = (int) ($parts['port'] ?? 18080);
            $address = $host . ':' . $port;

            $command = [
                PHP_BINARY,
                '-d',
                'session.save_path=' . self::sessionDirectory(),
                '-S',
                $address,
                '-t',
                self::rootPath(),
            ];

            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['file', $stdout, 'a'],
                2 => ['file', $stderr, 'a'],
            ];

            $environment = array_merge($_ENV, [
                'DB_DSN' => self::databaseDsn(),
                'APP_ENV' => 'test',
                'MAIL_DISABLE' => '1',
                'IBLOG_TEST_BASE_URL' => $candidateBaseUrl,
            ]);

            $process = @proc_open($command, $descriptors, $pipes, self::rootPath(), $environment, ['bypass_shell' => true]);
            if (!is_resource($process)) {
                continue;
            }

            if (isset($pipes[0]) && is_resource($pipes[0])) {
                fclose($pipes[0]);
            }

            self::$serverProcess = $process;
            self::$ownsServer = true;

            if (self::waitForServer($candidateBaseUrl . '/backend/view/components/auth/api-auth.php', 3.0)) {
                if (!self::$shutdownRegistered) {
                    register_shutdown_function(static function (): void {
                        TestApplication::stopServer();
                    });
                    self::$shutdownRegistered = true;
                }

                return true;
            }

            self::stopOwnedServerProcessOnly();
        }

        return false;
    }

    private static function serverCandidates(): array
    {
        $configured = getenv('IBLOG_TEST_BASE_URL');
        if ($configured !== false && $configured !== '') {
            return [rtrim($configured, '/')];
        }

        $candidates = [];
        for ($port = 18080; $port <= 18089; $port++) {
            $candidates[] = 'http://127.0.0.1:' . $port;
        }

        return $candidates;
    }

    private static function stopOwnedServerProcessOnly(): void
    {
        if (self::$ownsServer && is_resource(self::$serverProcess)) {
            @proc_terminate(self::$serverProcess);
            @proc_close(self::$serverProcess);
        }

        self::$serverProcess = null;
        self::$ownsServer = false;
    }

    private static function serverErrorSummary(): string
    {
        $stderr = self::runtimeDirectory() . DIRECTORY_SEPARATOR . 'server.err.log';
        if (!is_file($stderr)) {
            return '';
        }

        $contents = trim((string) file_get_contents($stderr));
        if ($contents === '') {
            return '';
        }

        $lines = preg_split('/\R/', $contents) ?: [];
        $tail = array_slice($lines, -3);

        return 'Server log: ' . implode(' | ', $tail);
    }

    private static function createSchema(PDO $pdo): void
    {
        $statements = [
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                isPremium INTEGER NOT NULL DEFAULT 0,
                isAdmin INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                bio TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                cover TEXT DEFAULT '',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                category TEXT DEFAULT 'General',
                tags TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'draft',
                coverImage TEXT DEFAULT '',
                readingTime TEXT DEFAULT '1 min',
                likesCount INTEGER NOT NULL DEFAULT 0,
                views INTEGER NOT NULL DEFAULT 0,
                label TEXT NOT NULL DEFAULT 'none',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE savedarticle (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                articleId INTEGER NOT NULL,
                savedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (userId, articleId)
            )",
            "CREATE TABLE comment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                articleId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                body TEXT NOT NULL,
                parentId INTEGER DEFAULT NULL,
                likesCount INTEGER NOT NULL DEFAULT 0,
                isFlagged INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE community (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                creatorId INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL,
                topics TEXT DEFAULT NULL,
                memberCount INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE communitymember (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                communityId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                role TEXT NOT NULL DEFAULT 'member',
                joinedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                isBanned INTEGER NOT NULL DEFAULT 0,
                UNIQUE (communityId, userId)
            )",
            "CREATE TABLE community_message (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                communityId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                message TEXT NOT NULL,
                isDeleted INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE subscription (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                plan TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'TND',
                status TEXT NOT NULL DEFAULT 'active',
                method TEXT NOT NULL DEFAULT 'card',
                startedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expiresAt TEXT DEFAULT NULL
            )",
        ];

        foreach ($statements as $statement) {
            $pdo->exec($statement);
        }
    }

    private static function dropSchema(PDO $pdo): void
    {
        $pdo->exec('PRAGMA foreign_keys = OFF');
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
            ?->fetchAll(PDO::FETCH_COLUMN) ?: [];

        foreach ($tables as $table) {
            if (!is_string($table) || $table === '') {
                continue;
            }

            $pdo->exec('DROP TABLE IF EXISTS "' . str_replace('"', '""', $table) . '"');
        }

        $pdo->exec('PRAGMA foreign_keys = ON');
    }

    private static function seedBaseData(PDO $pdo): void
    {
        $password = password_hash('StrongPass1!', PASSWORD_DEFAULT);

        $users = [
            [1, 'Admin Root', 'admin@example.com', $password, 'premium', 1, 1, 'active'],
            [2, 'Free User', 'free@example.com', $password, 'free', 0, 0, 'active'],
            [3, 'Premium User', 'premium@example.com', $password, 'premium', 1, 0, 'active'],
            [4, 'Other Writer', 'other@example.com', $password, 'free', 0, 0, 'active'],
        ];

        $userStmt = $pdo->prepare(
            'INSERT INTO users (id, name, email, password, plan, isPremium, isAdmin, status, bio, avatar, cover, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($users as $user) {
            $userStmt->execute([
                $user[0],
                $user[1],
                $user[2],
                $user[3],
                $user[4],
                $user[5],
                $user[6],
                $user[7],
                'Bio for ' . $user[1],
                '',
                '',
                '2026-01-01 10:00:00',
            ]);
        }

        $articleStmt = $pdo->prepare(
            'INSERT INTO article (id, userId, title, body, category, tags, status, coverImage, readingTime, likesCount, views, label, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $articleStmt->execute([
            1,
            4,
            'Searchable Article Alpha',
            'This published article contains alpha keyword content for search and comment tests.',
            'AI',
            'alpha,search',
            'published',
            '',
            '2 min',
            0,
            12,
            'none',
            '2026-01-10 09:00:00',
        ]);
        $articleStmt->execute([
            2,
            4,
            'Community Search Story',
            'A second published article focused on community workflows and search results.',
            'Culture',
            'community,filter',
            'published',
            '',
            '3 min',
            0,
            4,
            'none',
            '2026-01-11 10:00:00',
        ]);
        $articleStmt->execute([
            3,
            2,
            'Existing Draft',
            'This draft belongs to the free user and should not appear in public search.',
            'General',
            'draft',
            'draft',
            '',
            '1 min',
            0,
            0,
            'none',
            '2026-01-12 11:00:00',
        ]);

        $communityStmt = $pdo->prepare(
            'INSERT INTO community (id, creatorId, name, description, icon, topics, memberCount, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $communityStmt->execute([
            1,
            3,
            'Quality Writers',
            'A community for premium and free writers.',
            'QW',
            'writing,quality,community',
            1,
            '2026-01-15 08:00:00',
        ]);

        $communityMemberStmt = $pdo->prepare(
            'INSERT INTO communitymember (communityId, userId, role, joinedAt, isBanned)
             VALUES (?, ?, ?, ?, ?)'
        );
        $communityMemberStmt->execute([1, 3, 'creator', '2026-01-15 08:05:00', 0]);

        $subscriptionStmt = $pdo->prepare(
            'INSERT INTO subscription (userId, plan, amount, currency, status, method, startedAt, expiresAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $subscriptionStmt->execute([3, 'premium', 9.00, 'TND', 'active', 'card', '2026-01-01 00:00:00', '2026-02-01 00:00:00']);
        $subscriptionStmt->execute([1, 'premium', 9.00, 'TND', 'active', 'card', '2026-01-01 00:00:00', '2026-02-01 00:00:00']);
    }
}
