<?php
class CommunityMember {

    public $id;
    public $communityId;
    public $userId;
    public $role;
    public $joinedAt;
    public $isBanned;
    public $notificationsOn;

    public function __construct($communityId,$userId,$role,$isBanned,$notificationsOn){
        $this->communityId = $communityId;
        $this->userId = $userId;
        $this->role = $role;
        $this->isBanned = $isBanned;
        $this->notificationsOn = $notificationsOn;
    }
}
?>