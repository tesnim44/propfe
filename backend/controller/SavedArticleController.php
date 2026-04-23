<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/savedarticle.php';

function createSavedArticle(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO savedarticle (userId, articleId, note, collection, isPinned, savedAt)
            VALUES (:userId, :articleId, :note, :collection, :isPinned, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':userId' => $data['userId'] ?? null,
        ':articleId' => $data['articleId'] ?? null,
        ':note' => $data['note'] ?? '',
        ':collection' => $data['collection'] ?? '',
        ':isPinned' => (int) ($data['isPinned'] ?? 0),
    ]);
}

function saveArticle(PDO $cnx, array $data): bool
{
    return createSavedArticle($cnx, $data);
}

function getSavedArticlesByUser(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare('SELECT * FROM savedarticle WHERE userId = :userId ORDER BY id DESC');
    $stmt->execute([':userId' => $userId]);
    return array_map('hydrateSavedArticle', $stmt->fetchAll());
}

function getSavedArticleById(PDO $cnx, int $id): ?SavedArticle
{
    $stmt = $cnx->prepare('SELECT * FROM savedarticle WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateSavedArticle($row) : null;
}

function updateSavedArticle(PDO $cnx, int $id, array $data): bool
{
    $saved = getSavedArticleById($cnx, $id);
    if (!$saved) {
        return false;
    }

    $sql = 'UPDATE savedarticle
            SET note = :note,
                collection = :collection,
                isPinned = :isPinned
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':note' => $data['note'] ?? $saved->note,
        ':collection' => $data['collection'] ?? $saved->collection,
        ':isPinned' => (int) ($data['isPinned'] ?? $saved->isPinned),
    ]);
}

function deleteSavedArticle(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM savedarticle WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateSavedArticle(array $row): SavedArticle
{
    $saved = new SavedArticle(
        $row['userId'] ?? null,
        $row['articleId'] ?? null,
        $row['note'] ?? '',
        $row['collection'] ?? '',
        (int) ($row['isPinned'] ?? 0)
    );

    $saved->id = (int) ($row['id'] ?? 0);
    $saved->savedAt = $row['savedAt'] ?? null;

    return $saved;
}
