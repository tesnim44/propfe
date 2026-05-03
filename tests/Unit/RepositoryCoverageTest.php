<?php
declare(strict_types=1);

namespace IBlog\Tests\Unit;

use IBlog\Database\FakeDatabase;
use IBlog\Repository\ArticleRepository;
use IBlog\Repository\SavedArticleRepository;
use IBlog\Repository\UserRepository;
use PHPUnit\Framework\TestCase;
use PDO;

final class RepositoryCoverageTest extends TestCase
{
    public function testArticleRepositoryCoversMissingBranchesAndAlternateSchemas(): void
    {
        $pdoNoAvatar = $this->createArticleSchema(false, false);
        $repoNoAvatar = new ArticleRepository($pdoNoAvatar);
        $publishedNoAvatar = $repoNoAvatar->findPublished();
        $this->assertSame('', $publishedNoAvatar[0]->author_avatar ?? null);
        $this->assertFalse($repoNoAvatar->update(999, ['title' => 'Missing']));

        $pdoProfileOnly = $this->createArticleSchema(true, false);
        $repoProfileOnly = new ArticleRepository($pdoProfileOnly);
        $publishedProfileOnly = $repoProfileOnly->findPublished();
        $this->assertSame('profile-avatar.png', $publishedProfileOnly[0]->author_avatar ?? null);
    }

    public function testSavedArticleRepositoryCoversAlternateSchemas(): void
    {
        $pdoNoAvatar = $this->createSavedArticleSchema(false, false);
        $repoNoAvatar = new SavedArticleRepository($pdoNoAvatar);
        $rowsNoAvatar = $repoNoAvatar->findByUser(2);
        $this->assertSame('', $rowsNoAvatar[0]['author_avatar'] ?? null);

        $pdoProfileOnly = $this->createSavedArticleSchema(true, false);
        $repoProfileOnly = new SavedArticleRepository($pdoProfileOnly);
        $rowsProfileOnly = $repoProfileOnly->findByUser(2);
        $this->assertSame('profile-avatar.png', $rowsProfileOnly[0]['author_avatar'] ?? null);
    }

    public function testUserRepositoryCoversMissingUserAndSubscriptionFallbackBranches(): void
    {
        $pdo = FakeDatabase::sqlite();
        $pdo->exec(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                isPremium INTEGER NOT NULL DEFAULT 0,
                isAdmin INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        );

        $stmt = $pdo->prepare(
            'INSERT INTO users (id, name, email, password, plan, isPremium, isAdmin, status, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            1,
            'Sample User',
            'sample@example.com',
            password_hash('StrongPass1!', PASSWORD_DEFAULT),
            'free',
            0,
            0,
            'active',
            '2026-01-01 00:00:00',
        ]);

        $repo = new UserRepository($pdo);
        $this->assertFalse($repo->authenticate('missing@example.com', 'StrongPass1!'));
        $this->assertFalse($repo->update(999, ['name' => 'Missing']));
        $this->assertTrue($repo->upgradeToPremium(1, 'card', 9.0));

        $updated = $repo->findById(1);
        $this->assertIsArray($updated);
        $this->assertSame('premium', $updated['plan'] ?? null);
        $this->assertSame(1, (int) ($updated['isPremium'] ?? 0));
    }

    public function testUserRepositoryCoversAllPublicMethodsDirectly(): void
    {
        $pdo = FakeDatabase::sqlite();
        $pdo->exec(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                isPremium INTEGER NOT NULL DEFAULT 0,
                isAdmin INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        );
        $pdo->exec(
            "CREATE TABLE subscription (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                plan TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                status TEXT NOT NULL,
                method TEXT NOT NULL,
                startedAt TEXT NOT NULL,
                expiresAt TEXT NOT NULL
            )"
        );

        $repo = new UserRepository($pdo);

        $this->assertTrue($repo->create([
            'name' => 'Direct Coverage',
            'email' => 'direct@example.com',
            'password' => 'StrongPass1!',
            'plan' => 'free',
            'isPremium' => 0,
            'isAdmin' => 0,
        ]));

        $allUsers = $repo->findAll();
        $this->assertCount(1, $allUsers);
        $this->assertSame('direct@example.com', $allUsers[0]['email'] ?? null);

        $matches = $repo->search('Direct');
        $this->assertCount(1, $matches);
        $this->assertSame('direct@example.com', $matches[0]['email'] ?? null);

        $user = $repo->findByEmail('direct@example.com');
        $this->assertIsArray($user);
        $userId = (int) ($user['id'] ?? 0);
        $this->assertGreaterThan(0, $userId);

        $this->assertIsArray($repo->authenticate('direct@example.com', 'StrongPass1!'));
        $this->assertFalse($repo->authenticate('direct@example.com', 'WrongPass!'));

        $foundById = $repo->findById($userId);
        $this->assertIsArray($foundById);
        $this->assertSame('direct@example.com', $foundById['email'] ?? null);

        $this->assertTrue($repo->update($userId, [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'password' => '',
            'plan' => 'free',
            'isPremium' => 0,
            'isAdmin' => 1,
        ]));

        $updated = $repo->findById($userId);
        $this->assertIsArray($updated);
        $this->assertSame('updated@example.com', $updated['email'] ?? null);
        $this->assertSame('Updated Name', $updated['name'] ?? null);
        $this->assertSame(1, (int) ($updated['isAdmin'] ?? 0));

        $this->assertTrue($repo->upgradeToPremium($userId, 'paypal', 14.5));
        $premium = $repo->findById($userId);
        $this->assertIsArray($premium);
        $this->assertSame('premium', $premium['plan'] ?? null);
        $this->assertSame(1, (int) ($premium['isPremium'] ?? 0));

        $subscriptionCount = (int) $pdo->query('SELECT COUNT(*) FROM subscription')->fetchColumn();
        $this->assertSame(1, $subscriptionCount);

        $this->assertTrue($repo->delete($userId));
        $this->assertFalse($repo->findById($userId));
    }

    public function testUserRepositoryCoversMysqlPremiumExpiryBranch(): void
    {
        $pdo = new class () extends PDO {
            public function __construct()
            {
                parent::__construct('sqlite::memory:');
                $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            }

            public function getAttribute($attribute): mixed
            {
                if ($attribute === PDO::ATTR_DRIVER_NAME) {
                    return 'mysql';
                }

                return parent::getAttribute($attribute);
            }
        };

        $pdo->exec(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                isPremium INTEGER NOT NULL DEFAULT 0,
                isAdmin INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        );

        $repo = new UserRepository($pdo);
        $this->assertTrue($repo->create([
            'name' => 'Mysql Branch',
            'email' => 'mysql-branch@example.com',
            'password' => 'StrongPass1!',
            'plan' => 'free',
            'isPremium' => 0,
            'isAdmin' => 0,
        ]));

        $user = $repo->findByEmail('mysql-branch@example.com');
        $this->assertIsArray($user);

        $this->assertTrue($repo->upgradeToPremium((int) $user['id'], 'card', 9.0));

        $updated = $repo->findById((int) $user['id']);
        $this->assertIsArray($updated);
        $this->assertSame('premium', $updated['plan'] ?? null);
        $this->assertSame(1, (int) ($updated['isPremium'] ?? 0));
    }

    private function createArticleSchema(bool $withProfileTable, bool $withUserAvatar): PDO
    {
        $pdo = FakeDatabase::sqlite();
        $userColumns = $withUserAvatar
            ? 'id INTEGER PRIMARY KEY, name TEXT NOT NULL, avatar TEXT DEFAULT ""'
            : 'id INTEGER PRIMARY KEY, name TEXT NOT NULL';
        $pdo->exec("CREATE TABLE users ({$userColumns})");
        $pdo->exec(
            "CREATE TABLE article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                category TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'published',
                coverImage TEXT DEFAULT '',
                readingTime TEXT DEFAULT '1 min',
                likesCount INTEGER NOT NULL DEFAULT 0,
                views INTEGER NOT NULL DEFAULT 0,
                label TEXT NOT NULL DEFAULT 'none',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        );
        if ($withProfileTable) {
            $pdo->exec('CREATE TABLE user_profile (userId INTEGER PRIMARY KEY, avatar TEXT DEFAULT "")');
            $pdo->exec("INSERT INTO user_profile (userId, avatar) VALUES (1, 'profile-avatar.png')");
        }

        if ($withUserAvatar) {
            $pdo->exec("INSERT INTO users (id, name, avatar) VALUES (1, 'Author', 'user-avatar.png')");
        } else {
            $pdo->exec("INSERT INTO users (id, name) VALUES (1, 'Author')");
        }
        $pdo->exec(
            "INSERT INTO article (userId, title, body, category, tags, status, coverImage, readingTime, likesCount, views, label, createdAt)
             VALUES (1, 'Repo Article', 'Body', 'Testing', 'repo', 'published', '', '1 min', 0, 0, 'none', '2026-01-01 00:00:00')"
        );

        return $pdo;
    }

    private function createSavedArticleSchema(bool $withProfileTable, bool $withUserAvatar): PDO
    {
        $pdo = FakeDatabase::sqlite();
        $userColumns = $withUserAvatar
            ? 'id INTEGER PRIMARY KEY, name TEXT NOT NULL, avatar TEXT DEFAULT ""'
            : 'id INTEGER PRIMARY KEY, name TEXT NOT NULL';
        $pdo->exec("CREATE TABLE users ({$userColumns})");
        $pdo->exec(
            "CREATE TABLE article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                category TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'published',
                coverImage TEXT DEFAULT '',
                readingTime TEXT DEFAULT '1 min',
                likesCount INTEGER NOT NULL DEFAULT 0,
                views INTEGER NOT NULL DEFAULT 0,
                label TEXT NOT NULL DEFAULT 'none',
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        );
        $pdo->exec(
            "CREATE TABLE savedarticle (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                articleId INTEGER NOT NULL,
                savedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        );
        if ($withProfileTable) {
            $pdo->exec('CREATE TABLE user_profile (userId INTEGER PRIMARY KEY, avatar TEXT DEFAULT "")');
            $pdo->exec("INSERT INTO user_profile (userId, avatar) VALUES (1, 'profile-avatar.png')");
        }

        if ($withUserAvatar) {
            $pdo->exec("INSERT INTO users (id, name, avatar) VALUES (1, 'Author', 'user-avatar.png')");
        } else {
            $pdo->exec("INSERT INTO users (id, name) VALUES (1, 'Author')");
        }
        $pdo->exec(
            "INSERT INTO article (id, userId, title, body, category, tags, status, coverImage, readingTime, likesCount, views, label, createdAt)
             VALUES (1, 1, 'Saved Repo Article', 'Body', 'Testing', 'repo', 'published', '', '1 min', 0, 0, 'none', '2026-01-01 00:00:00')"
        );
        $pdo->exec(
            "INSERT INTO savedarticle (userId, articleId, savedAt)
             VALUES (2, 1, '2026-01-02 00:00:00')"
        );

        return $pdo;
    }
}
