<?php
declare(strict_types=1);

namespace IBlog\Tests\Integration;

use IBlog\Tests\Support\EndpointTestCase;

final class SearchAndCommunityTest extends EndpointTestCase
{
    public function testSearchReturnsMatchingArticleByKeyword(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'Alpha',
            'mode' => 'articles',
            'limit' => 20,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertNotEmpty($json['results'] ?? []);
        $this->assertSame('Searchable Article Alpha', $json['results'][0]['title'] ?? null);
    }

    public function testSearchReturnsMatchingUserInPeopleMode(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'Premium',
            'mode' => 'people',
            'limit' => 20,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertNotEmpty($json['users'] ?? []);
        $this->assertSame('premium@example.com', $json['users'][0]['email'] ?? null);
    }

    public function testSearchReturnsNoResultsForUnknownKeyword(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => 'zzzz-no-such-match',
            'mode' => 'all',
            'limit' => 20,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame([], $json['results'] ?? []);
    }

    public function testSearchSafelyHandlesSpecialCharacters(): void
    {
        $response = $this->client->postJson('/backend/view/components/auth/search-index.php', [
            'q' => '"\'<>%__@@',
            'mode' => 'all',
            'limit' => 20,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertIsArray($json['results'] ?? null);
    }

    public function testJoinCommunitySucceedsAndRejoinDoesNotDuplicateMembership(): void
    {
        $this->signIn('free@example.com');

        $joinResponse = $this->client->postJson('/backend/controller/CommunityController.php?action=join', [
            'community_id' => 1,
        ]);
        $this->assertSame(200, $joinResponse->status, $joinResponse->body);
        $this->assertTrue($joinResponse->json()['success'] ?? false);

        $firstMembershipCount = (int) $this->db()->query('SELECT COUNT(*) FROM communitymember WHERE communityId = 1 AND userId = 2')->fetchColumn();
        $this->assertSame(1, $firstMembershipCount);

        $rejoinResponse = $this->client->postJson('/backend/controller/CommunityController.php?action=join', [
            'community_id' => 1,
        ]);
        $this->assertSame(200, $rejoinResponse->status, $rejoinResponse->body);
        $this->assertTrue($rejoinResponse->json()['success'] ?? false);
        $this->assertTrue($rejoinResponse->json()['alreadyMember'] ?? false);

        $secondMembershipCount = (int) $this->db()->query('SELECT COUNT(*) FROM communitymember WHERE communityId = 1 AND userId = 2')->fetchColumn();
        $this->assertSame(1, $secondMembershipCount);
    }

    public function testNonMemberCannotAccessThreads(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->get('/backend/controller/CommunityController.php', [
            'action' => 'getThreads',
            'communityId' => 1,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertFalse($response->json()['success'] ?? true);
        $this->assertSame('Only community members can access threads', $response->json()['error'] ?? null);
    }

    public function testFreeMemberCannotCreatePremiumThread(): void
    {
        $this->signIn('free@example.com');
        $this->client->postJson('/backend/controller/CommunityController.php?action=join', [
            'community_id' => 1,
        ]);

        $response = $this->client->postJson('/backend/controller/CommunityController.php?action=createThread', [
            'communityId' => 1,
            'title' => 'Free User Thread Attempt',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertFalse($response->json()['success'] ?? true);
        $this->assertSame('Premium subscription required to create threads', $response->json()['error'] ?? null);
    }

    public function testPremiumMemberCanCreateThreadAndPostMessage(): void
    {
        $this->signIn('premium@example.com');

        $threadResponse = $this->client->postJson('/backend/controller/CommunityController.php?action=createThread', [
            'communityId' => 1,
            'title' => 'Premium Thread',
        ]);
        $this->assertSame(200, $threadResponse->status, $threadResponse->body);
        $threadJson = $threadResponse->json();
        $this->assertTrue($threadJson['success'] ?? false);
        $threadId = (int) ($threadJson['thread']['id'] ?? 0);
        $this->assertGreaterThan(0, $threadId);

        $messageResponse = $this->client->postJson('/backend/controller/CommunityController.php?action=sendThreadMessage', [
            'communityId' => 1,
            'threadId' => $threadId,
            'message' => 'Premium users can post here.',
        ]);
        $this->assertSame(200, $messageResponse->status, $messageResponse->body);
        $messageJson = $messageResponse->json();
        $this->assertTrue($messageJson['success'] ?? false);
        $this->assertSame('Premium users can post here.', $messageJson['message']['message'] ?? null);
    }

    public function testThreadTitleBoundaryValidationRejectsOverlongTitles(): void
    {
        $this->signIn('premium@example.com');
        $longTitle = str_repeat('A', 181);

        $response = $this->client->postJson('/backend/controller/CommunityController.php?action=createThread', [
            'communityId' => 1,
            'title' => $longTitle,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertFalse($response->json()['success'] ?? true);
        $this->assertSame('Thread title is too long', $response->json()['error'] ?? null);
    }
}