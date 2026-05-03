<?php
declare(strict_types=1);

namespace IBlog\Service;

use IBlog\Repository\SubscriptionRepository;

final class SubscriptionService
{
    public function __construct(private readonly SubscriptionRepository $subscriptions)
    {
    }

    public function create(array $data): bool
    {
        return $this->subscriptions->create($data);
    }

    public function findByUser(int $userId): array
    {
        return $this->subscriptions->findByUser($userId);
    }

    public function findById(int $id): ?object
    {
        return $this->subscriptions->findById($id);
    }

    public function update(int $id, array $data): bool
    {
        return $this->subscriptions->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->subscriptions->delete($id);
    }
}
