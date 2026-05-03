<?php
declare(strict_types=1);

require_once __DIR__ . '/../Database/Database.php';
require_once __DIR__ . '/../Repository/SubscriptionRepository.php';
require_once __DIR__ . '/../Service/SubscriptionService.php';

use IBlog\Repository\SubscriptionRepository;
use IBlog\Service\SubscriptionService;

function subscriptionRepository(PDO $cnx): SubscriptionRepository
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new SubscriptionRepository($cnx);
    }

    return $instances[$key];
}

function subscriptionService(PDO $cnx): SubscriptionService
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new SubscriptionService(subscriptionRepository($cnx));
    }

    return $instances[$key];
}

function createSubscription(PDO $cnx, array $data): bool
{
    return subscriptionService($cnx)->create($data);
}

function addSubscription(PDO $cnx, array $data): bool
{
    return createSubscription($cnx, $data);
}

function getSubscriptionsByUser(PDO $cnx, int $userId): array
{
    return subscriptionService($cnx)->findByUser($userId);
}

function getSubscriptionById(PDO $cnx, int $id): ?object
{
    return subscriptionService($cnx)->findById($id);
}

function updateSubscription(PDO $cnx, int $id, array $data): bool
{
    return subscriptionService($cnx)->update($id, $data);
}

function deleteSubscription(PDO $cnx, int $id): bool
{
    return subscriptionService($cnx)->delete($id);
}
