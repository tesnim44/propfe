<?php
class Comment {

    public $id;
    public $articleId;
    public $userId;
    public $body;
    public $likesCount;
    public $isFlagged;
    public $parentId;
    public $createdAt;

    public function __construct($articleId,$userId,$body,$parentId){
        $this->articleId = $articleId;
        $this->userId = $userId;
        $this->body = $body;
        $this->parentId = $parentId;
    }
}
?>