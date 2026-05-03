<?php
declare(strict_types=1);

namespace IBlog\Tests\Functional;

use IBlog\Tests\Support\EndpointTestCase;

final class ArticleApiEdgeCaseTest extends EndpointTestCase
{
    public function testArticleApiRejectsGetRequests(): void
    {
        $response = $this->client->get('/backend/view/components/article/api-articles.php');

        $this->assertSame(405, $response->status);
        $this->assertSame('Method not allowed.', $response->json()['error'] ?? null);
    }

    public function testSavedListRequiresAuthentication(): void
    {
        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_list',
        ]);

        $this->assertSame(401, $response->status);
        $this->assertSame('Please sign in first.', $response->json()['error'] ?? null);
    }

    public function testSavedListReturnsSavedArticlesWithPagination(): void
    {
        $this->signIn('free@example.com');
        $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 1,
            'saved' => true,
        ]);

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_list',
            'page' => 1,
            'pageSize' => 1,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertCount(1, $json['articles'] ?? []);
        $this->assertSame(1, $json['pagination']['totalItems'] ?? null);
        $this->assertSame(1, $json['pagination']['totalPages'] ?? null);
    }

    public function testSavedListCanAuthenticateThroughAuthorEmailFallback(): void
    {
        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_list',
            'authorEmail' => 'free@example.com',
            'page' => 1,
            'pageSize' => 5,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertSame(0, $response->json()['pagination']['totalItems'] ?? null);
    }

    public function testSavedListRejectsUnknownAuthorEmailFallback(): void
    {
        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_list',
            'authorEmail' => 'missing@example.com',
        ]);

        $this->assertSame(401, $response->status);
        $this->assertSame('Please sign in first.', $response->json()['error'] ?? null);
    }

    public function testSavedToggleRejectsUnknownArticle(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 9999,
            'saved' => true,
        ]);

        $this->assertSame(404, $response->status);
        $this->assertSame('Article not found.', $response->json()['error'] ?? null);
    }

    public function testSavedToggleRejectsInvalidArticleId(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 0,
            'saved' => true,
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Invalid article id.', $response->json()['error'] ?? null);
    }

    public function testSavedToggleWithoutExplicitFlagAutoTogglesSavedState(): void
    {
        $this->signIn('free@example.com');

        $saveResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 1,
        ]);
        $this->assertSame(200, $saveResponse->status, $saveResponse->body);
        $this->assertTrue($saveResponse->json()['saved'] ?? false);

        $unsaveResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'saved_toggle',
            'articleId' => 1,
        ]);
        $this->assertSame(200, $unsaveResponse->status, $unsaveResponse->body);
        $this->assertFalse($unsaveResponse->json()['saved'] ?? true);
    }

    public function testLikeToggleCreatesAndRemovesLike(): void
    {
        $this->signIn('free@example.com');

        $likeResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 1,
            'liked' => true,
        ]);

        $this->assertSame(200, $likeResponse->status, $likeResponse->body);
        $this->assertTrue($likeResponse->json()['liked'] ?? false);
        $this->assertSame(1, (int) ($likeResponse->json()['likesCount'] ?? 0));

        $unlikeResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 1,
            'liked' => false,
        ]);

        $this->assertSame(200, $unlikeResponse->status, $unlikeResponse->body);
        $this->assertFalse($unlikeResponse->json()['liked'] ?? true);
        $this->assertSame(0, (int) ($unlikeResponse->json()['likesCount'] ?? 1));
    }

    public function testLikeToggleRejectsUnknownArticle(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 9999,
            'liked' => true,
        ]);

        $this->assertSame(404, $response->status);
        $this->assertSame('Article not found.', $response->json()['error'] ?? null);
    }

    public function testLikeToggleRejectsInvalidArticleId(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 0,
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Invalid article id.', $response->json()['error'] ?? null);
    }

    public function testLikeToggleWithoutExplicitFlagAutoTogglesLikeState(): void
    {
        $this->signIn('free@example.com');

        $likeResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 1,
        ]);
        $this->assertSame(200, $likeResponse->status, $likeResponse->body);
        $this->assertTrue($likeResponse->json()['liked'] ?? false);

        $unlikeResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 1,
        ]);
        $this->assertSame(200, $unlikeResponse->status, $unlikeResponse->body);
        $this->assertFalse($unlikeResponse->json()['liked'] ?? true);
    }

    public function testCommentAddRejectsMissingBody(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'comment_add',
            'articleId' => 1,
            'body' => '',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Article id and comment body are required.', $response->json()['error'] ?? null);
    }

    public function testCommentAddRejectsUnknownArticle(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'comment_add',
            'articleId' => 9999,
            'body' => 'Orphan comment',
        ]);

        $this->assertSame(404, $response->status);
        $this->assertSame('Article not found.', $response->json()['error'] ?? null);
    }

    public function testAuthenticatedListIncludesSerializedCommentsAndLikes(): void
    {
        $this->signIn('free@example.com');
        $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'like_toggle',
            'articleId' => 1,
            'liked' => true,
        ]);
        $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'comment_add',
            'articleId' => 1,
            'body' => 'Visible inside serialized article list.',
        ]);

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'list',
            'page' => 1,
            'pageSize' => 10,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $articles = $response->json()['articles'] ?? [];
        $article = current(array_filter($articles, static fn(array $item): bool => ($item['id'] ?? 0) === 1));

        $this->assertIsArray($article);
        $this->assertTrue($article['liked'] ?? false);
        $this->assertNotEmpty($article['comments'] ?? []);
        $this->assertSame('Visible inside serialized article list.', $article['comments'][0]['text'] ?? null);
    }

    public function testDeleteOwnArticleSoftDeletesIt(): void
    {
        $this->signIn('free@example.com');
        $createResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Delete Me',
            'body' => 'Delete path body content.',
            'status' => 'published',
        ]);
        $articleId = (int) ($createResponse->json()['article']['id'] ?? 0);

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'delete',
            'id' => $articleId,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $this->assertTrue($response->json()['deleted'] ?? false);

        $status = $this->db()->query('SELECT status FROM article WHERE id = ' . $articleId)->fetchColumn();
        $this->assertSame('deleted', $status);
    }

    public function testDeleteRejectsUnknownArticle(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'delete',
            'id' => 9999,
        ]);

        $this->assertSame(404, $response->status);
        $this->assertSame('Article not found.', $response->json()['error'] ?? null);
    }

    public function testDeleteRejectsForeignArticle(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'delete',
            'id' => 1,
        ]);

        $this->assertSame(403, $response->status);
        $this->assertSame('You can only delete your own articles.', $response->json()['error'] ?? null);
    }

    public function testSavePublishedArticleRequiresTitleAndBody(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => '',
            'body' => '',
            'status' => 'published',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Title and content are required.', $response->json()['error'] ?? null);
    }

    public function testSaveSerializesTemplateLabelCoverAndHighQualityBody(): void
    {
        $this->signIn('free@example.com');
        $body = str_repeat('Long article body content. ', 20);

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Template Coverage Article',
            'body' => $body,
            'status' => 'published',
            'label' => 'magazine',
            'coverImage' => 'backend/public/uploads/covers/existing-cover.png',
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $json = $response->json();
        $this->assertSame('magazine', $json['article']['templateId'] ?? null);
        $this->assertSame('high', $json['article']['quality'] ?? null);
        $this->assertSame('public/uploads/covers/existing-cover.png', $json['article']['cover'] ?? null);
    }

    public function testSaveAcceptsValidBase64CoverImage(): void
    {
        $this->signIn('free@example.com');
        $png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0x8AAAAASUVORK5CYII=';

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Base64 Cover',
            'body' => 'Valid article body with generated cover asset.',
            'status' => 'published',
            'coverImage' => 'data:image/png;base64,' . $png,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $cover = (string) ($response->json()['article']['cover'] ?? '');
        $this->assertStringStartsWith('public/uploads/covers/cover_', $cover);
        $this->assertStringEndsWith('.png', $cover);
    }

    public function testSaveNormalizesLegacyCoverPathsAndJpegExtension(): void
    {
        $this->signIn('free@example.com');
        $jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQEA8PDw8PDw8PDw8PDw8QDw8PFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQID/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB6A//xAAWEAEBAQAAAAAAAAAAAAAAAAAAARH/2gAIAQEAAT8Ax//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Af//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Af//Z';

        $legacyPathResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Legacy Cover Path',
            'body' => 'Uses a legacy /blog/blog cover path.',
            'status' => 'published',
            'coverImage' => '/blog/blog/public/uploads/covers/legacy-cover.png',
        ]);
        $this->assertSame(200, $legacyPathResponse->status, $legacyPathResponse->body);
        $this->assertSame('public/uploads/covers/legacy-cover.png', $legacyPathResponse->json()['article']['cover'] ?? null);

        $remotePathResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Remote Cover Path',
            'body' => 'Uses a remote legacy cover path.',
            'status' => 'published',
            'coverImage' => 'https://example.com/blog/blog/public/uploads/covers/remote-cover.png',
        ]);
        $this->assertSame(200, $remotePathResponse->status, $remotePathResponse->body);
        $this->assertSame('public/uploads/covers/remote-cover.png', $remotePathResponse->json()['article']['cover'] ?? null);

        $jpegResponse = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'JPEG Cover',
            'body' => 'Uses a jpeg data URI.',
            'status' => 'published',
            'coverImage' => 'data:image/jpeg;base64,' . $jpeg,
        ]);
        $this->assertSame(200, $jpegResponse->status, $jpegResponse->body);
        $this->assertStringEndsWith('.jpg', (string) ($jpegResponse->json()['article']['cover'] ?? ''));
    }

    public function testListHandlesInvalidCreatedAtGracefully(): void
    {
        $this->db()->exec(
            "INSERT INTO article (userId, title, body, category, tags, status, coverImage, readingTime, likesCount, views, label, createdAt)
             VALUES (4, 'Broken Date Article', 'Body', 'Testing', '', 'published', 'https://example.com/blog/blog/public/uploads/covers/date-cover.png', '1 min', 0, 0, 'none', 'not-a-date')"
        );

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'list',
            'page' => 1,
            'pageSize' => 20,
        ]);

        $this->assertSame(200, $response->status, $response->body);
        $article = current(array_filter($response->json()['articles'] ?? [], static fn(array $item): bool => ($item['title'] ?? '') === 'Broken Date Article'));
        $this->assertIsArray($article);
        $this->assertSame('Just now', $article['date'] ?? null);
        $this->assertSame('public/uploads/covers/date-cover.png', $article['cover'] ?? null);
    }

    public function testUpdateRejectsInvalidArticleId(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'update',
            'id' => 0,
            'title' => 'Invalid',
            'body' => 'Invalid',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Invalid article id.', $response->json()['error'] ?? null);
    }

    public function testUpdateRejectsEmptyPublishedContent(): void
    {
        $this->signIn('free@example.com');
        $create = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'save',
            'title' => 'Publish Validation Draft',
            'body' => 'Body for validation.',
            'status' => 'draft',
        ]);
        $articleId = (int) ($create->json()['article']['id'] ?? 0);

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'update',
            'id' => $articleId,
            'title' => '',
            'body' => '',
            'status' => 'published',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Title and content are required.', $response->json()['error'] ?? null);
    }

    public function testUnknownArticleActionIsRejected(): void
    {
        $this->signIn('free@example.com');

        $response = $this->client->postJson('/backend/view/components/article/api-articles.php', [
            'action' => 'no_such_action',
        ]);

        $this->assertSame(400, $response->status);
        $this->assertSame('Unknown action.', $response->json()['error'] ?? null);
    }
}
