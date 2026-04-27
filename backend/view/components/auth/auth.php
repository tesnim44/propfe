<?php
declare(strict_types=1);

include __DIR__ . "/../config/database.php";
include __DIR__ . "/../controller/UserController.php";

session_start();

// Get mode from URL
$mode = $_GET['mode'] ?? 'signin';
$errors = [];
$success = '';

// Redirect if already logged in
if (isset($_SESSION['email']) && $mode !== 'logout') {
    header("Location: dashboard.php");
    exit();
}

// ── Handle POST Requests ─────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // ════ SIGNIN ════
    if ($mode === 'signin' && isset($_POST['email'], $_POST['password'])) {
        
        $user = ConnectUser($cnx, $_POST);
        
        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['plan'] = $user['plan'];
            $_SESSION['isPremium'] = $user['isPremium'];
            $_SESSION['isAdmin'] = $user['isAdmin'];
            
            // Redirect admin to admin panel
            if ($user['isAdmin'] == 1) {
                header("Location: components/admin/admin.php");
            } else {
                header("Location: dashboard.php");
            }
            exit();
        } else {
            $errors[] = "Email ou mot de passe incorrect";
        }
    }
    
    // ════ SIGNUP ════
    if ($mode === 'signup' && isset($_POST['name'], $_POST['email'], $_POST['password'])) {
        
        // Validation
        if (strlen($_POST['name']) < 2) {
            $errors[] = "Name must be at least 2 characters";
        }
        if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Please enter a valid email address";
        }
        if (strlen($_POST['password']) < 6) {
            $errors[] = "Password must be at least 6 characters";
        }
        if ($_POST['password'] !== ($_POST['confirm_password'] ?? '')) {
            $errors[] = "Passwords do not match";
        }
        if ($_POST['email'] === 'admin@iblog.com') {
            $errors[] = "This email address is reserved";
        }
        
        // Check if email exists
        $existingUser = getUserByEmail($cnx, $_POST['email']);
        if ($existingUser) {
            $errors[] = "This email is already registered";
        }
        
        if (empty($errors)) {
            $plan = $_POST['plan'] ?? 'free';
            
            $userData = [
                'name' => $_POST['name'],
                'email' => $_POST['email'],
                'password' => $_POST['password'],
                'plan' => $plan,
                'isPremium' => ($plan === 'premium') ? 1 : 0,
                'isAdmin' => 0
            ];
            
            if (AddUser($cnx, $userData)) {
                $user = getUserByEmail($cnx, $_POST['email']);
                
                if ($user) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['name'] = $user['name'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['plan'] = $user['plan'];
                    $_SESSION['isPremium'] = $user['isPremium'];
                    $_SESSION['isAdmin'] = $user['isAdmin'];
                    
                    header("Location: ../../index.php");
                    exit();
                }
            } else {
                $errors[] = "Database error. Please try again.";
            }
        }
    }
    
    // ════ FORGOT PASSWORD ════
    if ($mode === 'forgot' && isset($_POST['email'])) {
        if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Please enter a valid email address";
        } else {
            $success = "If this email exists, a reset link has been sent.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog — <?= $mode === 'signup' ? 'Create Account' : ($mode === 'forgot' ? 'Reset Password' : 'Sign In') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="auth.css">
  <style>
    /* ── page wrapper ── */
    body {
      margin: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
      font-family: 'DM Sans', sans-serif;
    }
    .auth-page-card {
      background: var(--bg, #fff);
      border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,.45);
      width: 100%; max-width: 480px;
      padding: 40px 36px;
      position: relative;
    }
    .auth-logo {
      font-family: 'Playfair Display', serif;
      font-size: 28px; font-weight: 700;
      color: var(--accent, #7c5cbf);
      margin-bottom: 6px;
    }
    .auth-mode-tabs {
      display: flex; gap: 6px; margin-bottom: 24px;
    }
    .auth-mode-tabs a {
      flex: 1; text-align: center;
      padding: 9px 0; border-radius: 10px;
      font-size: 14px; font-weight: 600;
      text-decoration: none;
      color: #888;
      border: 2px solid transparent;
      transition: .2s;
    }
    .auth-mode-tabs a.active {
      color: var(--accent, #7c5cbf);
      border-color: var(--accent, #7c5cbf);
      background: rgba(124,92,191,.08);
    }
    .auth-mode-tabs a:hover:not(.active) { background: #f5f5f5; }

    .alert-error {
      background: #fff0f0; border: 1px solid #ffb3b3;
      color: #c0392b; border-radius: 10px;
      padding: 12px 16px; font-size: 14px;
      margin-bottom: 16px;
    }
    .alert-success {
      background: #f0fff4; border: 1px solid #9be7af;
      color: #217a3c; border-radius: 10px;
      padding: 12px 16px; font-size: 14px;
      margin-bottom: 16px;
    }
    .back-link {
      display: block; text-align: center;
      margin-top: 20px; font-size: 14px;
      color: #888; text-decoration: none;
    }
    .back-link:hover { color: var(--accent, #7c5cbf); }

    /* plan picker radio style */
    .plan-opt input[type="radio"] { display: none; }
    .plan-opt { cursor: pointer; }
    .plan-opt:has(input:checked) { border-color: var(--accent, #7c5cbf); background: rgba(124,92,191,.08); }
  </style>
</head>
<body>

<div class="auth-page-card">
  <!-- Logo -->
  <div class="auth-logo">IBlog</div>
  <p style="color:#888;font-size:14px;margin-bottom:22px;">Knowledge Without Borders</p>

  <!-- Tabs -->
  <div class="auth-mode-tabs">
    <a href="?mode=signin" class="<?= $mode === 'signin' ? 'active' : '' ?>">Sign In</a>
    <a href="?mode=signup" class="<?= $mode === 'signup' ? 'active' : '' ?>">Sign Up</a>
    <a href="?mode=forgot" class="<?= $mode === 'forgot' ? 'active' : '' ?>">Forgot?</a>
  </div>

  <!-- Errors -->
  <?php if ($errors !== []): ?>
    <div class="alert-error">
      <?= htmlspecialchars(implode(' ', $errors), ENT_QUOTES, 'UTF-8') ?>
    </div>
  <?php endif; ?>

  <!-- Success -->
  <?php if ($success !== ''): ?>
    <div class="alert-success">
      <?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?>
    </div>
  <?php endif; ?>


  <!-- ════ SIGNUP FORM ════ -->
  <?php if ($mode === 'signup'): ?>
    <form method="POST" action="auth.php?mode=signup" novalidate>
      <input type="hidden" name="action" value="signup">

      <!-- Plan picker -->
      <div class="plan-picker" style="margin-bottom:18px;">
        <label class="plan-opt">
          <input type="radio" name="plan" value="free"
            <?= ($_POST['plan'] ?? 'free') !== 'premium' ? 'checked' : '' ?>>
          <div class="plan-icon">🆓</div>
          <strong>Free</strong>
          <small>Read &amp; write, basic tools</small>
        </label>
        <label class="plan-opt premium-plan">
          <input type="radio" name="plan" value="premium"
            <?= ($_POST['plan'] ?? '') === 'premium' ? 'checked' : '' ?>>
          <div class="plan-icon">⭐</div>
          <strong>Premium</strong>
          <small>Templates · Map · Priority</small>
          <div class="plan-price">$9 / mo</div>
        </label>
      </div>

      <div class="field-float">
        <input type="text" id="name" name="name" placeholder=" "
               value="<?= htmlspecialchars((string)($_POST['name'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" required>
        <label for="name">Full Name</label>
      </div>

      <div class="field-float">
        <input type="email" id="email" name="email" placeholder=" "
               value="<?= htmlspecialchars((string)($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" required>
        <label for="email">Email address</label>
      </div>

      <div class="field-float">
        <input type="password" id="password" name="password" placeholder=" " required>
        <label for="password">Password</label>
      </div>

      <div class="field-float">
        <input type="password" id="confirm_password" name="confirm_password" placeholder=" " required>
        <label for="confirm_password">Repeat Password</label>
      </div>

      <button class="btn btn-primary btn-full" type="submit" style="margin-top:8px;">
        Create Account
      </button>
    </form>


  <!-- ════ FORGOT PASSWORD FORM ════ -->
  <?php elseif ($mode === 'forgot'): ?>
    <form method="POST" action="auth.php?mode=forgot" novalidate>
      <input type="hidden" name="action" value="forgot">

      <p style="font-size:14px;color:#888;margin-bottom:16px;">
        Enter your email and we'll send you a reset link.
      </p>

      <div class="field-float">
        <input type="email" id="fp_email" name="email" placeholder=" "
               value="<?= htmlspecialchars((string)($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" required>
        <label for="fp_email">Email address</label>
      </div>

      <button class="btn btn-primary btn-full" type="submit">Send Reset Link</button>
    </form>


  <!-- ════ SIGNIN FORM ════ -->
  <?php else: ?>
    <form method="POST" action="auth.php?mode=signin" novalidate>
      <input type="hidden" name="action" value="signin">

      <div class="field-float">
        <input type="email" id="si_email" name="email" placeholder=" "
               value="<?= htmlspecialchars((string)($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" required>
        <label for="si_email">Email address</label>
      </div>

      <div class="field-float">
        <input type="password" id="si_password" name="password" placeholder=" " required>
        <label for="si_password">Password</label>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
        <a href="?mode=forgot" style="font-size:13px;color:#888;text-decoration:none;">
          Forgot password?
        </a>
      </div>

      <button class="btn btn-primary btn-full" type="submit">Sign In</button>

      <!-- Accès direct admin panel -->
      <div style="text-align:center;margin-top:16px;">
        <a href="admin.php" style="font-size:13px;color:#888;text-decoration:none;">
          🔒 Admin Panel
        </a>
      </div>
    </form>
  <?php endif; ?>

  <a href="../../index.php" class="back-link">← Back to IBlog</a>
</div>

<!-- ── Sync BDD → sessionStorage pour auth.js ── -->
<script>
  <?php if (isset($_SESSION['user_id'])): ?>
    const _phpUser = {
      name:      <?= json_encode($_SESSION['name']      ?? '') ?>,
      email:     <?= json_encode($_SESSION['email']     ?? '') ?>,
      plan:      <?= json_encode($_SESSION['plan']       ?? 'free') ?>,
      isPremium: <?= json_encode((bool)($_SESSION['isPremium'] ?? false)) ?>,
      isAdmin:   <?= json_encode((bool)($_SESSION['isAdmin']   ?? false)) ?>,
      initial:   <?= json_encode(strtoupper(substr($_SESSION['name'] ?? 'A', 0, 1))) ?>,
      onboardingComplete: true,
    };
    sessionStorage.setItem('user', JSON.stringify(_phpUser));
    localStorage.setItem('user',   JSON.stringify(_phpUser));
  <?php endif; ?>
</script>

</body>
</html>