<?php
declare(strict_types=1);
session_start();

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action   = $_POST['action'] ?? '';
    $email    = trim((string)($_POST['email']    ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($action === 'login') {
        if ($email === 'admin@iblog.com' && $password === 'admin2026') {
            $_SESSION['adminLoggedIn'] = true;
            $_SESSION['email'] = $email;
            $_SESSION['name']  = 'Admin';
            header('Location: admin.php');
            exit();
        }
        $error = 'Invalid credentials. Please try again.';
    }

    if ($action === 'logout') {
        session_destroy();
        header('Location: admin.php');
        exit();
    }
}

$isAdmin = isset($_SESSION['adminLoggedIn']) && $_SESSION['adminLoggedIn'] === true;
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

<!-- ══ CONFIRM DIALOG ══ -->
<div id="admin-confirm" class="admin-confirm-overlay">
  <div class="admin-confirm-box">
    <h3 id="confirm-title"></h3>
    <p  id="confirm-msg"></p>
    <div class="admin-confirm-actions">
      <button class="admin-btn admin-btn-ghost"  onclick="IBlogAdmin.closeConfirm()">Cancel</button>
      <button class="admin-btn admin-btn-danger" id="confirm-ok-btn">Confirm</button>
    </div>
  </div>
</div>

<!-- ══ LOGIN ══ -->
<div id="admin-login" style="<?= $isAdmin ? 'display:none' : 'display:flex' ?>">
  <div class="admin-login-card">
    <div class="admin-login-logo">
      IBlog
      <span>Admin Console</span>
    </div>
    <h2 class="admin-login-title">Welcome back, Admin</h2>
    <p  class="admin-login-sub">Sign in to access the control panel.</p>

    <?php if ($error !== ''): ?>
    <div class="admin-login-error show" id="admin-login-error">
      <?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?>
    </div>
    <?php endif; ?>

    <form method="post" action="admin.php">
      <input type="hidden" name="action" value="login">
      <div class="admin-form-group">
        <label for="admin-email">Admin Email</label>
        <input type="email" id="admin-email" name="email" placeholder="admin@iblog.com" required>
      </div>
      <div class="admin-form-group">
        <label for="admin-password">Password</label>
        <input type="password" id="admin-password" name="password" placeholder="••••••••" required>
      </div>
      <button class="admin-login-btn" type="submit">Sign In to Admin Panel</button>
    </form>

    <div class="admin-login-footer">
      <a href="../../../../index.php">← Back to IBlog</a>
      <span>&copy; 2026 IBlog</span>
    </div>
  </div>
</div>

<!-- ══ DASHBOARD ══ (only rendered when logged in) ══ -->
<?php if ($isAdmin): ?>
<div id="admin-dashboard">
  <div class="admin-layout">

    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="admin-brand-logo">IBlog</div>
        <div class="admin-brand-tag">Admin Console</div>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Overview</div>
        <div class="admin-nav-item active" onclick="IBlogAdmin.navigate('overview', this)">
          <span class="admin-nav-icon">📊</span> Dashboard
        </div>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Manage</div>
        <div class="admin-nav-item" onclick="IBlogAdmin.navigate('users', this)">
          <span class="admin-nav-icon">👥</span> Users
          <span class="admin-nav-badge" id="users-badge">…</span>
        </div>
        <div class="admin-nav-item" onclick="IBlogAdmin.navigate('articles', this)">
          <span class="admin-nav-icon">📄</span> Articles
          <span class="admin-nav-badge" id="articles-badge">…</span>
        </div>
        <div class="admin-nav-item" onclick="IBlogAdmin.navigate('revenue', this)">
          <span class="admin-nav-icon">💰</span> Revenue
        </div>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">System</div>
        <div class="admin-nav-item" onclick="window.location.href='../../../../index.php'">
          <span class="admin-nav-icon">🌐</span> View Site
        </div>
      </div>

      <div class="admin-sidebar-footer">
        <form method="post" action="admin.php">
          <input type="hidden" name="action" value="logout">
          <button class="admin-btn admin-btn-danger" type="submit" style="width:100%">Logout</button>
        </form>
      </div>
    </aside>

    <!-- Main -->
    <main class="admin-main">

      <!-- ── OVERVIEW ── -->
      <div class="admin-view active" id="view-overview">
        <div class="admin-topbar">
          <div>
            <div class="admin-page-title">Dashboard Overview</div>
            <div class="admin-page-sub">Welcome back, <?= htmlspecialchars($_SESSION['name'] ?? 'Admin', ENT_QUOTES, 'UTF-8') ?> — here's what's happening.</div>
          </div>
          <div class="admin-topbar-right">
            <div id="admin-time"></div>
          </div>
        </div>

        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-value" id="stat-users">…</div>
            <div class="admin-stat-label">Total Users</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-value" id="stat-articles">…</div>
            <div class="admin-stat-label">Total Articles</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-value" id="stat-premium">…</div>
            <div class="admin-stat-label">Premium Members</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-value" id="stat-revenue">…</div>
            <div class="admin-stat-label">Monthly Revenue</div>
          </div>
        </div>

        <div class="admin-grid-2">
          <div class="admin-card">
            <div class="admin-card-title">User Growth</div>
            <div class="admin-bar-chart" id="chart-users">
              <div style="color:var(--text3);font-size:13px;padding:20px">Loading…</div>
            </div>
          </div>
          <div class="admin-card">
            <div class="admin-card-title">Revenue Growth</div>
            <div class="admin-bar-chart" id="chart-revenue">
              <div style="color:var(--text3);font-size:13px;padding:20px">Loading…</div>
            </div>
          </div>
        </div>

        <div class="admin-card" style="margin-top:20px">
          <div class="admin-card-title">Recent Activity</div>
          <table class="admin-table">
            <thead>
              <tr><th>Event</th><th>User</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody id="activity-log">
              <tr><td colspan="4" style="text-align:center;color:var(--text3)">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── USERS ── -->
      <div class="admin-view" id="view-users">
        <div class="admin-topbar">
          <div>
            <div class="admin-page-title">User Management</div>
            <div class="admin-page-sub">Manage accounts, plans, and bans.</div>
          </div>
          <div class="admin-topbar-right">
            <input class="admin-search" type="text" placeholder="Search users…"
                   oninput="IBlogAdmin.filterUsers(this.value)">
          </div>
        </div>

        <div class="admin-filter-bar">
          <button class="admin-filter-chip active" onclick="IBlogAdmin.filterUsersByPlan(this,'all')">All</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterUsersByPlan(this,'premium')">⭐ Premium</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterUsersByPlan(this,'free')">Free</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterUsersByPlan(this,'banned')">🚫 Banned</button>
        </div>

        <div class="admin-card">
          <table class="admin-table">
            <thead>
              <tr><th>User</th><th>Plan</th><th>Articles</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody id="users-table">
              <tr><td colspan="6" style="text-align:center;color:var(--text3)">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── ARTICLES ── -->
      <div class="admin-view" id="view-articles">
        <div class="admin-topbar">
          <div>
            <div class="admin-page-title">Article Moderation</div>
            <div class="admin-page-sub">Feature, pin, boost, or hide articles.</div>
          </div>
          <div class="admin-topbar-right">
            <input class="admin-search" type="text" placeholder="Search articles…"
                   oninput="IBlogAdmin.filterArticles(this.value)">
          </div>
        </div>

        <div class="admin-filter-bar">
          <button class="admin-filter-chip active" onclick="IBlogAdmin.filterArticlesByStatus(this,'all')">All</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterArticlesByStatus(this,'featured')">⭐ Featured</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterArticlesByStatus(this,'pinned')">📌 Pinned</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterArticlesByStatus(this,'boosted')">🚀 Boosted</button>
          <button class="admin-filter-chip"        onclick="IBlogAdmin.filterArticlesByStatus(this,'hidden')">🙈 Hidden</button>
        </div>

        <div class="admin-card">
          <table class="admin-table">
            <thead>
              <tr><th>Title</th><th>Author</th><th>Category</th><th>Views</th><th>Label</th><th>Actions</th></tr>
            </thead>
            <tbody id="articles-table">
              <tr><td colspan="6" style="text-align:center;color:var(--text3)">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── REVENUE ── -->
      <div class="admin-view" id="view-revenue">
        <div class="admin-topbar">
          <div>
            <div class="admin-page-title">Revenue &amp; Subscriptions</div>
            <div class="admin-page-sub">Track and manage premium memberships.</div>
          </div>
        </div>

        <div class="admin-card">
          <table class="admin-table">
            <thead>
              <tr><th>Member</th><th>Since</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody id="revenue-table">
              <tr><td colspan="5" style="text-align:center;color:var(--text3)">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</div>
<?php else: ?>
<!-- Not logged in — dashboard hidden -->
<div id="admin-dashboard" style="display:none"></div>
<?php endif; ?>

<script src="admin.js"></script>
</body>
</html>