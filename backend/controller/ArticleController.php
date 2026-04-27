<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/article.php';

function articleControllerTableExists(PDO $cnx, string $table): bool
{
    try {
        $stmt = $cnx->prepare('SHOW TABLES LIKE :table');
        $stmt->execute([':table' => $table]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function articleControllerColumnExists(PDO $cnx, string $table, string $column): bool
{
    try {
        $stmt = $cnx->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
        $stmt->execute([':column' => $column]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function articleControllerAuthorSelect(PDO $cnx): string
{
    $hasProfileTable = articleControllerTableExists($cnx, 'user_profile');
    $hasUserAvatar = articleControllerColumnExists($cnx, 'users', 'avatar');

    if ($hasProfileTable && $hasUserAvatar) {
        $avatarExpr = "COALESCE(up.avatar, u.avatar, '')";
    } elseif ($hasProfileTable) {
        $avatarExpr = "COALESCE(up.avatar, '')";
    } elseif ($hasUserAvatar) {
        $avatarExpr = "COALESCE(u.avatar, '')";
    } else {
        $avatarExpr = "''";
    }

    return "u.name AS author_name, {$avatarExpr} AS author_avatar";
}

function articleControllerAuthorJoin(PDO $cnx): string
{
    $join = 'LEFT JOIN users u ON a.userId = u.id';
    if (articleControllerTableExists($cnx, 'user_profile')) {
        $join .= ' LEFT JOIN user_profile up ON up.userId = u.id';
    }
    return $join;
}

function createArticle(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO article 
                (userId, title, body, category, tags, status, coverImage, readingTime, likesCount, views, label, createdAt)
            VALUES 
                (:userId, :title, :body, :category, :tags, :status, :coverImage, :readingTime, 0, 0, :label, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':userId' => $data['userId'] ?? $data['authorId'] ?? null,
        ':title' => $data['title'] ?? '',
        ':body' => $data['body'] ?? '',
        ':category' => $data['category'] ?? '',
        ':tags' => $data['tags'] ?? '',
        ':status' => $data['status'] ?? 'draft',
        ':coverImage' => $data['coverImage'] ?? '',
        ':readingTime' => $data['readingTime'] ?? '',
        ':label' => $data['label'] ?? 'none',
    ]);
}

function addArticle(PDO $cnx, array $data): bool
{
    return createArticle($cnx, $data);
}

// Tous les articles (liste admin)
function getAllArticles(PDO $cnx): array
{
    $rows = $cnx->query(
        'SELECT a.*, ' . articleControllerAuthorSelect($cnx) . '
         FROM article a
         ' . articleControllerAuthorJoin($cnx) . '
         WHERE a.status != "deleted"
         ORDER BY a.id DESC'
    )->fetchAll();

    return array_map('hydrateArticle', $rows);
}

// Articles d'un utilisateur connecte (published + draft)
function getArticlesByAuthor(PDO $cnx, int $authorId): array
{
    $stmt = $cnx->prepare(
        'SELECT a.*, ' . articleControllerAuthorSelect($cnx) . '
         FROM article a
         ' . articleControllerAuthorJoin($cnx) . '
         WHERE a.userId = :authorId
           AND a.status IN ("published", "draft", "archived")
         ORDER BY a.createdAt DESC'
    );
    $stmt->execute([':authorId' => $authorId]);
    return array_map('hydrateArticle', $stmt->fetchAll());
}

// Articles publies uniquement (page publique)
function getPublishedArticles(PDO $cnx): array
{
    $rows = $cnx->query(
        'SELECT a.*, ' . articleControllerAuthorSelect($cnx) . '
         FROM article a
         ' . articleControllerAuthorJoin($cnx) . '
         WHERE a.status = "published"
         ORDER BY a.createdAt DESC'
    )->fetchAll();

    return array_map('hydrateArticle', $rows);
}

function getArticleById(PDO $cnx, int $id): ?Article
{
    $stmt = $cnx->prepare(
        'SELECT a.*, ' . articleControllerAuthorSelect($cnx) . '
         FROM article a
         ' . articleControllerAuthorJoin($cnx) . '
         WHERE a.id = :id
           AND a.status != "deleted"
         LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateArticle($row) : null;
}

function searchArticles(PDO $cnx, string $search): array
{
    $stmt = $cnx->prepare(
        'SELECT a.*, ' . articleControllerAuthorSelect($cnx) . '
         FROM article a
         ' . articleControllerAuthorJoin($cnx) . '
         WHERE a.status != "deleted"
           AND (a.title LIKE :titleSearch OR a.body LIKE :bodySearch OR a.category LIKE :categorySearch)
         ORDER BY a.createdAt DESC'
    );
    $stmt->execute([
        ':titleSearch' => '%' . $search . '%',
        ':bodySearch' => '%' . $search . '%',
        ':categorySearch' => '%' . $search . '%',
    ]);
    return array_map('hydrateArticle', $stmt->fetchAll());
}

function updateArticle(PDO $cnx, int $id, array $data): bool
{
    $article = getArticleById($cnx, $id);
    if (!$article) return false;

    $sql = 'UPDATE article
            SET title       = :title,
                body        = :body,
                category    = :category,
                tags        = :tags,
                status      = :status,
                coverImage  = :coverImage,
                readingTime = :readingTime,
                label       = :label
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':title' => $data['title'] ?? $article->title,
        ':body' => $data['body'] ?? $article->body,
        ':category' => $data['category'] ?? $article->category,
        ':tags' => $data['tags'] ?? $article->tags,
        ':status' => $data['status'] ?? $article->status,
        ':coverImage' => $data['coverImage'] ?? $article->coverImage,
        ':readingTime' => $data['readingTime'] ?? $article->readingTime,
        ':label' => $data['label'] ?? $article->label,
    ]);
}

function deleteArticle(PDO $cnx, int $id): bool
{
    // Soft delete - garde les donnees pour les analytics
    $stmt = $cnx->prepare("UPDATE article SET status = 'deleted' WHERE id = :id");
    return $stmt->execute([':id' => $id]);
}

function hydrateArticle(array $row): Article
{
    $article = new Article(
        $row['userId'] ?? $row['authorId'] ?? null,
        $row['title'] ?? '',
        $row['body'] ?? '',
        $row['category'] ?? '',
        $row['tags'] ?? '',
        $row['status'] ?? 'draft',
        $row['coverImage'] ?? '',
        $row['readingTime'] ?? '',
        (int) ($row['views'] ?? 0),
        $row['label'] ?? 'none'
    );

    $article->id = (int) ($row['id'] ?? 0);
    $article->authorId = (int) ($row['userId'] ?? $row['authorId'] ?? 0);
    $article->likesCount = (int) ($row['likesCount'] ?? 0);
    $article->createdAt = $row['createdAt'] ?? null;
    $article->author_name = $row['author_name'] ?? 'Anonyme';
    $article->author_avatar = $row['author_avatar'] ?? '';

    return $article;
}
