<?php
declare(strict_types=1);
session_start();

// Check if admin
if (!isset($_SESSION['isAdmin']) || (int)$_SESSION['isAdmin'] !== 1) {
    header('Location: admin-login.php');
    exit();
}

include __DIR__ . "/../../../config/database.php";
include __DIR__ . "/../../../model/users.php";
include __DIR__ . "/../../../controller/UserController.php";

$toast = '';
$toastType = 'success';

// Handle success/error messages from redirects
if (isset($_GET['modif']) && $_GET['modif'] == 'ok') {
    $toast = 'User updated successfully';
}
if (isset($_GET['delete']) && $_GET['delete'] == 'ok') {
    $toast = 'User deleted successfully';
    $toastType = 'success';
}
if (isset($_GET['delete']) && $_GET['delete'] == 'error') {
    $toast = 'Error deleting user';
    $toastType = 'error';
}

// Handle POST actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // DELETE
    if ($action === 'delete' && isset($_POST['user_id'])) {
        $id = (int)$_POST['user_id'];
        if ($id !== (int)$_SESSION['user_id']) {
            if (deleteUser($cnx, $id)) {
                header('location:admin.php?delete=ok');
            } else {
                header('location:admin.php?delete=error');
            }
            exit();
        }
    }

    // UPDATE
    if ($action === 'update' && isset($_POST['user_id'])) {
        $id = (int)$_POST['user_id'];
        $data = [
            'name'      => trim($_POST['name'] ?? ''),
            'email'     => trim($_POST['email'] ?? ''),
            'plan'      => $_POST['plan'] ?? 'free',
            'isPremium' => isset($_POST['isPremium']) ? 1 : 0,
            'isAdmin'   => isset($_POST['isAdmin']) ? 1 : 0,
        ];
        if (!empty($_POST['password'])) {
            $data['password'] = $_POST['password'];
        }
        
        if (updateUser($cnx, $id, $data)) {
            header('location:admin.php?modif=ok');
        } else {
            echo "Erreur lors de la mise à jour";
        }
        exit();
    }

    // CREATE
    if ($action === 'create') {
        $data = [
            'name'      => trim($_POST['name'] ?? ''),
            'email'     => trim($_POST['email'] ?? ''),
            'password'  => $_POST['password'] ?? '',
            'plan'      => $_POST['plan'] ?? 'free',
            'isPremium' => isset($_POST['isPremium']) ? 1 : 0,
            'isAdmin'   => isset($_POST['isAdmin']) ? 1 : 0,
        ];
        
        if (getUserByEmail($cnx, $data['email'])) {
            $toast = 'Email already exists';
            $toastType = 'error';
        } elseif (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            $toast = 'All fields required';
            $toastType = 'error';
        } else {
            if (AddUser($cnx, $data)) {
                header('location:admin.php?modif=ok');
                exit();
            } else {
                $toast = 'Database error';
                $toastType = 'error';
            }
        }
    }
}

// Get users
$search = trim($_GET['search'] ?? '');
if ($search !== '') {
    $allUsers = searchUsers($cnx, $search);
} else {
    $allUsers = getAllUsers($cnx);
}

// Stats
$allForStats = getAllUsers($cnx);
$totalUsers = count($allForStats);
$premiumUsers = count(array_filter($allForStats, fn($u) => (int)$u->isPremium === 1));
$adminUsers = count(array_filter($allForStats, fn($u) => (int)$u->isAdmin === 1));
$freeUsers = $totalUsers - $premiumUsers;
$adminName = htmlspecialchars($_SESSION['name'] ?? 'Admin', ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog — Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f7f8fa; --sidebar: #1a1a2e; --accent: #7c5cbf; --accent2: #e91e8c;
      --text: #1a1a2e; --text2: #666; --card: #fff;
      --border: #e8e8f0; --danger: #e74c3c; --success: #27ae60;
    }
    body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; }

    /* SIDEBAR */
    .sidebar {
      width: 230px; min-height: 100vh; background: var(--sidebar);
      display: flex; flex-direction: column; padding: 28px 0;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
    }
    .logo {
      font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700;
      color: #fff; padding: 0 22px 24px; border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .logo span { color: var(--accent); }
    nav { margin-top: 18px; flex: 1; }
    nav a {
      display: flex; align-items: center; gap: 11px; padding: 12px 22px;
      color: rgba(255,255,255,.6); text-decoration: none; font-size: 14px; font-weight: 500;
      border-left: 3px solid transparent; transition: .2s;
    }
    nav a:hover, nav a.active { color: #fff; border-left-color: var(--accent); background: rgba(255,255,255,.05); }
    .sidebar-footer {
      padding: 18px 22px; border-top: 1px solid rgba(255,255,255,.1);
      font-size: 13px; color: rgba(255,255,255,.45);
    }
    .sidebar-footer strong { color: #fff; display: block; margin-bottom: 3px; }
    .sidebar-footer a { color: var(--accent); text-decoration: none; font-size: 13px; margin-top: 8px; display: inline-block; }

    /* MAIN */
    .main { margin-left: 230px; flex: 1; padding: 30px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .topbar h1 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; }
    .topbar p { color: var(--text2); font-size: 14px; margin-top: 2px; }

    /* STATS */
    .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
    .stat { background: var(--card); border-radius: 14px; padding: 20px 22px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
    .stat .icon  { font-size: 26px; margin-bottom: 6px; }
    .stat .label { font-size: 12px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .stat .value { font-size: 30px; font-weight: 700; margin-top: 2px; }
    .stat.premium .value { color: var(--accent); }
    .stat.admins  .value { color: var(--accent2); }
    .stat.free    .value { color: var(--success); }

    /* CARD */
    .card { background: var(--card); border-radius: 14px; padding: 22px; margin-bottom: 22px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
    .card h2 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }

    /* SEARCH */
    .search { display: flex; gap: 10px; margin-bottom: 16px; }
    .search input {
      flex: 1; padding: 9px 14px; border-radius: 10px;
      border: 1px solid var(--border); font-size: 14px; font-family: inherit; outline: none;
    }
    .search input:focus { border-color: var(--accent); }
    .search button, .search a {
      padding: 9px 18px; border-radius: 10px; background: var(--accent); color: #fff;
      border: none; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; text-decoration: none; display: inline-flex; align-items: center;
    }
    .search a { background: #eee; color: var(--text); }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th {
      text-align: left; padding: 10px 12px; background: #f0f0f8;
      color: var(--text2); font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: .04em;
    }
    th:first-child { border-radius: 8px 0 0 8px; } th:last-child { border-radius: 0 8px 8px 0; }
    td { padding: 11px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafe; }

    /* BADGES */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
    .b-premium { background: #f3eeff; color: var(--accent); }
    .b-free    { background: #eafbf0; color: var(--success); }
    .b-admin   { background: #fff0fb; color: var(--accent2); }

    /* AVATAR */
    .av {
      width: 34px; height: 34px; border-radius: 50%; background: var(--accent); color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; margin-right: 8px;
    }

    /* BUTTONS */
    .btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; transition: .15s; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-danger  { background: var(--danger);  color: #fff; }
    .btn-outline { background: transparent; color: var(--text); border: 1.5px solid var(--border); }
    .btn:hover { opacity: .85; }

    /* MODAL */
    .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1000; align-items: center; justify-content: center; }
    .overlay.open { display: flex; }
    .mbox {
      background: var(--card); border-radius: 18px; padding: 30px;
      width: 100%; max-width: 430px;
      box-shadow: 0 20px 60px rgba(0,0,0,.3); position: relative;
    }
    .mbox h3 { font-size: 17px; font-weight: 700; margin-bottom: 18px; }
    .mclose { position: absolute; top: 14px; right: 16px; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text2); }
    .fg { margin-bottom: 13px; }
    .fg label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: var(--text2); }
    .fg input, .fg select {
      width: 100%; padding: 9px 12px; border-radius: 9px;
      border: 1px solid var(--border); font-size: 14px; font-family: inherit; outline: none;
    }
    .fg input:focus, .fg select:focus { border-color: var(--accent); }
    .fcheck { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; }

    /* TOAST */
    .toast {
      position: fixed; bottom: 26px; right: 26px; padding: 13px 20px;
      border-radius: 12px; font-size: 14px; font-weight: 600; color: #fff;
      z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,.25);
      animation: slideUp .3s ease;
    }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .toast.success { background: var(--success); }
    .toast.error   { background: var(--danger);  }
  </style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="logo">I<span>Blog</span></div>
  <nav>
    <a href="#" class="active">👥 Users</a>
    <a href="../../../../index.php">🌐 Visit Site</a>
    <a href="logout.php">🚪 Logout</a>
  </nav>
  <div class="sidebar-footer">
    <strong><?= $adminName ?></strong>
    Administrator
    <br><a href="admin-login.php">← Login page</a>
  </div>
</aside>

<!-- MAIN -->
<main class="main">
  <div class="topbar">
    <div>
      <h1>👥 User Management</h1>
      <p>All registered IBlog users</p>
    </div>
    <button class="btn btn-primary" onclick="openModal('create-modal')">+ New User</button>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div class="stat">
      <div class="icon">👥</div><div class="label">Total Users</div>
      <div class="value"><?= $totalUsers ?></div>
    </div>
    <div class="stat premium">
      <div class="icon">⭐</div><div class="label">Premium</div>
      <div class="value"><?= $premiumUsers ?></div>
    </div>
    <div class="stat free">
      <div class="icon">🆓</div><div class="label">Free</div>
      <div class="value"><?= $freeUsers ?></div>
    </div>
    <div class="stat admins">
      <div class="icon">🛡️</div><div class="label">Admins</div>
      <div class="value"><?= $adminUsers ?></div>
    </div>
  </div>

  <!-- Table -->
  <div class="card">
    <h2>📋 All Users</h2>
    <form method="GET" class="search">
      <input type="text" name="search" placeholder="Search by name or email…"
             value="<?= htmlspecialchars($search, ENT_QUOTES, 'UTF-8') ?>">
      <button type="submit">Search</button>
      <?php if ($search !== ''): ?>
        <a href="admin.php">✕ Clear</a>
      <?php endif; ?>
    </form>

    <table>
      <thead>
        <tr><th>#</th><th>User</th><th>Email</th><th>Plan</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <?php if (empty($allUsers)): ?>
          <tr><td colspan="7" style="text-align:center;color:var(--text2);padding:30px;">No users found.</td></tr>
        <?php else: ?>
          <?php $i = 0; foreach ($allUsers as $user): $i++; ?>
          <tr>
            <td style="color:var(--text2)"><?= $i ?></td>
            <td>
              <span class="av"><?= strtoupper($user->name[0] ?? 'U') ?></span>
              <?= htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8') ?>
            </td>
            <td style="color:var(--text2)"><?= htmlspecialchars($user->email, ENT_QUOTES, 'UTF-8') ?></td>
            <td>
              <span class="badge <?= $user->plan === 'premium' ? 'b-premium' : 'b-free' ?>">
                <?= $user->plan === 'premium' ? '⭐ Premium' : '🆓 Free' ?>
              </span>
            </td>
            <td>
              <?php if ((int)$user->isAdmin === 1): ?>
                <span class="badge b-admin">🛡️ Admin</span>
              <?php else: ?>
                <span style="color:var(--text2);font-size:13px;">User</span>
              <?php endif; ?>
            </td>
            <td style="color:var(--text2);font-size:13px;">
              <?= $user->createdAt ? date('M d, Y', strtotime($user->createdAt)) : '—' ?>
            </td>
            <td style="display:flex;gap:7px;">
              <button class="btn btn-outline" onclick='openEdit(<?= json_encode([
                "id"        => $user->id,
                "name"      => $user->name,
                "email"     => $user->email,
                "plan"      => $user->plan,
                "isPremium" => (int)$user->isPremium,
                "isAdmin"   => (int)$user->isAdmin,
              ]) ?>)'>✏️</button>
              <?php if ($user->id !== (int)$_SESSION['user_id']): ?>
                <button class="btn btn-danger" onclick="openDelete(<?= $user->id ?>, '<?= htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8') ?>')">🗑️</button>
              <?php endif; ?>
            </td>
          </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</main>

<!-- MODAL: EDIT -->
<div class="overlay" id="edit-modal">
  <div class="mbox">
    <button class="mclose" onclick="closeModal('edit-modal')">✕</button>
    <h3>✏️ Edit User</h3>
    <form method="POST">
      <input type="hidden" name="action"  value="update">
      <input type="hidden" name="user_id" id="e-id">
      <div class="fg"><label>Full Name</label><input type="text"     name="name"     id="e-name"     required></div>
      <div class="fg"><label>Email</label>    <input type="email"    name="email"    id="e-email"    required></div>
      <div class="fg"><label>New Password <span style="font-weight:400;color:#aaa">(blank = keep)</span></label><input type="password" name="password" placeholder="••••••••"></div>
      <div class="fg"><label>Plan</label>
        <select name="plan" id="e-plan">
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <div class="fcheck"><input type="checkbox" name="isPremium" id="e-isPremium" value="1"><label>⭐ Premium</label></div>
      <div class="fcheck"><input type="checkbox" name="isAdmin"   id="e-isAdmin"   value="1"><label>🛡️ Admin</label></div>
      <br>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;">Save Changes</button>
    </form>
  </div>
</div>

<!-- MODAL: CREATE -->
<div class="overlay" id="create-modal">
  <div class="mbox">
    <button class="mclose" onclick="closeModal('create-modal')">✕</button>
    <h3>➕ Create User</h3>
    <form method="POST">
      <input type="hidden" name="action" value="create">
      <div class="fg"><label>Full Name</label><input type="text"     name="name"     required></div>
      <div class="fg"><label>Email</label>    <input type="email"    name="email"    required></div>
      <div class="fg"><label>Password</label> <input type="password" name="password" required></div>
      <div class="fg"><label>Plan</label>
        <select name="plan"><option value="free">Free</option><option value="premium">Premium</option></select>
      </div>
      <div class="fcheck"><input type="checkbox" name="isPremium" value="1"><label>⭐ Premium</label></div>
      <div class="fcheck"><input type="checkbox" name="isAdmin"   value="1"><label>🛡️ Admin</label></div>
      <br>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;">Create User</button>
    </form>
  </div>
</div>

<!-- MODAL: DELETE -->
<div class="overlay" id="delete-modal">
  <div class="mbox" style="max-width:360px;text-align:center;">
    <button class="mclose" onclick="closeModal('delete-modal')">✕</button>
    <div style="font-size:44px;margin-bottom:10px;">🗑️</div>
    <h3 id="del-title">Delete User?</h3>
    <p style="color:var(--text2);font-size:14px;margin:10px 0 22px;">This action cannot be undone.</p>
    <form method="POST">
      <input type="hidden" name="action"  value="delete">
      <input type="hidden" name="user_id" id="del-id">
      <div style="display:flex;gap:12px;justify-content:center;">
        <button type="button" class="btn btn-outline" onclick="closeModal('delete-modal')" style="flex:1;justify-content:center;">Cancel</button>
        <button type="submit" class="btn btn-danger"  style="flex:1;justify-content:center;">Delete</button>
      </div>
    </form>
  </div>
</div>

<!-- TOAST -->
<?php if ($toast !== ''): ?>
  <div class="toast <?= $toastType ?>" id="toast"><?= htmlspecialchars($toast, ENT_QUOTES, 'UTF-8') ?></div>
  <script>setTimeout(() => document.getElementById('toast')?.remove(), 3500);</script>
<?php endif; ?>

<script>
  function openModal(id)  { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
  document.querySelectorAll('.overlay').forEach(m =>
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
  });

  function openEdit(u) {
    document.getElementById('e-id').value          = u.id;
    document.getElementById('e-name').value        = u.name;
    document.getElementById('e-email').value       = u.email;
    document.getElementById('e-plan').value        = u.plan;
    document.getElementById('e-isPremium').checked = u.isPremium === 1;
    document.getElementById('e-isAdmin').checked   = u.isAdmin   === 1;
    openModal('edit-modal');
  }

  function openDelete(id, name) {
    document.getElementById('del-id').value       = id;
    document.getElementById('del-title').textContent = `Delete "${name}"?`;
    openModal('delete-modal');
  }
</script>

</body>
</html>