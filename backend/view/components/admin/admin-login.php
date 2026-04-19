<?php
/**
 * admin-login.php
 * Location: iblog/backend/view/components/admin/admin-login.php
 *
 * Path map:
 *   __DIR__      = .../iblog/backend/view/components/admin
 *   /../../..    = .../iblog/backend   ← BACKEND_PATH
 */
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0'); // Don't show errors to browser — handle them below

session_start();

// Already logged in as admin → skip login
if (isset($_SESSION['isAdmin']) && (int)$_SESSION['isAdmin'] === 1) {
    header('Location: admin.php');
    exit();
}

// ── Resolve backend path ────────────────────────────────────────────────────
$backendPath = realpath(__DIR__ . '/../../..');
// Fallback: try finding it by traversing up until we find config/
if ($backendPath === false || !file_exists($backendPath . '/config/database.php')) {
    // Try one more level up in case of symlinks
    $backendPath = realpath(__DIR__ . '/../../../..');
    if ($backendPath === false || !file_exists($backendPath . '/config/database.php')) {
        die("❌ Cannot find backend/config/database.php from: " . __DIR__);
    }
}

require_once $backendPath . '/config/database.php';
require_once $backendPath . '/model/users.php';
require_once $backendPath . '/controller/UserController.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim((string)($_POST['email']    ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } elseif (strlen($password) < 4) {
        $error = 'Please enter your password.';
    } else {
        try {
            $user = getUserByEmail($cnx, $email);

            if ($user !== null && (int)$user->isAdmin === 1 && password_verify($password, $user->password)) {
                session_regenerate_id(true);
                $_SESSION['user_id']   = $user->id;
                $_SESSION['name']      = $user->name;
                $_SESSION['email']     = $user->email;
                $_SESSION['plan']      = $user->plan;
                $_SESSION['isPremium'] = (int)$user->isPremium;
                $_SESSION['isAdmin']   = 1;
                header('Location: admin.php');
                exit();
            } else {
                // More specific error for debugging
                if ($user === null) {
                    $error = 'No account found. Run generate-admin-hash.php first.';
                } elseif ((int)$user->isAdmin !== 1) {
                    $error = 'This account is not an administrator.';
                } else {
                    $error = 'Incorrect password.';
                }
            }
        } catch (Throwable $e) {
            $error = 'Database error: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog — Admin Login</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: 'DM Sans', sans-serif;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
    }
    .card {
      background: #fff; border-radius: 22px;
      box-shadow: 0 28px 72px rgba(0,0,0,.45);
      width: 100%; max-width: 400px; padding: 44px 36px;
    }
    .shield { font-size: 46px; text-align: center; margin-bottom: 12px; }
    h1 {
      font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700;
      text-align: center; margin-bottom: 4px; color: #1a1a2e;
    }
    .subtitle { text-align: center; color: #888; font-size: 14px; margin-bottom: 28px; }
    .alert {
      background: #fff0f0; border: 1px solid #ffb3b3; color: #c0392b;
      border-radius: 10px; padding: 12px 16px; font-size: 14px;
      margin-bottom: 18px; text-align: center; line-height: 1.5;
    }
    .field { margin-bottom: 14px; }
    .field input {
      width: 100%; padding: 13px 15px; border: 1.5px solid #e8e8f0;
      border-radius: 12px; font-size: 14px; font-family: inherit;
      outline: none; background: #f7f8fa; color: #1a1a2e; transition: border-color .2s;
    }
    .field input:focus { border-color: #7c5cbf; background: #fff; }
    .field input::placeholder { color: #bbb; }
    .btn-admin {
      width: 100%; padding: 14px; background: #1a1a2e; color: #fff;
      border: none; border-radius: 12px; font-size: 15px; font-weight: 600;
      font-family: inherit; cursor: pointer; transition: background .2s; margin-top: 6px;
    }
    .btn-admin:hover { background: #302b63; }
    .back { display: block; text-align: center; margin-top: 18px; font-size: 13px; color: #aaa; text-decoration: none; }
    .back:hover { color: #7c5cbf; }
    .hint {
      margin-top: 20px; padding: 13px 15px; background: #f7f8fa;
      border-radius: 10px; font-size: 12px; color: #888; text-align: center;
      border: 1px dashed #ddd; line-height: 1.8;
    }
    .hint strong { color: #302b63; }
  </style>
</head>
<body>
<div class="card">
  <div class="shield">🛡️</div>
  <h1>Admin Panel</h1>
  <p class="subtitle">Restricted access — administrators only</p>

  <?php if ($error !== ''): ?>
    <div class="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
  <?php endif; ?>

  <form method="POST" novalidate>
    <div class="field">
      <input type="email" name="email" placeholder="Admin email"
             value="<?= htmlspecialchars((string)($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"
             autocomplete="username" required autofocus>
    </div>
    <div class="field">
      <input type="password" name="password" placeholder="Password"
             autocomplete="current-password" required>
    </div>
    <button type="submit" class="btn-admin">🔐 Sign In as Admin</button>
  </form>

  <!-- 4 levels up: admin → components → view → backend → iblog root -->
  <a href="../../../../index.php" class="back">← Back to IBlog</a>

  <div class="hint">
    <strong>admin@iblog.com</strong> / <strong>admin2026</strong><br>
    <em style="font-size:11px;">Run <strong>generate-admin-hash.php</strong> once to create this account</em>
  </div>
</div>
</body>
</html>