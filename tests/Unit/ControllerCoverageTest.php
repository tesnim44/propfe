<?php
declare(strict_types=1);

namespace IBlog\Tests\Unit;

use IBlog\Tests\Support\EndpointTestCase;

require_once __DIR__ . '/../../backend/controller/ArticleController.php';
require_once __DIR__ . '/../../backend/controller/SavedArticleController.php';
require_once __DIR__ . '/../../backend/controller/UserController.php';

final class ControllerCoverageTest extends EndpointTestCase
{
    public function testUserControllerReadAndSearchHelpersReturnExpectedRows(): void
    {
        $users = getAllUsers($this->db());
        $this->assertCount(4, $users);
        $this->assertSame('other@example.com', $users[0]['email'] ?? null);

        $matches = searchUsers($this->db(), 'Premium');
        $this->assertCount(1, $matches);
        $this->assertSame('premium@example.com', $matches[0]['email'] ?? null);
    }

    public function testUserControllerDeleteRemovesUser(): void
    {
        $created = AddUser($this->db(), [
            'name' => 'Delete Target',
            'email' => 'delete.target@example.com',
            'password' => 'StrongPass1!',
            'plan' => 'free',
            'isPremium' => 0,
            'isAdmin' => 0,
        ]);
        $this->assertTrue($created);

        $user = getUserByEmail($this->db(), 'delete.target@example.com');
        $this->assertIsArray($user);
        $deleted = deleteUser($this->db(), (int) $user['id']);
        $this->assertTrue($deleted);
        $this->assertFalse(getUserByEmail($this->db(), 'delete.target@example.com'));
    }

    public function testArticleControllerListingAndSearchHelpersWork(): void
    {
        $all = getAllArticles($this->db());
        $published = getPublishedArticles($this->db());
        $authorArticles = getArticlesByAuthor($this->db(), 2);
        $matches = searchArticles($this->db(), 'Alpha');

        $this->assertCount(3, $all);
        $this->assertCount(2, $published);
        $this->assertCount(1, $authorArticles);
        $this->assertCount(1, $matches);
        $this->assertSame('Searchable Article Alpha', $matches[0]->title);
    }

    public function testArticleControllerDeleteMarksArticleAsDeleted(): void
    {
        $deleted = deleteArticle($this->db(), 1);
        $this->assertTrue($deleted);

        $published = getPublishedArticles($this->db());
        $titles = array_map(static fn($article) => $article->title, $published);
        $this->assertNotContains('Searchable Article Alpha', $titles);
        $this->assertNull(getArticleById($this->db(), 1));
    }

    public function testSavedArticleHelpersHandleDuplicateSaveAndLookup(): void
    {
        $firstSave = saveArticle($this->db(), 2, 1);
        $this->assertTrue($firstSave['success'] ?? false);
        $this->assertTrue(isArticleSaved($this->db(), 2, 1));

        $duplicateSave = saveArticle($this->db(), 2, 1);
        $this->assertFalse($duplicateSave['success'] ?? true);

        $savedRows = getSavedArticlesByUser($this->db(), 2);
        $this->assertCount(1, $savedRows);
        $savedId = getSavedId($this->db(), 2, 1);
        $this->assertNotNull($savedId);
        $this->assertTrue(unsaveArticle($this->db(), (int) $savedId, 2));
        $this->assertFalse(isArticleSaved($this->db(), 2, 1));
    }
}
