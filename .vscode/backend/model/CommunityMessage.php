<?php
declare(strict_types=1);

class CommunityMessage
{
    public ?int $id = null;
    public int $communityId;
    public int $userId;
    public string $message;
    public int $isDeleted;
    public ?string $createdAt;
    public ?string $userName = null;

    public function __construct(
        int $communityId,
        int $userId,
        string $message,
        int $isDeleted = 0,
        ?string $createdAt = null
    ) {
        $this->communityId = $communityId;
        $this->userId = $userId;
        $this->message = $message;
        $this->isDeleted = $isDeleted;
        $this->createdAt = $createdAt ?? date('Y-m-d H:i:s');
    }
}
