<?php
declare(strict_types=1);

session_start();

$backendPath = realpath(__DIR__ . '/../../..');
if ($backendPath === false) {
    http_response_code(500);
    exit('Backend path could not be resolved.');
}

require_once $backendPath . '/config/database.php';
require_once $backendPath . '/model/users.php';
require_once $backendPath . '/controller/UserController.php';

$adminEmail = 'admin@iblog.com';
$adminPassword = 'Admin2026!';
$adminName = 'IBlog Admin';

if (!($cnx instanceof PDO)) {
    http_response_code(500);
    exit('Database unavailable: ' . (databaseConnectionError() ?? 'Unknown connection error.'));
}

try {
    $user = getUserByEmail($cnx, $adminEmail);

    if ($user === false) {
        $created = AddUser($cnx, [
            'name' => $adminName,
            'email' => $adminEmail,
            'password' => $adminPassword,
            'plan' => 'premium',
            'isPremium' => 1,
            'isAdmin' => 1,
        ]);

        if (!$created) {
            throw new RuntimeException('Could not create the admin account.');
        }

        $status = 'created';
    } else {
        $updated = updateUser($cnx, (int) $user['id'], [
            'name' => $user['name'] ?: $adminName,
            'email' => $adminEmail,
            'password' => $adminPassword,
            'plan' => 'premium',
            'isPremium' => 1,
            'isAdmin' => 1,
        ]);

        if (!$updated) {
            throw new RuntimeException('Could not update the admin account.');
        }

        $status = 'updated';
    }

    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Admin Account Ready</title></head><body style="font-family:Arial,sans-serif;padding:32px;background:#111;color:#f5f0d8;">';
    echo '<h1 style="margin-bottom:12px;">Admin account ' . htmlspecialchars($status, ENT_QUOTES, 'UTF-8') . '</h1>';
    echo '<p style="margin-bottom:8px;">Email: <strong>' . htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8') . '</strong></p>';
    echo '<p style="margin-bottom:8px;">Password: <strong>' . htmlspecialchars($adminPassword, ENT_QUOTES, 'UTF-8') . '</strong></p>';
    echo '<p><a href="admin-login.php" style="color:#ddb136;">Go to admin login</a></p>';
    echo '</body></html>';
} catch (Throwable $e) {
    http_response_code(500);
    exit('Admin generator failed: ' . $e->getMessage());
}
