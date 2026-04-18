<?php 
class message {

    public $id;
    public $senderId;
    public $receiverId;
    public $body;
    public $isRead;
    public $deletedBy;
    public $createdAt;

    public function __construct($senderId,$receiverId,$body){
        $this->senderId = $senderId;
        $this->receiverId = $receiverId;
        $this->body = $body;
    }
}
?>