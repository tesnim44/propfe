<?php
class savedarticle {

    public $id;
    public $userId;
    public $articleId;
    public $savedAt;
    public $note;
    public $collection;
    public $isPinned;

    public function __construct($userId,$articleId,$note,$collection,$isPinned){
        $this->userId = $userId;
        $this->articleId = $articleId;
        $this->note = $note;
        $this->collection = $collection;
        $this->isPinned = $isPinned;
    }
}
?>