<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/message.php';

function createMessage(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO message (senderId, receiverId, body, isRead, readAt, deletedBy, createdAt)
            VALUES (:senderId, :receiverId, :body, :isRead, :readAt, :deletedBy, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':senderId' => $data['senderId'] ?? null,
        ':receiverId' => $data['receiverId'] ?? null,
        ':body' => $data['body'] ?? '',
        ':isRead' => (int) ($data['isRead'] ?? 0),
        ':readAt' => $data['readAt'] ?? null,
        ':deletedBy' => $data['deletedBy'] ?? null,
    ]);
}

function sendMessage(PDO $cnx, array $data): bool
{
    return createMessage($cnx, $data);
}

function getInbox(PDO $cnx, int $userId): array
{
    $stmt = $cnx->prepare('SELECT * FROM message WHERE receiverId = :userId ORDER BY id DESC');
    $stmt->execute([':userId' => $userId]);
    return array_map('hydrateMessage', $stmt->fetchAll());
}

function getMessageById(PDO $cnx, int $id): ?Message
{
    $stmt = $cnx->prepare('SELECT * FROM message WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateMessage($row) : null;
}

function updateMessage(PDO $cnx, int $id, array $data): bool
{
    $message = getMessageById($cnx, $id);
    if (!$message) {
        return false;
    }

    $sql = 'UPDATE message
            SET body = :body,
                isRead = :isRead,
                readAt = :readAt,
                deletedBy = :deletedBy
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':body' => $data['body'] ?? $message->body,
        ':isRead' => (int) ($data['isRead'] ?? $message->isRead),
        ':readAt' => $data['readAt'] ?? $message->readAt,
        ':deletedBy' => $data['deletedBy'] ?? $message->deletedBy,
    ]);
}

function deleteMessage(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM message WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function hydrateMessage(array $row): Message
{
    $message = new Message(
        $row['senderId'] ?? null,
        $row['receiverId'] ?? null,
        $row['body'] ?? ''
    );

    $message->id = (int) ($row['id'] ?? 0);
    $message->isRead = (int) ($row['isRead'] ?? 0);
    $message->readAt = $row['readAt'] ?? null;
    $message->deletedBy = $row['deletedBy'] ?? null;
    $message->createdAt = $row['createdAt'] ?? null;

    return $message;
}
