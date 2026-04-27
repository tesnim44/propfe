<?php
declare(strict_types=1);

class CommunityMember
{
    public ?int $id = null;
    public int $communityId;
    public int $userId;
    public string $role;
    public int $isBanned;
    public int $notificationsOn;
    public ?string $joinedAt;

    public function __construct(
        int $communityId,
        int $userId,
        string $role = 'member',
        int $isBanned = 0,
        int $notificationsOn = 1,
        ?string $joinedAt = null
    ) {
        $this->communityId = $communityId;
        $this->userId = $userId;
        $this->role = $role;
        $this->isBanned = $isBanned;
        $this->notificationsOn = $notificationsOn;
        $this->joinedAt = $joinedAt ?? date('Y-m-d H:i:s');
    }
}
