<?php
declare(strict_types=1);

namespace IBlog\Tests\Support;

use PDO;
use PHPUnit\Framework\TestCase;

abstract class EndpointTestCase extends TestCase
{
    protected WebClient $client;

    protected function setUp(): void
    {
        parent::setUp();
        TestApplication::resetDatabase();
        $this->client = TestApplication::createClient();
    }

    protected function db(): PDO
    {
        return TestApplication::pdo();
    }

    protected function signIn(string $email, string $password = 'StrongPass1!'): array
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signin',
            'email' => $email,
            'password' => $password,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false, $response->body);

        return $json;
    }
}
