<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/article.php';

function createArticle(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO article (authorId, title, body, category, tags, status, coverImage, readingTime, likesCount, createdAt)
            VALUES (:authorId, :title, :body, :category, :tags, :status, :coverImage, :readingTime, :likesCount, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':authorId' => $data['authorId'] ?? null,
        ':title' => $data['title'] ?? '',
        ':body' => $data['body'] ?? '',
        ':category' => $data['category'] ?? '',
        ':tags' => $data['tags'] ?? '',
        ':status' => $data['status'] ?? 'draft',
        ':coverImage' => $data['coverImage'] ?? '',
        ':readingTime' => $data['readingTime'] ?? '',
        ':likesCount' => (int) ($data['likesCount'] ?? 0),
    ]);
}

function addArticle(PDO $cnx, array $data): bool
{
    return createArticle($cnx, $data);
}

function getAllArticles(PDO $cnx): array
{
    $rows = $cnx->query('SELECT * FROM article ORDER BY id DESC')->fetchAll();
    return array_map('hydrateArticle', $rows);
}

function getArticleById(PDO $cnx, int $id): ?Article
{
    $stmt = $cnx->prepare('SELECT * FROM article WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateArticle($row) : null;
}

function updateArticle(PDO $cnx, int $id, array $data): bool
{
    $article = getArticleById($cnx, $id);
    if (!$article) {
        return false;
    }

    $sql = 'UPDATE article
            SET authorId = :authorId,
                title = :title,
                body = :body,
                category = :category,
                tags = :tags,
                status = :status,
                coverImage = :coverImage,
                readingTime = :readingTime,
                likesCount = :likesCount
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':authorId' => $data['authorId'] ?? $article->authorId,
        ':title' => $data['title'] ?? $article->title,
        ':body' => $data['body'] ?? $article->body,
        ':category' => $data['category'] ?? $article->category,
        ':tags' => $data['tags'] ?? $article->tags,
        ':status' => $data['status'] ?? $article->status,
        ':coverImage' => $data['coverImage'] ?? $article->coverImage,
        ':readingTime' => $data['readingTime'] ?? $article->readingTime,
        ':likesCount' => (int) ($data['likesCount'] ?? $article->likesCount),
    ]);
}

function deleteArticle(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM article WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateArticle(array $row): Article
{
    $article = new Article(
        $row['authorId'] ?? null,
        $row['title'] ?? '',
        $row['body'] ?? '',
        $row['category'] ?? '',
        $row['tags'] ?? '',
        $row['status'] ?? 'draft',
        $row['coverImage'] ?? '',
        $row['readingTime'] ?? ''
    );

    $article->id = (int) ($row['id'] ?? 0);
    $article->likesCount = (int) ($row['likesCount'] ?? 0);
    $article->createdAt = $row['createdAt'] ?? null;

    return $article;
}
