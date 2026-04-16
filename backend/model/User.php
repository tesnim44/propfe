<?php
class User {

    public $id;
    public $name;
    public $email;
    public $password;
    public $isPremium;
    public $isAdmin;
    public $avatarUrl;
    public $createdAt;

    public function __construct($name,$email,$password,$plan,$isPremium,$isAdmin,$avatarUrl){
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->isPremium = $isPremium;
        $this->isAdmin = $isAdmin;
        $this->avatarUrl = $avatarUrl;
    }
}