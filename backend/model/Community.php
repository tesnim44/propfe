<?php
class community {

    public $id;
    public $creatorId;
    public $name;
    public $description;
    public $memberCount;
    public $isPrivate;
    public $category;
    public $createdAt;

    public function __construct($creatorId,$name,$description,$icon,$isPrivate,$topics){
        $this->creatorId = $creatorId;
        $this->name = $name;
        $this->description = $description;
        $this->isPrivate = $isPrivate;
        $this->category = $category;
    }
}
?>