<?php
declare(strict_types=1);

namespace IBlog\Database;

final class FakeDatabase
{
    private array $users = [
        [
            'id' => 1,
            'username' => 'admin',
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => '1234',
            'role' => 'ADMIN',
            'plan' => 'premium',
        ],
        [
            'id' => 2,
            'username' => 'user1',
            'name' => 'User One',
            'email' => 'user1@test.com',
            'password' => '1234',
            'role' => 'USER',
            'plan' => 'free',
        ],
    ];

    private array $articles = [
        [
            'id' => 1,
            'userId' => 1,
            'title' => 'Getting started with IBlog',
            'category' => 'Guides',
            'status' => 'published',
        ],
        [
            'id' => 2,
            'userId' => 2,
            'title' => 'My first community post',
            'category' => 'Community',
            'status' => 'draft',
        ],
    ];

    // =========================
    // USERS
    // =========================

    public function getAllUsers(): array
    {
        return $this->users;
    }

    public function findUserByUsername(string $username): ?array
    {
        foreach ($this->users as $user) {
            if (($user['username'] ?? '') === $username) {
                return $user;
            }
        }

        return null;
    }

    public function findUserByEmail(string $email): ?array
    {
        foreach ($this->users as $user) {
            if (($user['email'] ?? '') === $email) {
                return $user;
            }
        }

        return null;
    }

    public function createUser(array $data): array
    {
        $data['id'] = count($this->users) + 1;
        $this->users[] = $data;

        return $data;
    }

    // =========================
    // ARTICLES
    // =========================

    public function getAllArticles(): array
    {
        return $this->articles;
    }

    public function findArticleById(int $id): ?array
    {
        foreach ($this->articles as $article) {
            if ((int) ($article['id'] ?? 0) === $id) {
                return $article;
            }
        }

        return null;
    }

    public function createArticle(array $data): array
    {
        $data['id'] = count($this->articles) + 1;
        $this->articles[] = $data;

        return $data;
    }

}
