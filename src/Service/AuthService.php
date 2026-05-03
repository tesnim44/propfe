<?php
declare(strict_types=1);

namespace IBlog\Service;

use IBlog\Repository\UserRepository;
use IBlog\Utils\Validator;

final class AuthService
{
    public function __construct(private readonly UserRepository $users)
    {
    }

    public function login(string $email, string $password): array|false
    {
        if (!Validator::validateEmail($email) || $password === '') {
            return false;
        }

        return $this->users->authenticate($email, $password);
    }

    public function register(array $data): array|false
    {
        if (!Validator::validateName((string) ($data['name'] ?? ''))) {
            return false;
        }
        if (!Validator::validateEmail((string) ($data['email'] ?? ''))) {
            return false;
        }
        if (!Validator::validatePassword((string) ($data['password'] ?? ''))) {
            return false;
        }
        if ($this->users->findByEmail((string) $data['email']) !== false) {
            return false;
        }
        if (!$this->users->create($data)) {
            return false;
        }

        return $this->users->findByEmail((string) $data['email']);
    }

    public function upgradeToPremium(int $userId, string $method = 'card', float $amount = 9.0): bool
    {
        return $this->users->upgradeToPremium($userId, $method, $amount);
    }
}
