<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/comment.php';

function createComment(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO comment (articleId, userId, body, parentId, likesCount, isFlagged, createdAt)
            VALUES (:articleId, :userId, :body, :parentId, :likesCount, :isFlagged, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':articleId' => $data['articleId'] ?? null,
        ':userId' => $data['userId'] ?? null,
        ':body' => $data['body'] ?? '',
        ':parentId' => $data['parentId'] ?? null,
        ':likesCount' => (int) ($data['likesCount'] ?? 0),
        ':isFlagged' => (int) ($data['isFlagged'] ?? 0),
    ]);
}

function addComment(PDO $cnx, array $data): bool
{
    return createComment($cnx, $data);
}

function getCommentsByArticle(PDO $cnx, int $articleId): array
{
    $stmt = $cnx->prepare('SELECT * FROM comment WHERE articleId = :articleId ORDER BY id DESC');
    $stmt->execute([':articleId' => $articleId]);
    return array_map('hydrateComment', $stmt->fetchAll());
}

function getCommentById(PDO $cnx, int $id): ?Comment
{
    $stmt = $cnx->prepare('SELECT * FROM comment WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateComment($row) : null;
}

function updateComment(PDO $cnx, int $id, array $data): bool
{
    $comment = getCommentById($cnx, $id);
    if (!$comment) {
        return false;
    }

    $sql = 'UPDATE comment
            SET body = :body,
                parentId = :parentId,
                likesCount = :likesCount,
                isFlagged = :isFlagged
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':body' => $data['body'] ?? $comment->body,
        ':parentId' => $data['parentId'] ?? $comment->parentId,
        ':likesCount' => (int) ($data['likesCount'] ?? $comment->likesCount),
        ':isFlagged' => (int) ($data['isFlagged'] ?? $comment->isFlagged),
    ]);
}

function deleteComment(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM comment WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateComment(array $row): Comment
{
    $comment = new Comment(
        $row['articleId'] ?? null,
        $row['userId'] ?? null,
        $row['body'] ?? '',
        $row['parentId'] ?? null
    );

    $comment->id = (int) ($row['id'] ?? 0);
    $comment->likesCount = (int) ($row['likesCount'] ?? 0);
    $comment->isFlagged = (int) ($row['isFlagged'] ?? 0);
    $comment->createdAt = $row['createdAt'] ?? null;

    return $comment;
}
