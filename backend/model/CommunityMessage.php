<?php
// models/CommunityMessage.php

class CommunityMessage {
    public $id;
    public $communityId;
    public $userId;
    public $message;
    public $isDeleted;
    public $createdAt;
    public $userName; // joined from users table

    private static $pdo;

    public static function setPDO(PDO $pdo) {
        self::$pdo = $pdo;
    }

    public function __construct($communityId, $userId, $message, $isDeleted = false) {
        $this->communityId = $communityId;
        $this->userId      = $userId;
        $this->message     = $message;
        $this->isDeleted   = $isDeleted ? 1 : 0;
        $this->createdAt   = date('Y-m-d H:i:s');
    }

    /* ── Finders ─────────────────────────────────────────── */

    /**
     * Get last N messages for a community (non-deleted, oldest first).
     */
    public static function findByCommunity(string $communityId, int $limit = 100): array {
        $stmt = self::$pdo->prepare(
            'SELECT cm.id, cm.communityId, cm.userId, cm.message,
                    cm.isDeleted, cm.createdAt,
                    u.name AS userName
               FROM community_messages cm
          LEFT JOIN users u ON u.id = cm.userId
              WHERE cm.communityId = :cid AND cm.isDeleted = 0
           ORDER BY cm.createdAt ASC
              LIMIT :lim'
        );
        $stmt->bindValue(':cid', $communityId);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return array_map(
            [self::class, 'fromDatabaseRow'],
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    /**
     * Find a single message by id.
     */
    public static function findById(int $id): ?self {
        $stmt = self::$pdo->prepare(
            'SELECT cm.id, cm.communityId, cm.userId, cm.message,
                    cm.isDeleted, cm.createdAt,
                    u.name AS userName
               FROM community_messages cm
          LEFT JOIN users u ON u.id = cm.userId
              WHERE cm.id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? self::fromDatabaseRow($row) : null;
    }

    /* ── Persistence ─────────────────────────────────────── */

    /**
     * Insert this message into the DB and set $this->id.
     */
    public function save(): bool {
        $stmt = self::$pdo->prepare(
            'INSERT INTO community_messages (communityId, userId, message, isDeleted, createdAt)
             VALUES (:cid, :uid, :msg, 0, NOW())'
        );
        $ok = $stmt->execute([
            ':cid' => $this->communityId,
            ':uid' => $this->userId,
            ':msg' => $this->message,
        ]);
        if ($ok) {
            $this->id = (int) self::$pdo->lastInsertId();
            // Re-fetch createdAt from DB so the timestamp is accurate
            $r = self::$pdo->query(
                'SELECT createdAt, u.name AS userName
                   FROM community_messages cm
              LEFT JOIN users u ON u.id = cm.userId
                  WHERE cm.id = ' . $this->id
            )->fetch(PDO::FETCH_ASSOC);
            if ($r) {
                $this->createdAt = $r['createdAt'];
                $this->userName  = $r['userName'];
            }
        }
        return $ok;
    }

    /**
     * Soft-delete this message.
     */
    public function softDelete(): bool {
        $stmt = self::$pdo->prepare(
            'UPDATE community_messages SET isDeleted = 1 WHERE id = :id'
        );
        $ok = $stmt->execute([':id' => $this->id]);
        if ($ok) $this->isDeleted = 1;
        return $ok;
    }

    /* ── Helpers ─────────────────────────────────────────── */

    public function getFormattedTime(): string {
        return date('H:i', strtotime($this->createdAt));
    }

    public function getFormattedDate(): string {
        return date('d/m/Y H:i', strtotime($this->createdAt));
    }

    public function getSafeMessage(): string {
        return htmlspecialchars($this->message, ENT_QUOTES, 'UTF-8');
    }

    public static function fromDatabaseRow(array $row): self {
        $msg            = new self(
            $row['communityId'] ?? $row['community_id'] ?? 0,
            $row['userId']      ?? $row['user_id']      ?? 0,
            $row['message']     ?? '',
            (bool)($row['isDeleted'] ?? $row['is_deleted'] ?? false)
        );
        $msg->id        = isset($row['id']) ? (int) $row['id'] : null;
        $msg->createdAt = $row['createdAt'] ?? $row['created_at'] ?? null;
        $msg->userName  = $row['userName']  ?? $row['user_name'] ?? null;
        return $msg;
    }

    public function toArray(): array {
        return [
            'id'            => $this->id,
            'communityId'   => $this->communityId,
            'userId'        => $this->userId,
            'userName'      => $this->userName,
            'message'       => $this->getSafeMessage(),
            'isDeleted'     => $this->isDeleted,
            'createdAt'     => $this->createdAt,
            'formattedTime' => $this->getFormattedTime(),
        ];
    }
}