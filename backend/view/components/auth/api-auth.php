<?php
/**
 * api-auth.php
 * Location : iblog/backend/view/components/auth/api-auth.php
 *
 * Path resolution — works on Windows XAMPP without realpath() failures:
 *   This file  = iblog/backend/view/components/auth/api-auth.php
 *   backend/   = iblog/backend/
 *   Go up 3 directories from __DIR__:
 *     auth  -> components -> view -> backend
 */
declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

/* ── helpers ── */
function jsonOk(array $data = []): never {
    echo json_encode(['ok' => true] + $data);
    exit();
}
function jsonErr(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit();
}

try {
    session_start();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonErr('Method not allowed', 405);
    }

    /* ── Locate backend/ by walking up from this file ── */
    // str_replace handles both / and \ on Windows
    $thisDir     = str_replace('\\', '/', __DIR__);
    // Split and remove last 3 segments: auth, components, view  →  backend
    $parts       = explode('/', $thisDir);
    $backendParts = array_slice($parts, 0, count($parts) - 3);
    $backendPath  = implode('/', $backendParts);   // .../iblog/backend

    $configFile     = $backendPath . '/config/database.php';
    $modelFile      = $backendPath . '/model/users.php';
    $controllerFile = $backendPath . '/controller/UserController.php';

    if (!file_exists($configFile)) {
        jsonErr('Config not found at: ' . $configFile . ' | __DIR__=' . __DIR__, 500);
    }

    require_once $configFile;
    require_once $modelFile;
    require_once $controllerFile;

    /* ── Read JSON body ── */
    $raw    = (string) file_get_contents('php://input');
    $body   = json_decode($raw ?: '{}', true) ?? [];
    $action = (string)($body['action'] ?? '');

    /* ════ ME ════ */
    if ($action === 'me') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $user = getUserById($cnx, (int)$_SESSION['user_id']);
        if (!$user) jsonErr('User not found', 404);
        jsonOk(['user' => [
            'name'               => $user->name,
            'email'              => $user->email,
            'plan'               => $user->plan,
            'isPremium'          => (bool)$user->isPremium,
            'isAdmin'            => (bool)$user->isAdmin,
            'initial'            => strtoupper($user->name[0] ?? 'A'),
            'onboardingComplete' => true,
        ]]);
    }

    /* ════ UPDATE PROFILE ════ */
    if ($action === 'update_profile') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $id    = (int)$_SESSION['user_id'];
        $name  = trim((string)($body['name']  ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $bio   = trim((string)($body['bio']   ?? ''));

        if (mb_strlen($name) < 2)                       jsonErr('Name must be at least 2 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');

        $existing = getUserByEmail($cnx, $email);
        if ($existing && (int)$existing->id !== $id)    jsonErr('This email is already used by another account.');

        if (!updateUser($cnx, $id, ['name' => $name, 'email' => $email])) {
            jsonErr('Could not update profile.', 500);
        }
        $_SESSION['name']  = $name;
        $_SESSION['email'] = $email;
        jsonOk(['user' => ['name' => $name, 'email' => $email, 'initial' => strtoupper($name[0] ?? 'A')]]);
    }

    /* ════ SIGNUP ════ */
    if ($action === 'signup') {
        $name     = trim((string)($body['name']     ?? ''));
        $email    = trim((string)($body['email']    ?? ''));
        $password = (string)($body['password'] ?? '');
        $plan     = ($body['plan'] ?? 'free') === 'premium' ? 'premium' : 'free';

        if (mb_strlen($name) < 2)                       jsonErr('Name must be at least 2 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');
        if (strlen($password) < 6)                      jsonErr('Password must be at least 6 characters.');
        if ($email === 'admin@iblog.com')               jsonErr('This email is reserved.');
        if (getUserByEmail($cnx, $email) !== null)      jsonErr('This email is already registered. Please sign in.');

        $ok = createUser($cnx, [
            'name'      => $name,
            'email'     => $email,
            'password'  => $password,
            'plan'      => $plan,
            'isPremium' => $plan === 'premium' ? 1 : 0,
            'isAdmin'   => 0,
        ]);
        if (!$ok) jsonErr('Database error. Please try again.', 500);

        $user = getUserByEmail($cnx, $email);
        if (!$user) jsonErr('Account created but could not retrieve user.', 500);

        session_regenerate_id(true);
        $_SESSION['user_id']   = $user->id;
        $_SESSION['name']      = $user->name;
        $_SESSION['email']     = $user->email;
        $_SESSION['plan']      = $user->plan;
        $_SESSION['isPremium'] = (int)$user->isPremium;
        $_SESSION['isAdmin']   = (int)$user->isAdmin;

        jsonOk(['user' => [
            'name'               => $user->name,
            'email'              => $user->email,
            'plan'               => $user->plan,
            'isPremium'          => (bool)$user->isPremium,
            'isAdmin'            => (bool)$user->isAdmin,
            'initial'            => strtoupper($user->name[0] ?? 'A'),
            'onboardingComplete' => false,
        ]]);
    }

    /* ════ SIGNIN ════ */
    if ($action === 'signin') {
        $email    = trim((string)($body['email']    ?? ''));
        $password = (string)($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Please enter a valid email address.');
        if (strlen($password) < 6)                      jsonErr('Password must be at least 6 characters.');

        $user = getUserByEmail($cnx, $email);
        if ($user === null)                                jsonErr('No account found. Please sign up first.');
        if (!password_verify($password, $user->password)) jsonErr('Incorrect password.');

        session_regenerate_id(true);
        $_SESSION['user_id']   = $user->id;
        $_SESSION['name']      = $user->name;
        $_SESSION['email']     = $user->email;
        $_SESSION['plan']      = $user->plan;
        $_SESSION['isPremium'] = (int)$user->isPremium;
        $_SESSION['isAdmin']   = (int)$user->isAdmin;

        if ((int)$user->isAdmin === 1) {
            jsonOk(['redirect' => 'backend/view/components/admin/admin.php']);
        }

        jsonOk(['user' => [
            'name'               => $user->name,
            'email'              => $user->email,
            'plan'               => $user->plan,
            'isPremium'          => (bool)$user->isPremium,
            'isAdmin'            => false,
            'initial'            => strtoupper($user->name[0] ?? 'A'),
            'onboardingComplete' => true,
        ]]);
    }

    jsonErr('Unknown action: ' . htmlspecialchars($action), 400);

} catch (Throwable $e) {
    jsonErr('Server error: ' . $e->getMessage(), 500);
}