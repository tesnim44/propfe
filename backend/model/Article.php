<?php
class Article {

    public $id;
    public $authorId;
    public $title;
    public $body;
    public $category;
    public $tags;
    public $status;
    public $likesCount;
    public $coverImage;
    public $readingTime;
    public $createdAt;

    public function __construct($authorId,$title,$body,$category,$tags,$status,$coverImage,$readingTime){
        $this->authorId = $authorId;
        $this->title = $title;
        $this->body = $body;
        $this->category = $category;
        $this->tags = $tags;
        $this->status = $status;
        $this->coverImage = $coverImage;
        $this->readingTime = $readingTime;
    }
}
?>