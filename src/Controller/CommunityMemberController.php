<?php
declare(strict_types=1);

require_once __DIR__ . '/../Database/Database.php';
require_once __DIR__ . '/../Repository/CommunityMemberRepository.php';

use IBlog\Repository\CommunityMemberRepository;

function communityMemberRepository(PDO $cnx): CommunityMemberRepository
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new CommunityMemberRepository($cnx);
    }

    return $instances[$key];
}

function createCommunityMember(PDO $cnx, array $data): bool
{
    return communityMemberRepository($cnx)->create($data);
}

function getCommunityMembers(PDO $cnx, int $communityId): array
{
    return communityMemberRepository($cnx)->findByCommunity($communityId);
}

function getCommunityMemberById(PDO $cnx, int $id): ?object
{
    return communityMemberRepository($cnx)->findById($id);
}

function updateCommunityMember(PDO $cnx, int $id, array $data): bool
{
    return communityMemberRepository($cnx)->update($id, $data);
}

function deleteCommunityMember(PDO $cnx, int $id): bool
{
    return communityMemberRepository($cnx)->delete($id);
}

function hydrateCommunityMember(array $row): object
{
    return (object) $row;
}
