<?php
declare(strict_types=1);

$email = htmlspecialchars((string) ($_GET['email'] ?? ''), ENT_QUOTES, 'UTF-8');
$token = htmlspecialchars((string) ($_GET['token'] ?? ''), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password | IBlog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at top,#f4efde,#ece6d3 52%,#e4dcc5);font-family:'Manrope',sans-serif;color:#1c1a16;padding:24px}
    .card{width:min(100%,480px);background:#fff;border-radius:28px;padding:36px;box-shadow:0 30px 70px rgba(0,0,0,.12)}
    h1{font-family:'Playfair Display',serif;font-size:34px;margin:0 0 10px}
    p{color:#655f53;line-height:1.7}
    label{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7a7468;margin:18px 0 8px}
    input{width:100%;padding:14px 16px;border-radius:16px;border:1px solid #ddd4bf;background:#faf7ef;font:inherit;box-sizing:border-box}
    button{width:100%;margin-top:20px;padding:14px 18px;border:none;border-radius:999px;background:#b8960c;color:#fff;font-weight:800;font:inherit;cursor:pointer}
    .msg{margin-top:16px;font-size:14px}
    .msg.error{color:#b42318}
    .msg.success{color:#177245}
  </style>
</head>
<body>
  <div class="card">
    <h1>Choose a new password</h1>
    <p>Use at least 10 characters and include one capital letter, one number and one symbol.</p>
    <label for="password">New password</label>
    <input id="password" type="password" autocomplete="new-password">
    <label for="confirm">Confirm password</label>
    <input id="confirm" type="password" autocomplete="new-password">
    <button id="submit">Update password</button>
    <div class="msg" id="message"></div>
  </div>

  <script>
    const email = <?= json_encode($email) ?>;
    const token = <?= json_encode($token) ?>;
    const message = document.getElementById('message');

    document.getElementById('submit').addEventListener('click', async () => {
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm').value;

      if (!email || !token) {
        message.className = 'msg error';
        message.textContent = 'This reset link is incomplete.';
        return;
      }

      if (password !== confirm) {
        message.className = 'msg error';
        message.textContent = 'Passwords do not match.';
        return;
      }

      const response = await fetch('backend/view/components/auth/api-auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', email, token, password })
      });
      const data = await response.json();

      if (!data.ok) {
        message.className = 'msg error';
        message.textContent = data.error || 'Unable to reset password.';
        return;
      }

      message.className = 'msg success';
      message.textContent = 'Password updated. You can now sign in.';
    });
  </script>
</body>
</html>
