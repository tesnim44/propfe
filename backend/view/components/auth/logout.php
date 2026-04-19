<?php
declare(strict_types=1);
session_start();
session_destroy();
setcookie('iblog_user', '', time() - 3600, '/');

// If called via fetch() from JS → return JSON
// If called directly in browser → redirect
if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')) {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
} else {
    header('Location: auth.php?mode=signin');
}
exit();