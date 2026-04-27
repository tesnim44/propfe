<?php

class Article
{
    public $id;
    public $authorId;
    public $author_name;
    public $author_avatar;
    public $title;
    public $body;
    public $category;
    public $tags;
    public $status;          // draft, published, archived, deleted
    public $coverImage;
    public $readingTime;
    public $likesCount;
    public $views;
    public $label;
    public $createdAt;

    public function __construct(
        $authorId,
        $title,
        $body,
        $category,
        $tags,
        $status,
        $coverImage,
        $readingTime,
        $views = 0,
        $label = ''
    ) {
        $this->authorId    = $authorId;
        $this->title       = $title;
        $this->body        = $body;
        $this->category    = $category;
        $this->tags        = $tags;
        $this->status      = $status;
        $this->coverImage  = $coverImage;
        $this->readingTime = $readingTime;
        $this->views       = $views;
        $this->label       = $label;
        $this->likesCount  = 0;
        $this->createdAt   = date('Y-m-d H:i:s'); // or use new DateTime()
    }
}
