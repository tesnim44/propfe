<?php
class Community {

    public $id;
    public $creatorId;
    public $name;
    public $description;
    public $icon;
    public $memberCount;
    public $isPrivate;
    public $topics;
    public $createdAt;

    public function __construct($creatorId,$name,$description,$icon,$isPrivate,$topics){
        $this->creatorId = $creatorId;
        $this->name = $name;
        $this->description = $description;
        $this->icon = $icon;
        $this->isPrivate = $isPrivate;
        $this->topics = $topics;
    }
}
?>