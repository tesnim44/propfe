<?php
declare(strict_types=1);

namespace IBlog\Service;

use IBlog\Repository\CommunityRepository;
use IBlog\Utils\Validator;

final class CommunityService
{
    public function __construct(private readonly CommunityRepository $communities)
    {
    }

    public function create(array $data): int|false
    {
        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        if (!Validator::validateName($name) || $description === '') {
            return false;
        }

        return $this->communities->create($data);
    }

    public function addCreatorMembership(int $communityId, int $userId): void
    {
        $this->communities->addCreatorMembership($communityId, $userId);
    }

    public function findAll(): array
    {
        return $this->communities->findAll();
    }

    public function findById(int $id): ?array
    {
        return $this->communities->findById($id);
    }

    public function findByUser(int $userId): array
    {
        return $this->communities->findByUser($userId);
    }

    public function join(int $userId, int $communityId): array
    {
        return $this->communities->join($userId, $communityId);
    }

    public function leave(int $userId, int $communityId): bool
    {
        return $this->communities->leave($userId, $communityId);
    }

    public function findMessages(int $communityId, int $currentUserId): array
    {
        $messages = $this->communities->findMessages($communityId);

        return array_map(static function (array $message) use ($currentUserId): array {
            $message['isMine'] = $currentUserId > 0 && (int) ($message['userId'] ?? 0) === $currentUserId;
            return $message;
        }, $messages);
    }

    public function sendMessage(int $communityId, int $userId, string $message): array|false
    {
        $message = trim($message);
        if ($communityId <= 0 || $userId <= 0 || $message === '') {
            return false;
        }

        $id = $this->communities->createMessage($communityId, $userId, $message);
        if ($id === false) {
            return false;
        }

        return [
            'id' => $id,
            'userId' => $userId,
            'userName' => $this->communities->findUserName($userId),
            'message' => $message,
            'createdAt' => date('Y-m-d H:i:s'),
            'isMine' => true,
        ];
    }

    public function checkMembership(int $communityId, int $userId): array
    {
        return $this->communities->checkMembership($communityId, $userId);
    }

    public function isMember(int $communityId, int $userId): bool
    {
        return $this->communities->isMember($communityId, $userId);
    }

    public function isUserPremium(int $userId): bool
    {
        return $this->communities->isUserPremium($userId);
    }

    public function findThreads(int $communityId, int $userId): array
    {
        if (!$this->communities->isMember($communityId, $userId)) {
            return ['success' => false, 'error' => 'Only community members can access threads'];
        }

        return ['success' => true, 'threads' => $this->communities->findThreads($communityId)];
    }

    public function createThread(int $communityId, int $userId, string $title): array
    {
        $title = trim($title);
        if ($userId <= 0 || $communityId <= 0 || $title === '') {
            return ['success' => false, 'error' => 'Invalid data'];
        }
        if (!Validator::validateThreadTitle($title)) {
            return ['success' => false, 'error' => 'Thread title is too long'];
        }
        if (!$this->communities->isMember($communityId, $userId)) {
            return ['success' => false, 'error' => 'You must join the community first'];
        }
        if (!$this->communities->isUserPremium($userId)) {
            return ['success' => false, 'error' => 'Premium subscription required to create threads'];
        }

        $threadId = $this->communities->createThread($communityId, $userId, $title);
        if ($threadId === false) {
            return ['success' => false, 'error' => 'Unable to create thread'];
        }

        return [
            'success' => true,
            'thread' => [
                'id' => $threadId,
                'communityId' => $communityId,
                'creatorId' => $userId,
                'title' => $title,
                'createdAt' => date('Y-m-d H:i:s'),
                'creatorName' => $this->communities->findUserName($userId),
                'replyCount' => 0,
            ],
        ];
    }

    public function deleteThread(int $communityId, int $threadId, int $userId): array
    {
        if ($userId <= 0 || $communityId <= 0 || $threadId <= 0) {
            return ['success' => false, 'error' => 'Invalid data'];
        }
        if (!$this->communities->isMember($communityId, $userId)) {
            return ['success' => false, 'error' => 'You must join the community first'];
        }
        if (!$this->communities->isUserPremium($userId)) {
            return ['success' => false, 'error' => 'Premium subscription required'];
        }

        $this->communities->deleteThread($communityId, $threadId);
        return ['success' => true];
    }

    public function findThreadMessages(int $communityId, int $threadId, int $userId): array
    {
        if ($communityId <= 0 || $threadId <= 0 || $userId <= 0) {
            return ['success' => false, 'error' => 'Invalid request'];
        }
        if (!$this->communities->isMember($communityId, $userId)) {
            return ['success' => false, 'error' => 'Only community members can access thread messages'];
        }

        $messages = array_map(static function (array $row) use ($userId): array {
            $row['isMine'] = (int) ($row['userId'] ?? 0) === $userId;
            return $row;
        }, $this->communities->findThreadMessages($communityId, $threadId));

        return ['success' => true, 'messages' => $messages];
    }

    public function sendThreadMessage(int $communityId, int $threadId, int $userId, string $message): array
    {
        $message = trim($message);
        if ($communityId <= 0 || $threadId <= 0 || $userId <= 0 || $message === '') {
            return ['success' => false, 'error' => 'Invalid data'];
        }
        if (!$this->communities->isMember($communityId, $userId)) {
            return ['success' => false, 'error' => 'Only community members can post in threads'];
        }
        if (!$this->communities->threadExists($communityId, $threadId)) {
            return ['success' => false, 'error' => 'Thread not found'];
        }

        $id = $this->communities->createThreadMessage($communityId, $threadId, $userId, $message);
        if ($id === false) {
            return ['success' => false, 'error' => 'Unable to send thread message'];
        }

        return [
            'success' => true,
            'message' => [
                'id' => $id,
                'threadId' => $threadId,
                'userId' => $userId,
                'userName' => $this->communities->findUserName($userId),
                'message' => $message,
                'createdAt' => date('Y-m-d H:i:s'),
                'isMine' => true,
            ],
        ];
    }
}
