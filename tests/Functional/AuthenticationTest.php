<?php
declare(strict_types=1);

namespace IBlog\Tests\Functional;

use IBlog\Tests\Support\EndpointTestCase;

final class AuthenticationTest extends EndpointTestCase
{
    public function testGuestCannotFetchAuthenticatedProfile(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'me',
        ]);

        $this->assertSame(401, $response->status);
        $this->assertSame('Not authenticated.', $response->json()['error'] ?? null);
    }

    public function testSignupCreatesAccountAndStartsSession(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signup',
            'name' => 'New Member',
            'email' => 'new.member@example.com',
            'password' => 'StrongPass1!',
            'plan' => 'free',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('new.member@example.com', $json['user']['email'] ?? null);

        $count = (int) $this->db()->query("SELECT COUNT(*) FROM users WHERE email = 'new.member@example.com'")->fetchColumn();
        $this->assertSame(1, $count);
    }

    public function testSignupRejectsWeakPassword(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signup',
            'name' => 'Weak Password User',
            'email' => 'weak@example.com',
            'password' => 'weakpass',
            'plan' => 'free',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertStringContainsString('Password must be at least 10 characters', $response->json()['error'] ?? '');
    }

    public function testSignupRejectsDuplicateEmail(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signup',
            'name' => 'Another Free User',
            'email' => 'free@example.com',
            'password' => 'StrongPass1!',
            'plan' => 'free',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('This email is already registered.', $response->json()['error'] ?? null);
    }

    public function testSigninRejectsInvalidCredentials(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signin',
            'email' => 'free@example.com',
            'password' => 'WrongPass1!',
        ]);

        $this->assertSame(401, $response->status);
        $this->assertSame('Incorrect email or password.', $response->json()['error'] ?? null);
    }

    public function testForgotPasswordAcceptsExistingAccount(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'forgot_password',
            'email' => 'free@example.com',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('free@example.com', $json['email'] ?? null);

        $count = (int) $this->db()->query("SELECT COUNT(*) FROM password_resets WHERE email = 'free@example.com'")->fetchColumn();
        $this->assertSame(1, $count);
    }

    public function testResetPasswordSucceedsWithValidToken(): void
    {
        $token = 'known-reset-token';
        $hash = hash('sha256', $token);
        $this->db()->exec(
            "CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used_at TEXT DEFAULT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )"
        );
        $stmt = $this->db()->prepare('INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)');
        $stmt->execute(['free@example.com', $hash, '2030-01-01 00:00:00']);

        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'reset_password',
            'email' => 'free@example.com',
            'token' => $token,
            'password' => 'UpdatedPass1!',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertTrue($response->json()['ok'] ?? false);

        $signin = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signin',
            'email' => 'free@example.com',
            'password' => 'UpdatedPass1!',
        ]);

        $this->assertSame(200, $signin->status, $signin->body);
        $this->assertTrue($signin->json()['ok'] ?? false);
    }

    public function testResetPasswordRejectsExpiredToken(): void
    {
        $token = 'expired-reset-token';
        $hash = hash('sha256', $token);
        $this->db()->exec(
            "CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used_at TEXT DEFAULT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )"
        );
        $stmt = $this->db()->prepare('INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)');
        $stmt->execute(['free@example.com', $hash, '2020-01-01 00:00:00']);

        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'reset_password',
            'email' => 'free@example.com',
            'token' => $token,
            'password' => 'UpdatedPass1!',
        ]);

        $this->assertSame(410, $response->status);
        $this->assertSame('This reset link is invalid or has expired.', $response->json()['error'] ?? null);
    }

    public function testUpgradeToPremiumChangesPlanAndCreatesSubscription(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'upgrade_to_premium',
            'method' => 'card',
            'amount' => 9,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('premium', $json['user']['plan'] ?? null);
        $this->assertTrue((bool) ($json['user']['isPremium'] ?? false));

        $subscriptionCount = (int) $this->db()->query('SELECT COUNT(*) FROM subscription WHERE userId = 2')->fetchColumn();
        $this->assertGreaterThanOrEqual(1, $subscriptionCount);
    }
}
