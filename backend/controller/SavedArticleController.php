<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/savedarticle.php';

function savedArticleTableExists(PDO $cnx, string $table): bool
{
    try {
        $stmt = $cnx->prepare('SHOW TABLES LIKE :table');
        $stmt->execute([':table' => $table]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function savedArticleColumnExists(PDO $cnx, string $table, string $column): bool
{
    try {
        $stmt = $cnx->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
        $stmt->execute([':column' => $column]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function savedArticleAuthorSelect(PDO $cnx): string
{
    $hasProfileTable = savedArticleTableExists($cnx, 'user_profile');
    $hasUserAvatar = savedArticleColumnExists($cnx, 'users', 'avatar');

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

function savedArticleAuthorJoin(PDO $cnx): string
{
    $join = 'LEFT JOIN users u ON a.userId = u.id';
    if (savedArticleTableExists($cnx, 'user_profile')) {
        $join .= ' LEFT JOIN user_profile up ON up.userId = u.id';
    }
    return $join;
}

// ─── Sauvegarder un article ───────────────────────────────
function saveArticle(PDO $cnx, int $userId, int $articleId): array
{
    // Vérifier si déjà sauvegardé (ta BD a une contrainte UNIQUE)
    $check = $cnx->prepare(
        'SELECT id FROM savedarticle
         WHERE userId = :userId AND articleId = :articleId
         LIMIT 1'
    );
    $check->execute([':userId' => $userId, ':articleId' => $articleId]);

    if ($check->fetch()) {
        return ['success' => false, 'message' => 'Déjà sauvegardé'];
    }

    $stmt = $cnx->prepare(
        'INSERT INTO savedarticle (userId, articleId, savedAt)
         VALUES (:userId, :articleId, NOW())'
    );

    $ok = $stmt->execute([
        ':userId'    => $userId,
        ':articleId' => $articleId,
    ]);

    return [
        'success' => $ok,
        'message' => $ok ? 'Article sauvegardé !' : 'Erreur lors de la sauvegarde'
    ];
}

// ─── Vérifier si déjà sauvegardé ─────────────────────────
function isArticleSaved(PDO $cnx, int $userId, int $articleId): bool
{
    $stmt = $cnx->prepare(
        'SELECT id FROM savedarticle
         WHERE userId = :userId AND articleId = :articleId
         LIMIT 1'
    );
    $stmt->execute([':userId' => $userId, ':articleId' => $articleId]);
    return (bool) $stmt->fetch();
}

// ─── Récupérer l'id du saved (pour unsave) ───────────────
function getSavedId(PDO $cnx, int $userId, int $articleId): ?int
{
    $stmt = $cnx->prepare(
        'SELECT id FROM savedarticle
         WHERE userId = :userId AND articleId = :articleId
         LIMIT 1'
    );
    $stmt->execute([':userId' => $userId, ':articleId' => $articleId]);
    $row = $stmt->fetch();
    return $row ? (int) $row['id'] : null;
}

// ─── Récupérer tous les sauvegardés d'un user ────────────
function getSavedArticlesByUser(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare(
        'SELECT
            sa.id        AS savedId,
            sa.savedAt,
            a.id         AS articleId,
            a.title,
            a.body,
            a.category,
            a.coverImage,
            a.readingTime,
            a.views,
            a.likesCount,
            a.label,
            a.userId     AS authorId,
            a.createdAt  AS articleCreatedAt,
            ' . savedArticleAuthorSelect($cnx) . '
         FROM savedarticle sa
         JOIN article a  ON sa.articleId = a.id
         ' . savedArticleAuthorJoin($cnx) . '
         WHERE sa.userId  = :userId
           AND a.status   = "published"
         ORDER BY sa.savedAt DESC'
    );
    $stmt->execute([':userId' => $userId]);
    return $stmt->fetchAll();
}

// ─── Supprimer un sauvegardé ──────────────────────────────
function unsaveArticle(PDO $cnx, int $savedId, int $userId): bool
{
    $stmt = $cnx->prepare(
        'DELETE FROM savedarticle
         WHERE id = :id AND userId = :userId'
    );
    return $stmt->execute([':id' => $savedId, ':userId' => $userId]);
}
