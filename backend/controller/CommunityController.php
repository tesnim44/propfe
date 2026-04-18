<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/community.php';

function createCommunity(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO community (creatorId, name, description, icon, isPrivate, topics, memberCount, createdAt)
            VALUES (:creatorId, :name, :description, :icon, :isPrivate, :topics, :memberCount, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':creatorId' => $data['creatorId'] ?? null,
        ':name' => $data['name'] ?? '',
        ':description' => $data['description'] ?? '',
        ':icon' => $data['icon'] ?? '',
        ':isPrivate' => (int) ($data['isPrivate'] ?? 0),
        ':topics' => $data['topics'] ?? '',
        ':memberCount' => (int) ($data['memberCount'] ?? 0),
    ]);
}

function addCommunity(PDO $cnx, array $data): bool
{
    return createCommunity($cnx, $data);
}

function getAllCommunities(PDO $cnx): array
{
    $rows = $cnx->query('SELECT * FROM community ORDER BY id DESC')->fetchAll();
    return array_map('hydrateCommunity', $rows);
}

function getCommunityById(PDO $cnx, int $id): ?Community
{
    $stmt = $cnx->prepare('SELECT * FROM community WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateCommunity($row) : null;
}

function updateCommunity(PDO $cnx, int $id, array $data): bool
{
    $community = getCommunityById($cnx, $id);
    if (!$community) {
        return false;
    }

    $sql = 'UPDATE community
            SET name = :name,
                description = :description,
                icon = :icon,
                isPrivate = :isPrivate,
                topics = :topics,
                memberCount = :memberCount
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':name' => $data['name'] ?? $community->name,
        ':description' => $data['description'] ?? $community->description,
        ':icon' => $data['icon'] ?? $community->icon,
        ':isPrivate' => (int) ($data['isPrivate'] ?? $community->isPrivate),
        ':topics' => $data['topics'] ?? $community->topics,
        ':memberCount' => (int) ($data['memberCount'] ?? $community->memberCount),
    ]);
}

function deleteCommunity(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM community WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateCommunity(array $row): Community
{
    $community = new Community(
        $row['creatorId'] ?? null,
        $row['name'] ?? '',
        $row['description'] ?? '',
        $row['icon'] ?? '',
        (int) ($row['isPrivate'] ?? 0),
        $row['topics'] ?? ''
    );

    $community->id = (int) ($row['id'] ?? 0);
    $community->memberCount = (int) ($row['memberCount'] ?? 0);
    $community->createdAt = $row['createdAt'] ?? null;

    return $community;
}
