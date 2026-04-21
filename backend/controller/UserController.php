<?php
declare(strict_types=1);

require_once __DIR__ . '/../model/users.php';

/*
 * Controller : UserController
 * Toutes les fonctions retournent :
 *   - array|false  pour une ligne unique
 *   - array        pour une liste (jamais false)
 *   - bool         pour les opérations d'écriture
 *
 * Les lignes sont des tableaux associatifs PDO::FETCH_ASSOC.
 */

// ─── CREATE ────────────────────────────────────────────────────────────────────

function AddUser(PDO $cnx, array $data): bool
{
    $hash = password_hash($data['password'], PASSWORD_DEFAULT);

    $stmt = $cnx->prepare(
        "INSERT INTO users (name, email, password, plan, isPremium, isAdmin)
         VALUES (:name, :email, :password, :plan, :isPremium, :isAdmin)"
    );

    return $stmt->execute([
        ':name'      => $data['name'],
        ':email'     => $data['email'],
        ':password'  => $hash,
        ':plan'      => $data['plan']      ?? 'free',
        ':isPremium' => $data['isPremium'] ?? 0,
        ':isAdmin'   => $data['isAdmin']   ?? 0,
    ]);
}

// ─── READ ──────────────────────────────────────────────────────────────────────

/**
 * Retourne tous les utilisateurs sous forme de tableau de tableaux associatifs.
 *
 * @return array<int, array<string, mixed>>
 */
function getAllUsers(PDO $cnx): array
{
    $stmt = $cnx->query(
        "SELECT id, name, email, password, plan,
                COALESCE(isPremium, 0) AS isPremium,
                COALESCE(isAdmin,   0) AS isAdmin,
                COALESCE(status, 'active') AS status,
                createdAt
         FROM users
         ORDER BY id DESC"
    );

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * Recherche par nom ou email.
 *
 * @return array<int, array<string, mixed>>
 */
function searchUsers(PDO $cnx, string $search): array
{
    $stmt = $cnx->prepare(
        "SELECT id, name, email, password, plan,
                COALESCE(isPremium, 0) AS isPremium,
                COALESCE(isAdmin,   0) AS isAdmin,
                COALESCE(status, 'active') AS status,
                createdAt
         FROM users
         WHERE name LIKE :search OR email LIKE :search
         ORDER BY id DESC"
    );
    $stmt->execute([':search' => '%' . $search . '%']);

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * Authentification. Retourne la ligne utilisateur ou false.
 *
 * @return array<string, mixed>|false
 */
function ConnectUser(PDO $cnx, array $data): array|false
{
    $stmt = $cnx->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute([':email' => $data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data['password'], $user['password'])) {
        return $user;
    }

    return false;
}

/**
 * Retourne un utilisateur par e-mail ou false si introuvable.
 *
 * @return array<string, mixed>|false
 */
function getUserByEmail(PDO $cnx, string $email): array|false
{
    $stmt = $cnx->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);

    return $stmt->fetch(PDO::FETCH_ASSOC) ?: false;
}

/**
 * Retourne un utilisateur par ID ou false si introuvable.
 *
 * @return array<string, mixed>|false
 */
function getUserById(PDO $cnx, int $id): array|false
{
    $stmt = $cnx->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);

    return $stmt->fetch(PDO::FETCH_ASSOC) ?: false;
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

function updateUser(PDO $cnx, int $id, array $data): bool
{
    $current  = getUserById($cnx, $id);
    $password = (!empty($data['password']))
        ? password_hash($data['password'], PASSWORD_DEFAULT)
        : ($current['password'] ?? '');

    $stmt = $cnx->prepare(
        "UPDATE users
         SET name      = :name,
             email     = :email,
             password  = :password,
             plan      = :plan,
             isPremium = :isPremium,
             isAdmin   = :isAdmin
         WHERE id = :id"
    );

    return $stmt->execute([
        ':name'      => $data['name'],
        ':email'     => $data['email'],
        ':password'  => $password,
        ':plan'      => $data['plan'],
        ':isPremium' => (int) $data['isPremium'],
        ':isAdmin'   => (int) $data['isAdmin'],
        ':id'        => $id,
    ]);
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

function deleteUser(PDO $cnx, int $id): bool
{
    $stmt = $cnx->prepare("DELETE FROM users WHERE id = :id");
    return $stmt->execute([':id' => $id]);
}

// ─── PREMIUM ───────────────────────────────────────────────────────────────────

/**
 * Passe un utilisateur en premium et enregistre la souscription.
 */
function upgradeToPremium(
    PDO    $cnx,
    int    $userId,
    string $method = 'card',
    float  $amount = 9.00
): bool {
    $stmt = $cnx->prepare(
        "UPDATE users SET isPremium = 1, plan = 'premium' WHERE id = :id"
    );
    if (!$stmt->execute([':id' => $userId])) {
        return false;
    }

    // Enregistrement de la souscription (table optionnelle)
    try {
        $sub = $cnx->prepare(
            "INSERT INTO subscription
                 (userId, plan, amount, currency, status, method, startedAt, expiresAt)
             VALUES
                 (:uid, 'premium', :amount, 'USD', 'active', :method,
                  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))"
        );
        $sub->execute([
            ':uid'    => $userId,
            ':amount' => $amount,
            ':method' => $method,
        ]);
    } catch (PDOException) {
        // Table subscription absente — non bloquant
    }

    return true;
}