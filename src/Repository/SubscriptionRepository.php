<?php
declare(strict_types=1);

namespace IBlog\Repository;

use PDO;
use stdClass;

final class SubscriptionRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function create(array $data): bool
    {
        $startedAtExpression = \dbDriver($this->connection) === 'sqlite' ? 'CURRENT_TIMESTAMP' : 'NOW()';
        $stmt = $this->connection->prepare(
            'INSERT INTO subscription (userId, plan, amount, currency, status, promoCode, startedAt, expiresAt)
             VALUES (:userId, :plan, :amount, :currency, :status, :promoCode, ' . $startedAtExpression . ', :expiresAt)'
        );

        return $stmt->execute([
            ':userId' => (int) ($data['userId'] ?? 0),
            ':plan' => (string) ($data['plan'] ?? 'premium'),
            ':amount' => (float) ($data['amount'] ?? 0),
            ':currency' => (string) ($data['currency'] ?? 'TND'),
            ':status' => (string) ($data['status'] ?? 'active'),
            ':promoCode' => (string) ($data['promoCode'] ?? ''),
            ':expiresAt' => (string) ($data['expiresAt'] ?? date('Y-m-d H:i:s', strtotime('+30 days'))),
        ]);
    }

    public function findByUser(int $userId): array
    {
        $stmt = $this->connection->prepare('SELECT * FROM subscription WHERE userId = :userId ORDER BY id DESC');
        $stmt->execute([':userId' => $userId]);

        return array_map(fn(array $row): object => $this->hydrate($row), $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
    }

    public function findById(int $id): ?object
    {
        $stmt = $this->connection->prepare('SELECT * FROM subscription WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $this->hydrate($row) : null;
    }

    public function update(int $id, array $data): bool
    {
        $subscription = $this->findById($id);
        if ($subscription === null) {
            return false;
        }

        $stmt = $this->connection->prepare(
            'UPDATE subscription
             SET plan = :plan,
                 amount = :amount,
                 currency = :currency,
                 status = :status,
                 promoCode = :promoCode,
                 expiresAt = :expiresAt
             WHERE id = :id'
        );

        return $stmt->execute([
            ':id' => $id,
            ':plan' => (string) ($data['plan'] ?? $subscription->plan),
            ':amount' => (float) ($data['amount'] ?? $subscription->amount),
            ':currency' => (string) ($data['currency'] ?? $subscription->currency),
            ':status' => (string) ($data['status'] ?? $subscription->status),
            ':promoCode' => (string) ($data['promoCode'] ?? $subscription->promoCode),
            ':expiresAt' => (string) ($data['expiresAt'] ?? $subscription->expiresAt),
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->connection->prepare('DELETE FROM subscription WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    private function hydrate(array $row): object
    {
        $subscription = new stdClass();
        $subscription->id = (int) ($row['id'] ?? 0);
        $subscription->userId = (int) ($row['userId'] ?? 0);
        $subscription->plan = (string) ($row['plan'] ?? 'premium');
        $subscription->amount = (float) ($row['amount'] ?? 0);
        $subscription->currency = (string) ($row['currency'] ?? 'TND');
        $subscription->status = (string) ($row['status'] ?? 'active');
        $subscription->promoCode = (string) ($row['promoCode'] ?? '');
        $subscription->startedAt = $row['startedAt'] ?? null;
        $subscription->expiresAt = $row['expiresAt'] ?? null;

        return $subscription;
    }
}
