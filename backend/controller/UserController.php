<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../model/users.php';

function createUser(PDO $cnx, array $data): bool
{
    $sql = 'INSERT INTO users (name, email, password, plan, isPremium, isAdmin, avatarUrl, createdAt)
            VALUES (:name, :email, :password, :plan, :isPremium, :isAdmin, :avatarUrl, NOW())';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':name' => $data['name'] ?? '',
        ':email' => $data['email'] ?? '',
        ':password' => password_hash((string) ($data['password'] ?? ''), PASSWORD_DEFAULT),
        ':plan' => $data['plan'] ?? 'free',
        ':isPremium' => (int) ($data['isPremium'] ?? 0),
        ':isAdmin' => (int) ($data['isAdmin'] ?? 0),
       
    ]);
}

function addUser(PDO $cnx, array $data): bool
{
    return createUser($cnx, $data);
}

function getAllUsers(PDO $cnx): array
{
    $rows = $cnx->query('SELECT * FROM users ORDER BY id DESC')->fetchAll();
    return array_map('hydrateUser', $rows);
}

function getUserById(PDO $cnx, int $id): ?Users
{
    $stmt = $cnx->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? hydrateUser($row) : null;
}

function updateUser(PDO $cnx, int $id, array $data): bool
{
    $current = getUserById($cnx, $id);
    if (!$current) {
        return false;
    }

    $password = $current->password;
    if (!empty($data['password'])) {
        $password = password_hash((string) $data['password'], PASSWORD_DEFAULT);
    }

    $sql = 'UPDATE users
            SET name = :name,
                email = :email,
                password = :password,
                plan = :plan,
                isPremium = :isPremium,
                isAdmin = :isAdmin,
                
            WHERE id = :id';

    $stmt = $cnx->prepare($sql);

    return $stmt->execute([
        ':id' => $id,
        ':name' => $data['name'] ?? $current->name,
        ':email' => $data['email'] ?? $current->email,
        ':password' => $password,
        ':plan' => $data['plan'] ?? $current->plan,
        ':isPremium' => (int) ($data['isPremium'] ?? $current->isPremium),
        ':isAdmin' => (int) ($data['isAdmin'] ?? $current->isAdmin),
       
    ]);
}

function deleteUser(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare('DELETE FROM users WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function getUserByEmail(PDO $cnx, string $email): ?Users
{
    $stmt = $cnx->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch();

    return $row ? hydrateUser($row) : null;
}

function hydrateUser(array $row): Users
{
    $user = new Users(
        $row['name'] ?? '',
        $row['email'] ?? '',
        $row['password'] ?? '',
        $row['plan'] ?? 'free',
        (int) ($row['isPremium'] ?? 0),
        (int) ($row['isAdmin'] ?? 0), ''
    );

    $user->id = (int) ($row['id'] ?? 0);
    $user->createdAt = $row['createdAt'] ?? null;

    return $user;
}
