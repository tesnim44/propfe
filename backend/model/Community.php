<?php
declare(strict_types=1);

class Community
{
    public ?int $id = null;
    public int $creatorId;
    public string $name;
    public string $description;
    public string $icon;
    public ?string $topics;
    public int $memberCount;
    public ?string $createdAt;

    public function __construct(
        int $creatorId,
        string $name,
        string $description,
        string $icon = '',
        ?string $topics = null,
        int $memberCount = 1,
        ?string $createdAt = null
    ) {
        $this->creatorId = $creatorId;
        $this->name = $name;
        $this->description = $description;
        $this->icon = $icon;
        $this->topics = $topics;
        $this->memberCount = $memberCount;
        $this->createdAt = $createdAt ?? date('Y-m-d H:i:s');
    }
}
