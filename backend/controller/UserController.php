<?php
declare(strict_types=1);

if (!class_exists('Users')) {
    require_once __DIR__ . '/../model/users.php';
}

function createUser(PDO $cnx, array $data): bool
{
    $stmt = $cnx->prepare(
        'INSERT INTO users (name, email, password, plan, isPremium, isAdmin, createdAt)
         VALUES (:name, :email, :password, :plan, :isPremium, :isAdmin, NOW())'
    );
    return $stmt->execute([
        ':name'      => $data['name']      ?? '',
        ':email'     => $data['email']     ?? '',
        ':password'  => password_hash((string)($data['password'] ?? ''), PASSWORD_DEFAULT),
        ':plan'      => $data['plan']      ?? 'free',
        ':isPremium' => (int)($data['isPremium'] ?? 0),
        ':isAdmin'   => (int)($data['isAdmin']   ?? 0),
    ]);
}

function getAllUsers(PDO $cnx): array
{
    $rows = $cnx->query('SELECT * FROM users ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
    return array_map('hydrateUser', $rows);
}

function getUserById(PDO $cnx, int $id): ?Users
{
    $stmt = $cnx->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? hydrateUser($row) : null;
}

function getUserByEmail(PDO $cnx, string $email): ?Users
{
    $stmt = $cnx->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? hydrateUser($row) : null;
}

function updateUser(PDO $cnx, int $id, array $data): bool
{
    $current = getUserById($cnx, $id);
    if (!$current) return false;
    $password = $current->password;
    if (!empty($data['password'])) {
        $password = password_hash((string)$data['password'], PASSWORD_DEFAULT);
    }
    return $cnx->prepare(
        'UPDATE users SET name=:name, email=:email, password=:password,
         plan=:plan, isPremium=:isPremium, isAdmin=:isAdmin WHERE id=:id'
    )->execute([
        ':id'        => $id,
        ':name'      => $data['name']      ?? $current->name,
        ':email'     => $data['email']     ?? $current->email,
        ':password'  => $password,
        ':plan'      => $data['plan']      ?? $current->plan,
        ':isPremium' => (int)($data['isPremium'] ?? $current->isPremium),
        ':isAdmin'   => (int)($data['isAdmin']   ?? $current->isAdmin),
    ]);
}

function deleteUser(PDO $cnx, int $id): bool
{
    return $cnx->prepare('DELETE FROM users WHERE id = :id')->execute([':id' => $id]);
}

// ── FIXED: removed 7th arg (avatarUrl), now matches Users constructor exactly ──
function hydrateUser(array $row): Users
{
    $user            = new Users(
        $row['name']      ?? '',
        $row['email']     ?? '',
        $row['password']  ?? '',
        $row['plan']      ?? 'free',
        (int)($row['isPremium'] ?? 0),
        (int)($row['isAdmin']   ?? 0)
    );
    $user->id        = (int)($row['id'] ?? 0);
    $user->createdAt = $row['createdAt'] ?? null;
    $user->status    = $row['status']    ?? 'active';
    return $user;
}