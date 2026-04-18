<?php

declare(strict_types=1);

class Users {

    public $id;
    public $name;
    public $email;
    public $password;
    public $plan;
    public $isPremium;
    public $isAdmin;
    public $avatarUrl;
    public $createdAt;

    public function __construct($name,$email,$password,$plan,$isPremium,$isAdmin,$avatarUrl){
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->plan = $plan;
        $this->isPremium = $isPremium;
        $this->isAdmin = $isAdmin;
        $this->avatarUrl = $avatarUrl;
    }
}

