<?php

class Users {
    public $id;
    public $name;
    public $email;
    public $password;
    public $plan;
    public $isPremium;
    public $isAdmin;
    public $createdAt;
    public $status;

    public function __construct(
        string  $name,
        string  $email,
        string  $password,
        string  $plan,
        int     $isPremium = 0,
        int     $isAdmin   = 0,
        ?int    $id        = null,
        ?string $createdAt = null
    ) {
        $this->name      = $name;
        $this->email     = $email;
        $this->password  = $password;
        $this->plan      = $plan;       // ✅ use the parameter, not 'free'
        $this->isPremium = $isPremium;
        $this->isAdmin   = $isAdmin;
        $this->id        = $id;         // ✅ assign it
        $this->createdAt = $createdAt;  // ✅ assign it
        $this->status    = 'active';
    }
}