<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/subscription.php';

function createSubscription(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO subscription (userId, plan, amount, currency, status, promoCode, startedAt, expiresAt)
            VALUES (:userId, :plan, :amount, :currency, :status, :promoCode, NOW(), :expiresAt)';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':userId' => $data['userId'] ?? null,
        ':plan' => $data['plan'] ?? 'premium',
        ':amount' => $data['amount'] ?? 0,
        ':currency' => $data['currency'] ?? 'TND',
        ':status' => $data['status'] ?? 'active',
        ':promoCode' => $data['promoCode'] ?? '',
        ':expiresAt' => $data['expiresAt'] ?? date('Y-m-d H:i:s', strtotime('+30 days')),
    ]);
}

function addSubscription(PDO $cnx, array $data): bool
{
    return createSubscription($cnx, $data);
}

function getSubscriptionsByUser(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare('SELECT * FROM subscription WHERE userId = :userId ORDER BY id DESC');
    $stmt->execute([':userId' => $userId]);
    return array_map('hydrateSubscription', $stmt->fetchAll());
}

function getSubscriptionById(PDO $cnx, int $id): ?Subscription
{
    $stmt = $cnx->prepare('SELECT * FROM subscription WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateSubscription($row) : null;
}

function updateSubscription(PDO $cnx, int $id, array $data): bool
{
    $subscription = getSubscriptionById($cnx, $id);
    if (!$subscription) {
        return false;
    }

    $sql = 'UPDATE subscription
            SET plan = :plan,
                amount = :amount,
                currency = :currency,
                status = :status,
                promoCode = :promoCode,
                expiresAt = :expiresAt
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':plan' => $data['plan'] ?? $subscription->plan,
        ':amount' => $data['amount'] ?? $subscription->amount,
        ':currency' => $data['currency'] ?? $subscription->currency,
        ':status' => $data['status'] ?? $subscription->status,
        ':promoCode' => $data['promoCode'] ?? $subscription->promoCode,
        ':expiresAt' => $data['expiresAt'] ?? $subscription->expiresAt,
    ]);
}

function deleteSubscription(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM subscription WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateSubscription(array $row): Subscription
{
    $subscription = new Subscription(
        $row['userId'] ?? null,
        $row['plan'] ?? 'premium',
        $row['amount'] ?? 0,
        $row['currency'] ?? 'TND',
        $row['status'] ?? 'active',
        $row['promoCode'] ?? ''
    );

    $subscription->id = (int) ($row['id'] ?? 0);
    $subscription->startedAt = $row['startedAt'] ?? null;
    $subscription->expiresAt = $row['expiresAt'] ?? null;

    return $subscription;
}
