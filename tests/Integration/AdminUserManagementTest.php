<?php
declare(strict_types=1);

namespace IBlog\Tests\Integration;

use IBlog\Tests\Support\EndpointTestCase;

final class AdminUserManagementTest extends EndpointTestCase
{
    public function testGuestCannotAccessAdminApi(): void
    {
        $response = $this->client->get('/backend/view/components/admin/admin_api.php', [
            'action' => 'ping',
        ]);

        $this->assertSame(403, $response->status);
        $this->assertSame('Forbidden - admin access required', $response->json()['error'] ?? null);
    }

    public function testAdminSigninReturnsAdminRedirect(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'signin',
            'email' => 'admin@example.com',
            'password' => 'StrongPass1!',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('backend/view/components/admin/admin.php', $json['redirect'] ?? null);
    }

    public function testAdminCanCreateUser(): void
    {
        $this->signIn('admin@example.com');

        $response = $this->client->postForm('/backend/view/components/admin/admin_api.php', [
            'name' => 'Managed User',
            'email' => 'managed.user@example.com',
            'password' => 'StrongPass1!',
            'plan' => 'free',
            'isPremium' => '0',
            'isAdmin' => '0',
        ], [
            'action' => 'create_user',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertTrue($response->json()['ok'] ?? false);

        $created = $this->db()->query("SELECT plan, isAdmin FROM users WHERE email = 'managed.user@example.com'")->fetch();
        $this->assertSame('free', $created['plan'] ?? null);
        $this->assertSame(0, (int) ($created['isAdmin'] ?? 1));
    }

    public function testAdminCanUpdateUserRoleAndPlan(): void
    {
        $this->signIn('admin@example.com');

        $response = $this->client->postForm('/backend/view/components/admin/admin_api.php', [
            'id' => '2',
            'name' => 'Free User Updated',
            'email' => 'free@example.com',
            'password' => '',
            'plan' => 'premium',
            'isPremium' => '1',
            'isAdmin' => '1',
        ], [
            'action' => 'update_user',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertTrue($response->json()['ok'] ?? false);

        $updated = $this->db()->query('SELECT plan, isPremium, isAdmin FROM users WHERE id = 2')->fetch();
        $this->assertSame('premium', $updated['plan'] ?? null);
        $this->assertSame(1, (int) ($updated['isPremium'] ?? 0));
        $this->assertSame(1, (int) ($updated['isAdmin'] ?? 0));
    }

    public function testAdminCannotDeleteOwnAccount(): void
    {
        $this->signIn('admin@example.com');

        $response = $this->client->postForm('/backend/view/components/admin/admin_api.php', [
            'id' => '1',
        ], [
            'action' => 'delete_user',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertSame('Impossible de supprimer votre propre compte admin', $response->json()['error'] ?? null);
    }

    public function testAuthenticatedUserDirectorySearchRequiresSessionAndReturnsMatches(): void
    {
        $guestResponse = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'list_users',
            'q' => 'premium',
            'limit' => 20,
        ]);
        $this->assertSame(401, $guestResponse->status);

        $this->signIn('free@example.com');
        $response = $this->client->postJson('/backend/view/components/auth/api-auth.php', [
            'action' => 'list_users',
            'q' => 'Premium',
            'limit' => 20,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertNotEmpty($json['users'] ?? []);
        $this->assertSame('premium@example.com', $json['users'][0]['email'] ?? null);
    }
}
