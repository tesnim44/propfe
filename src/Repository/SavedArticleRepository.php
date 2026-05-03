<?php
declare(strict_types=1);

namespace IBlog\Repository;

use PDO;

final class SavedArticleRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function save(int $userId, int $articleId): array
    {
        $check = $this->connection->prepare(
            'SELECT id FROM savedarticle WHERE userId = :userId AND articleId = :articleId LIMIT 1'
        );
        $check->execute([
            ':userId' => $userId,
            ':articleId' => $articleId,
        ]);

        if ($check->fetch()) {
            return ['success' => false, 'message' => 'Déjà sauvegardé'];
        }

        $savedAtExpression = \dbDriver($this->connection) === 'sqlite' ? 'CURRENT_TIMESTAMP' : 'NOW()';
        $stmt = $this->connection->prepare(
            'INSERT INTO savedarticle (userId, articleId, savedAt)
             VALUES (:userId, :articleId, ' . $savedAtExpression . ')'
        );

        $ok = $stmt->execute([
            ':userId' => $userId,
            ':articleId' => $articleId,
        ]);

        return [
            'success' => $ok,
            'message' => $ok ? 'Article sauvegardé !' : 'Erreur lors de la sauvegarde',
        ];
    }

    public function isSaved(int $userId, int $articleId): bool
    {
        $stmt = $this->connection->prepare(
            'SELECT id FROM savedarticle WHERE userId = :userId AND articleId = :articleId LIMIT 1'
        );
        $stmt->execute([
            ':userId' => $userId,
            ':articleId' => $articleId,
        ]);

        return (bool) $stmt->fetch();
    }

    public function findSavedId(int $userId, int $articleId): ?int
    {
        $stmt = $this->connection->prepare(
            'SELECT id FROM savedarticle WHERE userId = :userId AND articleId = :articleId LIMIT 1'
        );
        $stmt->execute([
            ':userId' => $userId,
            ':articleId' => $articleId,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? (int) ($row['id'] ?? 0) : null;
    }

    public function findByUser(int $userId): array
    {
        $stmt = $this->connection->prepare(
            'SELECT
                sa.id AS savedId,
                sa.savedAt,
                a.id AS articleId,
                a.title,
                a.body,
                a.category,
                a.tags,
                a.coverImage,
                a.readingTime,
                a.views,
                a.likesCount,
                a.label,
                a.userId AS authorId,
                a.createdAt AS articleCreatedAt,
                ' . $this->authorSelect() . '
             FROM savedarticle sa
             JOIN article a ON sa.articleId = a.id
             ' . $this->authorJoin() . '
             WHERE sa.userId = :userId
               AND a.status = "published"
             ORDER BY sa.savedAt DESC'
        );
        $stmt->execute([':userId' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function unsave(int $savedId, int $userId): bool
    {
        $stmt = $this->connection->prepare(
            'DELETE FROM savedarticle WHERE id = :id AND userId = :userId'
        );

        return $stmt->execute([
            ':id' => $savedId,
            ':userId' => $userId,
        ]);
    }

    private function authorSelect(): string
    {
        $hasProfileTable = \dbTableExists($this->connection, 'user_profile');
        $hasUserAvatar = \dbColumnExists($this->connection, 'users', 'avatar');

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

    private function authorJoin(): string
    {
        $join = 'LEFT JOIN users u ON a.userId = u.id';
        if (\dbTableExists($this->connection, 'user_profile')) {
            $join .= ' LEFT JOIN user_profile up ON up.userId = u.id';
        }

        return $join;
    }
}
