<?php
declare(strict_types=1);
session_start();

require_once __DIR__ . '/../../backend/config/database.php';
require_once __DIR__ . '/../../backend/model/users.php';

$mode = $_GET['mode'] ?? 'signin';
$errors = [];
$success = '';

function authRedirect(string $location): never {
    header('Location: ' . $location);
    exit();
}

function authSetSession(Users $user): void {
    $_SESSION['user_id'] = $user->id;
    $_SESSION['name'] = $user->name;
    $_SESSION['email'] = $user->email;
    $_SESSION['plan'] = $user->plan;
    $_SESSION['isPremium'] = (int) $user->isPremium;
    $_SESSION['isAdmin'] = (int) $user->isAdmin;
   
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $email = trim((string)($_POST['email'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($action === 'signin') {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Please enter a valid email address.';
        }
        if (empty($errors)) {
            $user = getUserByEmail($cnx, $email);
            if ($user !== null && password_verify($password, $user->password)) {
                authSetSession($user);
                authRedirect($user->isAdmin === 1 ? '../admin/admin.php' : '../profile/profile.php');
            } else {
                $errors[] = 'Invalid email or password.';
            }
        }
    } elseif ($action === 'signup') {
        $name = trim((string)($_POST['name'] ?? ''));
        $confirmPassword = (string)($_POST['confirm_password'] ?? '');
        $plan = ($_POST['plan'] ?? 'free') === 'premium' ? 'premium' : 'free';

        if (mb_strlen($name) < 2) $errors[] = 'Name is too short.';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email.';
        if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
        if ($password !== $confirmPassword) $errors[] = 'Passwords do not match.';
        
        // Use your model function to check existence
        if (getUserByEmail($cnx, $email) !== null) {
            $errors[] = 'Email already registered.';
        }

        if (empty($errors)) {
            $created = createUser($cnx, [
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'plan' => $plan,
                'isPremium' => $plan === 'premium' ? 1 : 0,
                'isAdmin' => 0,
              
            ]);

            if ($created) {
                $user = getUserByEmail($cnx, $email);
                if ($user) {
                    authSetSession($user);
                    authRedirect('../profile/profile.php');
                }
            } else {
                $errors[] = 'Database error during registration.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog Auth</title>
  <link rel="stylesheet" href="auth.css">
</head>
<body>
  <div class="modal-overlay active" style="position:static;min-height:100vh;padding:24px;">
    <div class="modal" style="max-width:520px;width:100%;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 class="modal-title" style="margin:0;">IBlog Account</h2>
        <a href="../../index.php" class="auth-arrow-link">Back</a>
      </div>

      <div class="modal-switch" style="justify-content:flex-start;gap:16px;margin-bottom:18px;">
        <a class="auth-arrow-link" href="?mode=signin">Sign In</a>
        <a class="auth-arrow-link" href="?mode=signup">Sign Up</a>
        <a class="auth-arrow-link" href="?mode=forgot">Forgot Password</a>
      </div>

      <?php if ($errors !== []): ?>
        <div class="field-err show" style="display:block;margin-bottom:14px;">
          <?= htmlspecialchars(implode(' ', $errors), ENT_QUOTES, 'UTF-8') ?>
        </div>
      <?php endif; ?>

      <?php if ($success !== ''): ?>
        <div class="promo-msg ok" style="display:block;margin-bottom:14px;">
          <?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?>
        </div>
      <?php endif; ?>

      <?php if ($mode === 'signup'): ?>
        <form method="post" action="auth.php?mode=signup">
          <input type="hidden" name="action" value="signup">

          <div class="plan-picker" style="margin-bottom:16px;">
            <label class="plan-opt" style="cursor:pointer;">
              <input type="radio" name="plan" value="free" checked style="display:none;">
              <div class="plan-icon"></div><strong>Free</strong><small>Read and write, basic tools</small>
            </label>
            <label class="plan-opt premium-plan" style="cursor:pointer;">
              <input type="radio" name="plan" value="premium" style="display:none;">
              <div class="plan-icon"></div><strong>Premium</strong><small>Templates, map, priority</small>
              <div class="plan-price">$9 / mo</div>
            </label>
          </div>

          <div class="field-float">
            <input type="text" id="name" name="name" placeholder=" " value="<?= htmlspecialchars((string) ($_POST['name'] ?? ''), ENT_QUOTES, 'UTF-8') ?>">
            <label for="name">Full Name</label>
          </div>
          <div class="field-float">
            <input type="email" id="email" name="email" placeholder=" " value="<?= htmlspecialchars((string) ($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>">
            <label for="email">Email address</label>
          </div>
          <div class="field-float">
            <input type="password" id="password" name="password" placeholder=" ">
            <label for="password">Password</label>
          </div>
          <div class="field-float">
            <input type="password" id="confirm_password" name="confirm_password" placeholder=" ">
            <label for="confirm_password">Repeat Password</label>
          </div>

          <button class="btn btn-primary btn-full" type="submit">Create Account</button>
        </form>
      <?php elseif ($mode === 'forgot'): ?>
        <form method="post" action="auth.php?mode=forgot">
          <input type="hidden" name="action" value="forgot">
          <div class="field-float">
            <input type="email" id="forgot_email" name="email" placeholder=" " value="<?= htmlspecialchars((string) ($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>">
            <label for="forgot_email">Email address</label>
          </div>
          <button class="btn btn-primary btn-full" type="submit">Send Reset Link</button>
        </form>
      <?php else: ?>
        <form method="post" action="auth.php?mode=signin">
          <input type="hidden" name="action" value="signin">
          <div class="field-float">
            <input type="email" id="signin_email" name="email" placeholder=" " value="<?= htmlspecialchars((string) ($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8') ?>">
            <label for="signin_email">Email address</label>
          </div>
          <div class="field-float">
            <input type="password" id="signin_password" name="password" placeholder=" ">
            <label for="signin_password">Password</label>
          </div>
          <button class="btn btn-primary btn-full" type="submit">Sign In</button>
        </form>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
