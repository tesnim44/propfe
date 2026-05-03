<?php
declare(strict_types=1);

namespace IBlog\Tests\Unit;

use IBlog\Tests\Support\EndpointTestCase;

require_once __DIR__ . '/../../backend/controller/CommunityController.php';

final class CommunityControllerCoverageTest extends EndpointTestCase
{
    protected function tearDown(): void
    {
        putenv('IBLOG_TEST_REQUEST_BODY=');
        unset($_ENV['IBLOG_TEST_REQUEST_BODY']);
        $_GET = [];
        $_POST = [];
        $_REQUEST = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
        }

        parent::tearDown();
    }

    public function testResolveRequestUserIdCoversSessionEmailIdAndMismatchPaths(): void
    {
        $_REQUEST = [];
        $this->assertSame(2, resolveRequestUserId($this->db(), ['userEmail' => 'free@example.com']));
        $this->assertSame(2, resolveRequestUserId($this->db(), ['userId' => 2]));
        $_REQUEST = ['userId' => 3];
        $this->assertSame(3, resolveRequestUserId($this->db()));
        $this->assertSame(0, resolveRequestUserId($this->db(), ['userEmail' => 'not-an-email']));
        $this->assertSame(0, resolveRequestUserId($this->db(), ['userId' => 999]));
        $this->assertSame(0, resolveRequestUserId($this->db(), ['userId' => 2, 'userEmail' => 'premium@example.com']));
        $this->assertSame(0, resolveRequestUserId($this->db(), ['userEmail' => 'missing@example.com']));
    }

    public function testCommunityCreationListJoinLeaveAndMessagingActionsAreCovered(): void
    {
        [$status, $json] = $this->invokeAction('createCommunityAction', [
            'name' => 'New Community',
            'description' => 'A premium-only community',
        ]);
        $this->assertSame(200, $status);
        $this->assertFalse($json['success'] ?? true);

        [$status, $json] = $this->invokeAction('createCommunityAction', [
            'name' => 'New Community',
            'description' => 'A premium-only community',
            'userId' => 2,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Premium subscription required', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('createCommunityAction', [
            'name' => 'x',
            'description' => '',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Name and description required', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('createCommunityAction', [
            'name' => 'Premium Space',
            'description' => 'Space for premium members',
            'topics' => 'writers, quality',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);
        $createdCommunityId = (int) ($json['id'] ?? 0);
        $this->assertGreaterThan(1, $createdCommunityId);

        [$status, $json] = $this->invokeAction('getAllCommunitiesAction');
        $this->assertSame(200, $status);
        $this->assertGreaterThanOrEqual(2, count($json));

        [$status, $json] = $this->invokeAction('getUserCommunitiesAction');
        $this->assertSame(200, $status);
        $this->assertSame([], $json);

        [$status, $json] = $this->invokeAction('getUserCommunitiesAction', [], ['userId' => 3]);
        $this->assertSame(200, $status);
        $this->assertNotEmpty($json);

        [$status, $json] = $this->invokeAction('joinCommunityAction', ['userId' => 2]);
        $this->assertSame(200, $status);
        $this->assertSame('Invalid community ID', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('joinCommunityAction', ['community_id' => 1, 'userId' => 2]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);

        [$status, $json] = $this->invokeAction('leaveCommunityAction', ['userId' => 2]);
        $this->assertSame(200, $status);
        $this->assertSame('Invalid community ID', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('leaveCommunityAction', ['community_id' => 1, 'userId' => 2]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);

        [$status, $json] = $this->invokeAction('getMessagesAction', [], ['communityId' => 0]);
        $this->assertSame(200, $status);
        $this->assertFalse($json['success'] ?? true);

        [$status, $json] = $this->invokeAction('sendMessageAction', ['userId' => 3]);
        $this->assertSame(200, $status);
        $this->assertSame('Invalid data', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('sendMessageAction', [
            'communityId' => 1,
            'message' => 'Direct controller message',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);

        [$status, $json] = $this->invokeAction('getMessagesAction', [], ['communityId' => 1, 'userId' => 3]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);
        $this->assertNotEmpty($json['messages'] ?? []);

        [$status, $json] = $this->invokeAction('checkMembershipAction', [], ['communityId' => 1, 'userId' => 3]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['isMember'] ?? false);

        $this->assertSame('Premium User', communityRepository($this->db())->findUserName(3));
    }

    public function testCommunityThreadHelpersCoverInvalidAndSuccessFlows(): void
    {
        [$status, $json] = $this->invokeAction('getThreadsAction');
        $this->assertSame(200, $status);
        $this->assertSame('Invalid request', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('getThreadsAction', [], ['communityId' => 1, 'userId' => 2]);
        $this->assertSame(200, $status);
        $this->assertSame('Only community members can access threads', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('joinCommunityAction', ['community_id' => 1, 'userId' => 2]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);

        [$status, $json] = $this->invokeAction('createThreadAction', [
            'communityId' => 1,
            'title' => 'Free Thread',
            'userId' => 2,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Premium subscription required to create threads', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('createThreadAction', [
            'communityId' => 1,
            'title' => '',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Invalid data', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('createThreadAction', [
            'communityId' => 1,
            'title' => str_repeat('A', 181),
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Thread title is too long', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('createThreadAction', [
            'communityId' => 1,
            'title' => 'Covered Thread',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);
        $threadId = (int) ($json['thread']['id'] ?? 0);
        $this->assertGreaterThan(0, $threadId);

        [$status, $json] = $this->invokeAction('getThreadsAction', [], ['communityId' => 1, 'userId' => 3]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);
        $this->assertNotEmpty($json['threads'] ?? []);

        [$status, $json] = $this->invokeAction('getThreadMessagesAction');
        $this->assertSame(200, $status);
        $this->assertSame('Invalid request', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('sendThreadMessageAction', [
            'communityId' => 1,
            'threadId' => 0,
            'message' => '',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Invalid data', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('sendThreadMessageAction', [
            'communityId' => 1,
            'threadId' => 999,
            'message' => 'Missing thread',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Thread not found', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('sendThreadMessageAction', [
            'communityId' => 1,
            'threadId' => $threadId,
            'message' => 'Thread message coverage',
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);

        [$status, $json] = $this->invokeAction('getThreadMessagesAction', [], [
            'communityId' => 1,
            'threadId' => $threadId,
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);
        $this->assertNotEmpty($json['messages'] ?? []);

        [$status, $json] = $this->invokeAction('deleteThreadAction', [
            'communityId' => 1,
            'threadId' => $threadId,
            'userId' => 2,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Premium subscription required', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('deleteThreadAction', [
            'communityId' => 1,
            'threadId' => 0,
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertSame('Invalid data', $json['error'] ?? null);

        [$status, $json] = $this->invokeAction('deleteThreadAction', [
            'communityId' => 1,
            'threadId' => $threadId,
            'userId' => 3,
        ]);
        $this->assertSame(200, $status);
        $this->assertTrue($json['success'] ?? false);

        $response = $this->client->get('/backend/controller/CommunityController.php', ['action' => 'unknown-action']);
        $this->assertSame(404, $response->status);
        $this->assertFalse($response->json()['success'] ?? true);
    }

    private function invokeAction(string $functionName, array $body = [], array $get = [], array $session = []): array
    {
        $_GET = $get;
        $_POST = [];
        $_REQUEST = $get;

        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        $_SESSION = $session;

        $encoded = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
        putenv('IBLOG_TEST_REQUEST_BODY=' . $encoded);
        $_ENV['IBLOG_TEST_REQUEST_BODY'] = $encoded;

        http_response_code(200);
        ob_start();
        $functionName($this->db());
        $output = trim((string) ob_get_clean());
        $decoded = json_decode($output, true);

        return [http_response_code(), is_array($decoded) ? $decoded : [], $output];
    }
}
