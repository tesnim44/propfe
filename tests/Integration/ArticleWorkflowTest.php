<?php
declare(strict_types=1);

namespace IBlog\Tests\Integration;

use IBlog\Tests\Support\EndpointTestCase;

final class ArticleWorkflowTest extends EndpointTestCase
{
    public function testPublicListContainsPublishedArticlesButNotDrafts(): void
    {
        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'list',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $titles = array_column($json['articles'] ?? [], 'title');

        $this->assertContains('Searchable Article Alpha', $titles);
        $this->assertNotContains('Existing Draft', $titles);
    }

    public function testAuthenticatedListIncludesOwnDrafts(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'list',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $titles = array_column($response->json()['articles'] ?? [], 'title');
        $this->assertContains('Existing Draft', $titles);
    }

    public function testPublishingArticlePersistsData(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Functional Publish Test',
            'body' => 'A body large enough to be considered valid published content.',
            'category' => 'Testing',
            'tags' => 'qa,functional',
            'status' => 'published',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('published', $json['article']['status'] ?? null);

        $count = (int) $this->db()->query("SELECT COUNT(*) FROM article WHERE title = 'Functional Publish Test' AND status = 'published'")->fetchColumn();
        $this->assertSame(1, $count);
    }

    public function testSavingEmptyDraftIsRejected(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => '',
            'body' => '',
            'status' => 'draft',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Add a title or some content before saving a draft.', $response->json()['error'] ?? null);
    }

    public function testUserCannotUpdateAnotherUsersArticle(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'update',
            'id' => 1,
            'title' => 'Unauthorized Update',
            'body' => 'Should not succeed.',
            'status' => 'published',
        ]);

        $this->assertSame(403, $response->status);
        $this->assertSame('You can only edit your own articles.', $response->json()['error'] ?? null);
    }

    public function testUserCanUpdateOwnedArticle(): void
    {
        $this->signIn('free@example.com');
        $create = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Owned Draft',
            'body' => 'Initial article body for update testing.',
            'status' => 'draft',
        ]);
        $articleId = (int) ($create->json()['article']['id'] ?? 0);

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'update',
            'id' => $articleId,
            'title' => 'Owned Draft Updated',
            'body' => 'Updated body content for the owned article.',
            'status' => 'published',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertSame('Owned Draft Updated', $response->json()['article']['title'] ?? null);

        $stored = $this->db()->query("SELECT title, status FROM article WHERE id = {$articleId}")->fetch();
        $this->assertSame('Owned Draft Updated', $stored['title'] ?? null);
        $this->assertSame('published', $stored['status'] ?? null);
    }

    public function testUserCanSaveAndUnsavePublishedArticle(): void
    {
        $this->signIn('free@example.com');

        $saveResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 1,
            'saved' => true,
        ]);
        $this->assertSame(200, $saveResponse->status, $saveResponse->body);
        $this->assertTrue($saveResponse->json()['saved'] ?? false);

        $savedCount = (int) $this->db()->query('SELECT COUNT(*) FROM savedarticle WHERE userId = 2 AND articleId = 1')->fetchColumn();
        $this->assertSame(1, $savedCount);

        $unsaveResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 1,
            'saved' => false,
        ]);
        $this->assertSame(200, $unsaveResponse->status, $unsaveResponse->body);
        $this->assertFalse($unsaveResponse->json()['saved'] ?? true);

        $savedCountAfter = (int) $this->db()->query('SELECT COUNT(*) FROM savedarticle WHERE userId = 2 AND articleId = 1')->fetchColumn();
        $this->assertSame(0, $savedCountAfter);
    }

    public function testCommentAddPersistsAndReturnsUpdatedCount(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'comment_add',
            'articleId' => 1,
            'body' => 'This is a functional comment.',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertTrue($json['ok'] ?? false);
        $this->assertSame('This is a functional comment.', $json['comment']['text'] ?? null);
        $this->assertSame(1, (int) ($json['commentsCount'] ?? 0));
    }

    public function testMalformedCoverImagePayloadIsRejected(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Bad Cover Payload',
            'body' => 'Valid body content but invalid base64 image.',
            'status' => 'published',
            'coverImage' => 'data:image/png;base64,***not-valid***',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Invalid cover image data.', $response->json()['error'] ?? null);
    }
}