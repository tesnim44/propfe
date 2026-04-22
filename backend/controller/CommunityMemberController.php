<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/communitymember.php';

function createCommunityMember(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO communitymember (communityId, userId, role, isBanned, notificationsOn, joinedAt)
            VALUES (:communityId, :userId, :role, :isBanned, :notificationsOn, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':communityId' => $data['communityId'] ?? null,
        ':userId' => $data['userId'] ?? null,
        ':role' => $data['role'] ?? 'member',
        ':isBanned' => (int) ($data['isBanned'] ?? 0),
        ':notificationsOn' => (int) ($data['notificationsOn'] ?? 1),
    ]);
}

function joinCommunity(PDO $cnx, array $data): bool
{
    return createCommunityMember($cnx, $data);
}

function getCommunityMembers(PDO $cnx, int $communityId): array
{
    $stmt = $cnx->prepare('SELECT * FROM communitymember WHERE communityId = :communityId ORDER BY id DESC');
    $stmt->execute([':communityId' => $communityId]);
    return array_map('hydrateCommunityMember', $stmt->fetchAll());
}

function getCommunityMemberById(PDO $cnx, int $id): ?CommunityMember
{
    $stmt = $cnx->prepare('SELECT * FROM communitymember WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateCommunityMember($row) : null;
}

function updateCommunityMember(PDO $cnx, int $id, array $data): bool
{
    $member = getCommunityMemberById($cnx, $id);
    if (!$member) {
        return false;
    }

    $sql = 'UPDATE communitymember
            SET role = :role,
                isBanned = :isBanned,
                notificationsOn = :notificationsOn
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':role' => $data['role'] ?? $member->role,
        ':isBanned' => (int) ($data['isBanned'] ?? $member->isBanned),
        ':notificationsOn' => (int) ($data['notificationsOn'] ?? $member->notificationsOn),
    ]);
}

function deleteCommunityMember(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM communitymember WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateCommunityMember(array $row): CommunityMember
{
    $member = new CommunityMember(
        $row['communityId'] ?? null,
        $row['userId'] ?? null,
        $row['role'] ?? 'member',
        (int) ($row['isBanned'] ?? 0),
        (int) ($row['notificationsOn'] ?? 1)
    );

    $member->id = (int) ($row['id'] ?? 0);
    $member->joinedAt = $row['joinedAt'] ?? null;

    return $member;
}