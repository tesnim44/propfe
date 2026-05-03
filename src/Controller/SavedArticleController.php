<?php
declare(strict_types=1);

require_once __DIR__ . '/../Database/Database.php';
require_once __DIR__ . '/../Repository/SavedArticleRepository.php';
require_once __DIR__ . '/../Service/SavedArticleService.php';

use IBlog\Repository\SavedArticleRepository;
use IBlog\Service\SavedArticleService;

function savedArticleRepository(PDO $cnx): SavedArticleRepository
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new SavedArticleRepository($cnx);
    }

    return $instances[$key];
}

function savedArticleService(PDO $cnx): SavedArticleService
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new SavedArticleService(savedArticleRepository($cnx));
    }

    return $instances[$key];
}

function saveArticle(PDO $cnx, int $userId, int $articleId): array
{
    return savedArticleService($cnx)->save($userId, $articleId);
}

function isArticleSaved(PDO $cnx, int $userId, int $articleId): bool
{
    return savedArticleService($cnx)->isSaved($userId, $articleId);
}

function getSavedId(PDO $cnx, int $userId, int $articleId): ?int
{
    return savedArticleService($cnx)->findSavedId($userId, $articleId);
}

function getSavedArticlesByUser(PDO $cnx, int $userId): array
{
    return savedArticleService($cnx)->findByUser($userId);
}

function unsaveArticle(PDO $cnx, int $savedId, int $userId): bool
{
    return savedArticleService($cnx)->unsave($savedId, $userId);
}
