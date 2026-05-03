<?php
declare(strict_types=1);

require_once __DIR__ . '/../Database/Database.php';
require_once __DIR__ . '/../Repository/ArticleRepository.php';
require_once __DIR__ . '/../Service/ArticleService.php';

use IBlog\Repository\ArticleRepository;
use IBlog\Service\ArticleService;

function articleRepository(PDO $cnx): ArticleRepository
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new ArticleRepository($cnx);
    }

    return $instances[$key];
}

function articleService(PDO $cnx): ArticleService
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new ArticleService(articleRepository($cnx));
    }

    return $instances[$key];
}

function createArticle(PDO $cnx, array $data): bool
{
    return articleService($cnx)->create($data);
}

function addArticle(PDO $cnx, array $data): bool
{
    return createArticle($cnx, $data);
}

function getAllArticles(PDO $cnx): array
{
    return articleService($cnx)->findAll();
}

function getArticlesByAuthor(PDO $cnx, int $authorId): array
{
    return articleService($cnx)->findByAuthor($authorId);
}

function getPublishedArticles(PDO $cnx): array
{
    return articleService($cnx)->findPublished();
}

function getArticleById(PDO $cnx, int $id): ?object
{
    return articleService($cnx)->findById($id);
}

function searchArticles(PDO $cnx, string $search): array
{
    return articleService($cnx)->search($search);
}

function updateArticle(PDO $cnx, int $id, array $data): bool
{
    return articleService($cnx)->update($id, $data);
}

function deleteArticle(PDO $cnx, int $id): bool
{
    return articleService($cnx)->delete($id);
}
