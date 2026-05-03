<?php
declare(strict_types=1);

namespace IBlog\Service;

use IBlog\Repository\ArticleRepository;

final class ArticleService
{
    public function __construct(private readonly ArticleRepository $articles)
    {
    }

    public function create(array $data): bool
    {
        return $this->articles->create($data);
    }

    public function findAll(): array
    {
        return $this->articles->findAll();
    }

    public function findPublished(): array
    {
        return $this->articles->findPublished();
    }

    public function findByAuthor(int $authorId): array
    {
        return $this->articles->findByAuthor($authorId);
    }

    public function findById(int $id): ?object
    {
        return $this->articles->findById($id);
    }

    public function search(string $search): array
    {
        return $this->articles->search($search);
    }

    public function update(int $id, array $data): bool
    {
        return $this->articles->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->articles->softDelete($id);
    }
}
