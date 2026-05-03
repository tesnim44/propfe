<?php
declare(strict_types=1);

namespace IBlog\Repository;

use PDO;
use stdClass;

final class CommunityMemberRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function create(array $data): bool
    {
        $joinedAtExpression = \dbDriver($this->connection) === 'sqlite' ? 'CURRENT_TIMESTAMP' : 'NOW()';
        $stmt = $this->connection->prepare(
            'INSERT INTO communitymember (communityId, userId, role, isBanned, notificationsOn, joinedAt)
             VALUES (:communityId, :userId, :role, :isBanned, :notificationsOn, ' . $joinedAtExpression . ')'
        );

        return $stmt->execute([
            ':communityId' => (int) ($data['communityId'] ?? 0),
            ':userId' => (int) ($data['userId'] ?? 0),
            ':role' => (string) ($data['role'] ?? 'member'),
            ':isBanned' => (int) ($data['isBanned'] ?? 0),
            ':notificationsOn' => (int) ($data['notificationsOn'] ?? 1),
        ]);
    }

    public function findByCommunity(int $communityId): array
    {
        $stmt = $this->connection->prepare(
            'SELECT * FROM communitymember WHERE communityId = :communityId ORDER BY id DESC'
        );
        $stmt->execute([':communityId' => $communityId]);

        return array_map(fn(array $row): object => $this->hydrate($row), $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
    }

    public function findById(int $id): ?object
    {
        $stmt = $this->connection->prepare('SELECT * FROM communitymember WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $this->hydrate($row) : null;
    }

    public function update(int $id, array $data): bool
    {
        $member = $this->findById($id);
        if ($member === null) {
            return false;
        }

        $stmt = $this->connection->prepare(
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

    public function delete(int $id): bool
    {
        $stmt = $this->connection->prepare('DELETE FROM communitymember WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    private function hydrate(array $row): object
    {
        $member = new stdClass();
        $member->id = isset($row['id']) ? (int) $row['id'] : null;
        $member->communityId = (int) ($row['communityId'] ?? 0);
        $member->userId = (int) ($row['userId'] ?? 0);
        $member->role = (string) ($row['role'] ?? 'member');
        $member->isBanned = (int) ($row['isBanned'] ?? 0);
        $member->notificationsOn = (int) ($row['notificationsOn'] ?? 1);
        $member->joinedAt = $row['joinedAt'] ?? null;

        return $member;
    }
}
