<?php
declare(strict_types=1);
session_start();
session_destroy();

// Clear cookie — no 'time() - 3600' needed if it was already session-only
setcookie('iblog_user', '', [
    'expires'  => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')) {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
} else {
    header('Location: auth.php?mode=signin');
}
exit();