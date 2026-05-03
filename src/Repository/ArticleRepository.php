<?php
declare(strict_types=1);

namespace IBlog\Repository;

use PDO;
use stdClass;

final class ArticleRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function create(array $data): bool
    {
        $stmt = $this->connection->prepare(
            'INSERT INTO article
                (userId, title, body, category, tags, status, coverImage, readingTime, likesCount, views, label, createdAt)
             VALUES
                (:userId, :title, :body, :category, :tags, :status, :coverImage, :readingTime, 0, 0, :label, NOW())'
        );

        return $stmt->execute([
            ':userId' => (int) ($data['userId'] ?? $data['authorId'] ?? 0),
            ':title' => (string) ($data['title'] ?? ''),
            ':body' => (string) ($data['body'] ?? ''),
            ':category' => (string) ($data['category'] ?? ''),
            ':tags' => (string) ($data['tags'] ?? ''),
            ':status' => (string) ($data['status'] ?? 'draft'),
            ':coverImage' => (string) ($data['coverImage'] ?? ''),
            ':readingTime' => (string) ($data['readingTime'] ?? ''),
            ':label' => (string) ($data['label'] ?? 'none'),
        ]);
    }

    public function findAll(): array
    {
        $rows = $this->connection->query(
            'SELECT a.*, ' . $this->authorSelect() . '
             FROM article a
             ' . $this->authorJoin() . '
             WHERE a.status != "deleted"
             ORDER BY a.id DESC'
        )->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn(array $row): object => $this->hydrate($row), $rows ?: []);
    }

    public function findByAuthor(int $authorId): array
    {
        $stmt = $this->connection->prepare(
            'SELECT a.*, ' . $this->authorSelect() . '
             FROM article a
             ' . $this->authorJoin() . '
             WHERE a.userId = :authorId
               AND a.status IN ("published", "draft", "archived")
             ORDER BY a.createdAt DESC'
        );
        $stmt->execute([':authorId' => $authorId]);

        return array_map(fn(array $row): object => $this->hydrate($row), $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
    }

    public function findPublished(): array
    {
        $rows = $this->connection->query(
            'SELECT a.*, ' . $this->authorSelect() . '
             FROM article a
             ' . $this->authorJoin() . '
             WHERE a.status = "published"
             ORDER BY a.createdAt DESC'
        )->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn(array $row): object => $this->hydrate($row), $rows ?: []);
    }

    public function findById(int $id): ?object
    {
        $stmt = $this->connection->prepare(
            'SELECT a.*, ' . $this->authorSelect() . '
             FROM article a
             ' . $this->authorJoin() . '
             WHERE a.id = :id
               AND a.status != "deleted"
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $this->hydrate($row) : null;
    }

    public function search(string $search): array
    {
        $stmt = $this->connection->prepare(
            'SELECT a.*, ' . $this->authorSelect() . '
             FROM article a
             ' . $this->authorJoin() . '
             WHERE a.status != "deleted"
               AND (
                    a.title LIKE :searchTitle
                    OR a.body LIKE :searchBody
                    OR a.category LIKE :searchCategory
               )
             ORDER BY a.createdAt DESC'
        );
        $like = '%' . $search . '%';
        $stmt->execute([
            ':searchTitle' => $like,
            ':searchBody' => $like,
            ':searchCategory' => $like,
        ]);

        return array_map(fn(array $row): object => $this->hydrate($row), $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
    }

    public function update(int $id, array $data): bool
    {
        $article = $this->findById($id);
        if ($article === null) {
            return false;
        }

        $stmt = $this->connection->prepare(
            'UPDATE article
             SET title = :title,
                 body = :body,
                 category = :category,
                 tags = :tags,
                 status = :status,
                 coverImage = :coverImage,
                 readingTime = :readingTime,
                 label = :label
             WHERE id = :id'
        );

        return $stmt->execute([
            ':id' => $id,
            ':title' => (string) ($data['title'] ?? $article->title ?? ''),
            ':body' => (string) ($data['body'] ?? $article->body ?? ''),
            ':category' => (string) ($data['category'] ?? $article->category ?? ''),
            ':tags' => (string) ($data['tags'] ?? $article->tags ?? ''),
            ':status' => (string) ($data['status'] ?? $article->status ?? 'draft'),
            ':coverImage' => (string) ($data['coverImage'] ?? $article->coverImage ?? ''),
            ':readingTime' => (string) ($data['readingTime'] ?? $article->readingTime ?? ''),
            ':label' => (string) ($data['label'] ?? $article->label ?? 'none'),
        ]);
    }

    public function softDelete(int $id): bool
    {
        $stmt = $this->connection->prepare("UPDATE article SET status = 'deleted' WHERE id = :id");
        return $stmt->execute([':id' => $id]);
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

    private function hydrate(array $row): object
    {
        $article = new stdClass();
        $article->id = (int) ($row['id'] ?? 0);
        $article->authorId = (int) ($row['userId'] ?? $row['authorId'] ?? 0);
        $article->author_name = (string) ($row['author_name'] ?? 'Anonyme');
        $article->author_avatar = (string) ($row['author_avatar'] ?? '');
        $article->title = (string) ($row['title'] ?? '');
        $article->body = (string) ($row['body'] ?? '');
        $article->category = (string) ($row['category'] ?? '');
        $article->tags = (string) ($row['tags'] ?? '');
        $article->status = (string) ($row['status'] ?? 'draft');
        $article->coverImage = (string) ($row['coverImage'] ?? '');
        $article->readingTime = (string) ($row['readingTime'] ?? '');
        $article->likesCount = (int) ($row['likesCount'] ?? 0);
        $article->views = (int) ($row['views'] ?? 0);
        $article->label = (string) ($row['label'] ?? 'none');
        $article->createdAt = $row['createdAt'] ?? null;

        return $article;
    }
}
