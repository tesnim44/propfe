<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/CommunityMember.php';

function createCommunityMember(PDO $cnx, array $data): bool
{
    $stmt = $cnx->prepare(
        'INSERT INTO communitymember (communityId, userId, role, isBanned, notificationsOn, joinedAt)
         VALUES (:communityId, :userId, :role, :isBanned, :notificationsOn, NOW())'
    );

    return $stmt->execute([
        ':communityId' => (int) ($data['communityId'] ?? 0),
        ':userId' => (int) ($data['userId'] ?? 0),
        ':role' => (string) ($data['role'] ?? 'member'),
        ':isBanned' => (int) ($data['isBanned'] ?? 0),
        ':notificationsOn' => (int) ($data['notificationsOn'] ?? 1),
    ]);
}

function getCommunityMembers(PDO $cnx, int $communityId): array
{
    $stmt = $cnx->prepare(
        'SELECT * FROM communitymember WHERE communityId = :communityId ORDER BY id DESC'
    );
    $stmt->execute([':communityId' => $communityId]);
    return array_map('hydrateCommunityMember', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getCommunityMemberById(PDO $cnx, int $id): ?CommunityMember
{
    $stmt = $cnx->prepare('SELECT * FROM communitymember WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? hydrateCommunityMember($row) : null;
}

function updateCommunityMember(PDO $cnx, int $id, array $data): bool
{
    $member = getCommunityMemberById($cnx, $id);
    if ($member === null) {
        return false;
    }

    $stmt = $cnx->prepare(
        'UPDATE communitymember
         SET role = :role,
             isBanned = :isBanned,
             notificationsOn = :notificationsOn
         WHERE id = :id'
    );

    return $stmt->execute([
        ':id' => $id,
        ':role' => (string) ($data['role'] ?? $member->role),
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
        (int) ($row['communityId'] ?? 0),
        (int) ($row['userId'] ?? 0),
        (string) ($row['role'] ?? 'member'),
        (int) ($row['isBanned'] ?? 0),
        (int) ($row['notificationsOn'] ?? 1),
        $row['joinedAt'] ?? null
    );

    $member->id = isset($row['id']) ? (int) $row['id'] : null;
    return $member;
}
