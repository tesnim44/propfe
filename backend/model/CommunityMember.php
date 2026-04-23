<?php
// models/CommunityMember.php

class CommunityMember {
    public $id;
    public $communityId;
    public $userId;
    public $role;
    public $isBanned;
    public $notificationsOn;
    public $joinedAt;

    private static $pdo;

    public static function setPDO(PDO $pdo) {
        self::$pdo = $pdo;
    }

    public function __construct($communityId, $userId, $role = 'member', $isBanned = false, $notificationsOn = true) {
        $this->communityId       = $communityId;
        $this->userId            = $userId;
        $this->role              = $role;
        $this->isBanned          = $isBanned ? 1 : 0;
        $this->notificationsOn   = $notificationsOn ? 1 : 0;
        $this->joinedAt          = date('Y-m-d H:i:s');
    }

    /* ── Finders ─────────────────────────────────────────── */

    /**
     * Find a membership row by community + user.
     */
    public static function findByUserAndCommunity(int $userId, string $communityId): ?self {
        $stmt = self::$pdo->prepare(
            'SELECT * FROM community_members
              WHERE communityId = :cid AND userId = :uid
              LIMIT 1'
        );
        $stmt->execute([':cid' => $communityId, ':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? self::fromDatabaseRow($row) : null;
    }

    /* ── Persistence ─────────────────────────────────────── */

    /**
     * Insert this membership into the DB.
     */
    public function save(): bool {
        $stmt = self::$pdo->prepare(
            'INSERT INTO community_members
                (communityId, userId, role, isBanned, notificationsOn, joinedAt)
             VALUES (:cid, :uid, :role, 0, 1, NOW())'
        );
        $ok = $stmt->execute([
            ':cid'  => $this->communityId,
            ':uid'  => $this->userId,
            ':role' => $this->role,
        ]);
        if ($ok) $this->id = (int) self::$pdo->lastInsertId();
        return $ok;
    }

    /* ── Accessors ───────────────────────────────────────── */

    public function isAdmin(): bool {
        return in_array($this->role, ['admin', 'creator'], true);
    }

    public function isCreator(): bool {
        return $this->role === 'creator';
    }

    public function isBannedMember(): bool {
        return (bool) $this->isBanned;
    }

    /* ── Helpers ─────────────────────────────────────────── */

    public static function fromDatabaseRow(array $row): self {
        $member = new self(
            $row['communityId'] ?? $row['community_id'] ?? 0,
            $row['userId']      ?? $row['user_id']      ?? 0,
            $row['role']        ?? 'member',
            (bool)($row['isBanned']        ?? $row['is_banned']        ?? false),
            (bool)($row['notificationsOn'] ?? $row['notifications_on'] ?? true)
        );
        $member->id       = isset($row['id']) ? (int) $row['id'] : null;
        $member->joinedAt = $row['joinedAt'] ?? $row['joined_at'] ?? null;
        return $member;
    }

    public function toArray(): array {
        return [
            'id'              => $this->id,
            'communityId'     => $this->communityId,
            'userId'          => $this->userId,
            'role'            => $this->role,
            'isBanned'        => (bool) $this->isBanned,
            'notificationsOn' => (bool) $this->notificationsOn,
            'joinedAt'        => $this->joinedAt,
        ];
    }
}
