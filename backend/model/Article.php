<?php

class Article {

    public $id;
    public $authorId;
    public $title;
    public $body;
    public $category;
    public $tags;
    public $status;     // draft, published, archived, deleted
    public $coverImage;
    public $readingTime;
    public $likesCount;
    public $views;
    public $label;
    public $createdAt;
    public $author_name;

    public function __construct($authorId, $title, $body, $category, $tags, $status, $coverImage, $readingTime, $label){
        $this->authorId = $authorId;
        $this->title = $title;
        $this->body = $body;
        $this->category = $category;
        $this->tags = $tags;
        $this->status = $status;
        $this->coverImage = $coverImage;
        $this->readingTime = $readingTime;
        $this->label = $label;
        $this->likesCount = 0;
        $this->views = 0;
    }

}
?>