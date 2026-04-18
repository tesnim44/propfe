<?php

declare(strict_types=1);

session_start();

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        $email = trim((string) ($_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        if ($email === 'admin@iblog.com' && $password === 'admin2026') {
            $_SESSION['adminLoggedIn'] = true;
            $_SESSION['email'] = $email;
            $_SESSION['name'] = 'Admin';
            header('Location: admin.php');
            exit();
        }

        $error = 'Invalid credentials. Please try again.';
    }

    if ($action === 'logout') {
        unset($_SESSION['adminLoggedIn']);
        header('Location: admin.php');
        exit();
    }
}

$isAdminLoggedIn = isset($_SESSION['adminLoggedIn']) && $_SESSION['adminLoggedIn'] === true;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog Admin Panel</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
<div id="admin-toast"></div>

<div id="admin-login" style="<?= $isAdminLoggedIn ? 'display:none;' : 'display:flex;' ?>">
  <div class="admin-login-card">
    <div class="admin-login-logo">
      IBlog
      <span>Admin Console</span>
    </div>
    <h2 class="admin-login-title">Welcome back, Admin</h2>
    <p class="admin-login-sub">Sign in to access the control panel.</p>
    <div class="admin-login-error <?= $error !== '' ? 'show' : '' ?>" id="admin-login-error">
      <?= htmlspecialchars($error !== '' ? $error : 'Invalid credentials. Please try again.', ENT_QUOTES, 'UTF-8') ?>
    </div>
    <form method="post" action="admin.php">
      <input type="hidden" name="action" value="login">
      <div class="admin-form-group">
        <label for="admin-email">Admin Email</label>
        <input type="email" id="admin-email" name="email" placeholder="admin@iblog.com">
      </div>
      <div class="admin-form-group">
        <label for="admin-password">Password</label>
        <input type="password" id="admin-password" name="password" placeholder="********">
      </div>
      <button class="admin-login-btn" type="submit">Sign In to Admin Panel</button>
    </form>
    <div class="admin-login-footer">
      <a href="../../index.php">Back to IBlog</a>
      <span>&copy; 2026 IBlog</span>
    </div>
  </div>
</div>

<div id="admin-dashboard" style="<?= $isAdminLoggedIn ? 'display:block;' : 'display:none;' ?>">
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="admin-brand-logo">IBlog</div>
        <div class="admin-brand-tag">Admin Console</div>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Overview</div>
        <div class="admin-nav-item active" onclick="IBlogAdmin.navigate('overview')">
          <span class="admin-nav-icon">Dashboard</span>
        </div>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">System</div>
        <div class="admin-nav-item" onclick="window.location.href='../../index.php'">
          <span class="admin-nav-icon">View Site</span>
        </div>
      </div>

      <div class="admin-sidebar-footer">
        <form method="post" action="admin.php">
          <input type="hidden" name="action" value="logout">
          <button class="admin-btn admin-btn-danger" type="submit" style="width:100%;">Logout</button>
        </form>
      </div>
    </aside>

    <main class="admin-main">
      <div class="admin-view active" id="view-overview">
        <div class="admin-topbar">
          <div>
            <div class="admin-page-title">Dashboard Overview</div>
            <div class="admin-page-sub">Admin session is active.</div>
          </div>
          <div class="admin-topbar-right">
            <div id="admin-time"></div>
          </div>
        </div>

        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-value">Users</div>
            <div class="admin-stat-label">Manage users from the JS dashboard</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-value">Articles</div>
            <div class="admin-stat-label">Moderate articles and featured content</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-value">Revenue</div>
            <div class="admin-stat-label">Track premium subscriptions</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<script src="admin.js"></script>
</body>
</html>
