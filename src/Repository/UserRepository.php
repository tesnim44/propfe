<?php
declare(strict_types=1);

namespace IBlog\Repository;

use PDO;
use PDOException;

final class UserRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function create(array $data): bool
    {
        $hash = password_hash((string) ($data['password'] ?? ''), PASSWORD_DEFAULT);
        $stmt = $this->connection->prepare(
            'INSERT INTO users (name, email, password, plan, isPremium, isAdmin)
             VALUES (:name, :email, :password, :plan, :isPremium, :isAdmin)'
        );

        return $stmt->execute([
            ':name' => (string) ($data['name'] ?? ''),
            ':email' => (string) ($data['email'] ?? ''),
            ':password' => $hash,
            ':plan' => (string) ($data['plan'] ?? 'free'),
            ':isPremium' => (int) ($data['isPremium'] ?? 0),
            ':isAdmin' => (int) ($data['isAdmin'] ?? 0),
        ]);
    }

    public function findAll(): array
    {
        $stmt = $this->connection->query(
            "SELECT id, name, email, password, plan,
                    COALESCE(isPremium, 0) AS isPremium,
                    COALESCE(isAdmin, 0) AS isAdmin,
                    COALESCE(status, 'active') AS status,
                    createdAt
             FROM users
             ORDER BY id DESC"
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function search(string $search): array
    {
        $stmt = $this->connection->prepare(
            "SELECT id, name, email, password, plan,
                    COALESCE(isPremium, 0) AS isPremium,
                    COALESCE(isAdmin, 0) AS isAdmin,
                    COALESCE(status, 'active') AS status,
                    createdAt
             FROM users
             WHERE name LIKE :search OR email LIKE :search
             ORDER BY id DESC"
        );
        $stmt->execute([':search' => '%' . $search . '%']);

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function authenticate(string $email, string $password): array|false
    {
        $user = $this->findByEmail($email);
        if ($user === false) {
            return false;
        }

        return password_verify($password, (string) $user['password']) ? $user : false;
    }

    public function findByEmail(string $email): array|false
    {
        $stmt = $this->connection->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: false;
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->connection->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: false;
    }

    public function update(int $id, array $data): bool
    {
        $current = $this->findById($id);
        if ($current === false) {
            return false;
        }

        $password = trim((string) ($data['password'] ?? ''));
        $hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : (string) ($current['password'] ?? '');

        $stmt = $this->connection->prepare(
            'UPDATE users
             SET name = :name,
                 email = :email,
                 password = :password,
                 plan = :plan,
                 isPremium = :isPremium,
                 isAdmin = :isAdmin
             WHERE id = :id'
        );

        return $stmt->execute([
            ':id' => $id,
            ':name' => (string) ($data['name'] ?? $current['name'] ?? ''),
            ':email' => (string) ($data['email'] ?? $current['email'] ?? ''),
            ':password' => $hash,
            ':plan' => (string) ($data['plan'] ?? $current['plan'] ?? 'free'),
            ':isPremium' => (int) ($data['isPremium'] ?? $current['isPremium'] ?? 0),
            ':isAdmin' => (int) ($data['isAdmin'] ?? $current['isAdmin'] ?? 0),
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->connection->prepare('DELETE FROM users WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function upgradeToPremium(int $userId, string $method = 'card', float $amount = 9.0): bool
    {
        $stmt = $this->connection->prepare(
            "UPDATE users SET isPremium = 1, plan = 'premium' WHERE id = :id"
        );
        $stmt->execute([':id' => $userId]);

        try {
            $expiresAtExpr = \dbDriver($this->connection) === 'sqlite'
                ? "DATETIME(CURRENT_TIMESTAMP, '+1 month')"
                : 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)';
            $subscription = $this->connection->prepare(
                "INSERT INTO subscription
                    (userId, plan, amount, currency, status, method, startedAt, expiresAt)
                 VALUES
                    (:userId, 'premium', :amount, 'TND', 'active', :method, CURRENT_TIMESTAMP, {$expiresAtExpr})"
            );
            $subscription->execute([
                ':userId' => $userId,
                ':amount' => $amount,
                ':method' => $method,
            ]);
        } catch (PDOException) {
        }

        return true;
    }
}
