<?php 
class Message {

    public $id;
    public $senderId;
    public $receiverId;
    public $body;
    public $isRead;
    public $readAt;
    public $deletedBy;
    public $createdAt;

    public function __construct($senderId,$receiverId,$body){
        $this->senderId = $senderId;
        $this->receiverId = $receiverId;
        $this->body = $body;
    }
}
?>