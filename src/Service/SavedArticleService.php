<?php
declare(strict_types=1);

namespace IBlog\Service;

use IBlog\Repository\SavedArticleRepository;

final class SavedArticleService
{
    public function __construct(private readonly SavedArticleRepository $savedArticles)
    {
    }

    public function save(int $userId, int $articleId): array
    {
        return $this->savedArticles->save($userId, $articleId);
    }

    public function isSaved(int $userId, int $articleId): bool
    {
        return $this->savedArticles->isSaved($userId, $articleId);
    }

    public function findSavedId(int $userId, int $articleId): ?int
    {
        return $this->savedArticles->findSavedId($userId, $articleId);
    }

    public function findByUser(int $userId): array
    {
        return $this->savedArticles->findByUser($userId);
    }

    public function unsave(int $savedId, int $userId): bool
    {
        return $this->savedArticles->unsave($savedId, $userId);
    }
}
