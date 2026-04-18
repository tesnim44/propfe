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
    public $createdAt;
    public $status;

    public function __construct(
        string $name,
        string $email,
        string $password,
        string $plan,
        int    $isPremium,
        int    $isAdmin
        // avatarUrl REMOVED — not a DB column, was causing fatal arg-count mismatch
    ) {
        $this->name      = $name;
        $this->email     = $email;
        $this->password  = $password;
        $this->plan      = $plan;
        $this->isPremium = $isPremium;
        $this->isAdmin   = $isAdmin;
        $this->status    = 'active';
    }
}