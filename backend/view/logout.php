<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

session_unset();
session_destroy();

// Redirect to sign-in page — adjust path depth to match your project root
header('Location: backend/view/components/auth/auth.php?mode=signin');
exit();