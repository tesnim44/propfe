<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/../../backend/config/database.php';
require_once __DIR__ . '/../../backend/controller/UserController.php';

if (!isset($_SESSION['email'])) {
    header('Location: ../auth/auth.php?mode=signin');
    exit();
}

$message = '';
$errors = [];
$user = null;

if (isset($_SESSION['user_id'])) {
    $user = getUserById($cnx, (int) $_SESSION['user_id']);
}

if (!$user instanceof Users) {
    $user = getUserByEmail($cnx, (string) $_SESSION['email']);
}

if (!$user instanceof Users) {
    session_destroy();
    header('Location: ../auth/auth.php?mode=signin');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'logout') {
        session_unset();
        session_destroy();
        header('Location: ../auth/auth.php?mode=signin');
        exit();
    }

    if ($action === 'update') {
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));

        if ($name === '' || mb_strlen($name) < 2) {
            $errors[] = 'Name must be at least 2 characters.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Please enter a valid email address.';
        }

        $existing = getUserByEmail($cnx, $email);
        if ($existing instanceof Users && (int) $existing->id !== (int) $user->id) {
            $errors[] = 'This email is already used by another account.';
        }

        if ($errors === []) {
            $updated = updateUser($cnx, (int) $user->id, [
                'name' => $name,
                'email' => $email,
            ]);

            if ($updated) {
                $user = getUserById($cnx, (int) $user->id) ?? $user;
                $_SESSION['name'] = $user->name;
                $_SESSION['email'] = $user->email;
                $message = 'Profile updated successfully.';
            } else {
                $errors[] = 'Unable to update the profile.';
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
  <title>User Profile</title>
  <link rel="stylesheet" href="profile.css">
  <link rel="stylesheet" href="../auth/auth.css">
</head>
<body>
  <div class="card">
    <div class="banner"></div>

    <h2 class="name"><?= htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8') ?></h2>
    <h2 class="name"><?= htmlspecialchars($user->email, ENT_QUOTES, 'UTF-8') ?></h2>

    <?php if ($message !== ''): ?>
      <div class="promo-msg ok" style="display:block;margin:12px 0;">
        <?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?>
      </div>
    <?php endif; ?>

    <?php if ($errors !== []): ?>
      <div class="field-err show" style="display:block;margin:12px 0;">
        <?= htmlspecialchars(implode(' ', $errors), ENT_QUOTES, 'UTF-8') ?>
      </div>
    <?php endif; ?>

    <div class="actions">
      <div class="follow-info">
        <h2>
          <a href="#">
            <span>1000</span>
            <small>Followers</small>
          </a>
        </h2>
        <h2>
          <a href="#">
            <span>12</span>
            <small>Following</small>
          </a>
        </h2>
      </div>
    </div>

    <div class="desc">Welcome to your profile!</div>

    <form method="post" action="profile.php" style="margin-top:20px;text-align:left;">
      <input type="hidden" name="action" value="update">
      <div class="field-float">
        <input type="text" id="profile_name" name="name" placeholder=" " value="<?= htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8') ?>">
        <label for="profile_name">Full Name</label>
      </div>
      <div class="field-float">
        <input type="email" id="profile_email" name="email" placeholder=" " value="<?= htmlspecialchars($user->email, ENT_QUOTES, 'UTF-8') ?>">
        <label for="profile_email">Email</label>
      </div>
      <button class="btn btn-primary btn-full" type="submit">Save Changes</button>
    </form>

    <form method="post" action="profile.php" style="margin-top:12px;">
      <input type="hidden" name="action" value="logout">
      <button class="btn btn-full" type="submit">Logout</button>
    </form>
  </div>
</body>
</html>
