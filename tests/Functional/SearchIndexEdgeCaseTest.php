<?php
declare(strict_types=1);

namespace IBlog\Tests\Functional;

use IBlog\Tests\Support\EndpointTestCase;

final class SearchIndexEdgeCaseTest extends EndpointTestCase
{
    public function testSearchRejectsGetRequests(): void
    {
        $response = $this->client->get('/backend/view/components/auth/search-index.php');

        $this->assertSame(405, $response->status);
        $this->assertSame('Method not allowed', $response->json()['error'] ?? null);
    }

    public function testSearchRejectsTooShortQueries(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'a',
            'mode' => 'all',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Query too short', $response->json()['error'] ?? null);
    }

    public function testSearchAllModeReturnsMixedRankingPayload(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'search',
            'mode' => 'all',
            'limit' => 10,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertNotEmpty($json['ranking'] ?? []);
        $this->assertSame(1, $json['ranking'][0]['rank'] ?? null);
        $this->assertContains(($json['results'][0]['type'] ?? ''), ['article', 'user']);
    }

    public function testSearchUsesExactMatchRankingForPeopleMode(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'Premium User',
            'mode' => 'people',
            'limit' => 10,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertNotEmpty($json['users'] ?? []);
        $this->assertSame('premium@example.com', $json['users'][0]['email'] ?? null);
    }

    public function testArticlesModeDoesNotReturnUsersCollection(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'alpha',
            'mode' => 'articles',
            'limit' => 5,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame([], $json['users'] ?? null);
        $this->assertNotEmpty($json['articles'] ?? []);
    }

    public function testPeopleModeNormalizesLegacyProfileAssetPaths(): void
    {
        $this->db()->exec(
            "CREATE TABLE IF NOT EXISTS user_profile (
                userId INTEGER NOT NULL PRIMARY KEY,
                bio TEXT NULL,
                avatar TEXT NULL,
                cover TEXT NULL,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )"
        );
        $stmt = $this->db()->prepare(
            'INSERT INTO user_profile (userId, bio, avatar, cover) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            3,
            'asset normalization biography',
            '/blog_123/public/uploads/avatars/legacy-avatar.png',
            'https://example.com/blog_123/public/uploads/covers/legacy-cover.png',
        ]);

        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'normalization biography',
            'mode' => 'people',
            'limit' => 10,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertNotEmpty($json['users'] ?? []);
        $this->assertSame('public/uploads/avatars/legacy-avatar.png', $json['users'][0]['avatar'] ?? null);
        $this->assertSame('public/uploads/covers/legacy-cover.png', $json['users'][0]['cover'] ?? null);
    }

    public function testPeopleModeNormalizesBackendProfileAssetPathAndDefaultPathPassThrough(): void
    {
        $this->db()->exec(
            "CREATE TABLE IF NOT EXISTS user_profile (
                userId INTEGER NOT NULL PRIMARY KEY,
                bio TEXT NULL,
                avatar TEXT NULL,
                cover TEXT NULL,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )"
        );
        $stmt = $this->db()->prepare(
            'INSERT OR REPLACE INTO user_profile (userId, bio, avatar, cover) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            2,
            'plain path biography',
            'backend/public/uploads/avatars/backend-avatar.png',
            'plain-cover-path.png',
        ]);

        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'plain path biography',
            'mode' => 'people',
            'limit' => 10,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('public/uploads/avatars/backend-avatar.png', $json['users'][0]['avatar'] ?? null);
        $this->assertSame('plain-cover-path.png', $json['users'][0]['cover'] ?? null);
    }

    public function testSearchReturnsEmptyPayloadWhenDatabaseConnectionIsUnavailable(): void
    {
        $originalDsn = getenv('DB_DSN');
        putenv('DB_DSN=sqlite:/Z:/definitely-missing/iblog-test.sqlite');

        try {
            $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
                'q' => 'alpha',
                'mode' => 'all',
                'limit' => 10,
            ]);
        } finally {
            if ($originalDsn === false) {
                putenv('DB_DSN');
            } else {
                putenv('DB_DSN=' . $originalDsn);
            }
        }

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame([], $json['results'] ?? null);
        $this->assertSame([], $json['articles'] ?? null);
        $this->assertSame([], $json['users'] ?? null);
    }
}
