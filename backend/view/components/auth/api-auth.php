<?php
/**
 * api-auth.php
 * Location : iblog/backend/view/components/auth/api-auth.php
 * API JSON appelée par auth.js et pricing.js via fetch().
 *
 * Toutes les réponses des fonctions du controller sont des tableaux
 * associatifs → accès avec $user['colonne'] (jamais $user->colonne).
 */
declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

function jsonOk(array $data = []): never
{
    echo json_encode(['ok' => true] + $data);
    exit();
}

function jsonErr(string $msg, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit();
}

try {
    session_start();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonErr('Méthode non autorisée', 405);
    }

    // ── Résolution des chemins ────────────────────────────────────────────────
    $thisDir     = str_replace('\\', '/', __DIR__);
    $parts       = explode('/', $thisDir);
    $backendPath = implode('/', array_slice($parts, 0, count($parts) - 3));

    if (!file_exists($backendPath . '/config/database.php')) {
        jsonErr('Config introuvable : ' . $backendPath, 500);
    }

    require_once $backendPath . '/config/database.php';
    require_once $backendPath . '/model/users.php';
    require_once $backendPath . '/controller/UserController.php';

    // ── Corps JSON ────────────────────────────────────────────────────────────
    $raw    = (string) file_get_contents('php://input');
    $body   = json_decode($raw ?: '{}', true) ?? [];
    $action = (string) ($body['action'] ?? '');

    // ════════════════════════════
    //  SIGNUP (plan gratuit)
    // ════════════════════════════
    if ($action === 'signup') {
        $name     = trim((string) ($body['name']     ?? ''));
        $email    = trim((string) ($body['email']    ?? ''));
        $password =       (string) ($body['password'] ?? '');
        $plan     = ($body['plan'] ?? 'free') === 'premium' ? 'premium' : 'free';

        if (mb_strlen($name) < 2)                       jsonErr('Le nom doit contenir au moins 2 caractères.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Adresse e-mail invalide.');
        if (strlen($password) < 6)                      jsonErr('Le mot de passe doit contenir au moins 6 caractères.');
        if ($email === 'admin@iblog.com')               jsonErr('Cet e-mail est réservé.');
        if (getUserByEmail($cnx, $email) !== false)     jsonErr('Cet e-mail est déjà enregistré. Connectez-vous.');

        $ok = AddUser($cnx, [
            'name'      => $name,
            'email'     => $email,
            'password'  => $password,
            'plan'      => $plan,
            'isPremium' => $plan === 'premium' ? 1 : 0,
            'isAdmin'   => 0,
        ]);
        if (!$ok) jsonErr('Erreur base de données. Réessayez.', 500);

        // getUserByEmail() retourne array|false
        $user = getUserByEmail($cnx, $email);
        if ($user === false) jsonErr('Compte créé mais utilisateur introuvable.', 500);

        session_regenerate_id(true);
        $_SESSION['user_id']     = $user['id'];
        $_SESSION['name']        = $user['name'];
        $_SESSION['email']       = $user['email'];
        $_SESSION['plan']        = $user['plan'];
        $_SESSION['isPremium']   = (int) $user['isPremium'];
        $_SESSION['isAdmin']     = (int) $user['isAdmin'];

        jsonOk([
            'user' => [
                'name'               => $user['name'],
                'email'              => $user['email'],
                'plan'               => $user['plan'],
                'isPremium'          => (bool) $user['isPremium'],
                'isAdmin'            => (bool) $user['isAdmin'],
                'initial'            => strtoupper($user['name'][0] ?? 'A'),
                'onboardingComplete' => false,
            ]
        ]);
    }

    // ════════════════════════════
    //  SIGNIN
    // ════════════════════════════
    if ($action === 'signin') {
        $email    = trim((string) ($body['email']    ?? ''));
        $password =       (string) ($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Adresse e-mail invalide.');
        if (strlen($password) < 6)                      jsonErr('Le mot de passe doit contenir au moins 6 caractères.');

        // ConnectUser retourne array|false
        $user = ConnectUser($cnx, ['email' => $email, 'password' => $password]);

        if ($user === false) {
            $exists = getUserByEmail($cnx, $email);
            if ($exists === false) {
                jsonErr('Aucun compte trouvé avec cet e-mail. Inscrivez-vous d\'abord.');
            }
            jsonErr('Mot de passe incorrect.');
        }

        session_regenerate_id(true);
        $_SESSION['user_id']     = $user['id'];
        $_SESSION['name']        = $user['name'];
        $_SESSION['email']       = $user['email'];
        $_SESSION['plan']        = $user['plan'];
        $_SESSION['isPremium']   = (int) $user['isPremium'];
        $_SESSION['isAdmin']     = (int) $user['isAdmin'];
        $_SESSION['adminLoggedIn'] = ((int) $user['isAdmin'] === 1);

        // Redirection admin
        if ((int) $user['isAdmin'] === 1) {
            jsonOk(['redirect' => 'backend/view/components/admin/admin.php']);
        }

        jsonOk([
            'user' => [
                'name'               => $user['name'],
                'email'              => $user['email'],
                'plan'               => $user['plan'],
                'isPremium'          => (bool) $user['isPremium'],
                'isAdmin'            => false,
                'initial'            => strtoupper($user['name'][0] ?? 'A'),
                'onboardingComplete' => true,
            ]
        ]);
    }

    // ════════════════════════════
    //  UPGRADE_TO_PREMIUM
    // ════════════════════════════
    if ($action === 'upgrade_to_premium') {
        if (empty($_SESSION['user_id'])) jsonErr('Non authentifié. Connectez-vous d\'abord.', 401);

        $uid    = (int)   $_SESSION['user_id'];
        $method = trim((string) ($body['method'] ?? 'card'));
        $amount = (float) ($body['amount'] ?? 9.00);

        if (!upgradeToPremium($cnx, $uid, $method, $amount)) {
            jsonErr('Impossible de mettre à niveau le compte. Réessayez.', 500);
        }

        $_SESSION['plan']    = 'premium';
        $_SESSION['isPremium'] = 1;

        $user = getUserById($cnx, $uid);

        jsonOk([
            'user' => [
                'name'               => $user['name']  ?? $_SESSION['name']  ?? '',
                'email'              => $user['email'] ?? $_SESSION['email'] ?? '',
                'plan'               => 'premium',
                'isPremium'          => true,
                'isAdmin'            => (bool) ($_SESSION['isAdmin'] ?? 0),
                'initial'            => strtoupper(($user['name'] ?? $_SESSION['name'] ?? 'A')[0]),
                'onboardingComplete' => true,
            ]
        ]);
    }

    // ════════════════════════════
    //  SIGNUP_PREMIUM (depuis la page pricing)
    // ════════════════════════════
    if ($action === 'signup_premium') {
        $name     = trim((string) ($body['name']     ?? ''));
        $email    = trim((string) ($body['email']    ?? ''));
        $password =       (string) ($body['password'] ?? '');
        $method   = trim((string) ($body['method']   ?? 'card'));
        $amount   = (float) ($body['amount'] ?? 9.00);

        if (mb_strlen($name) < 2)                       jsonErr('Le nom doit contenir au moins 2 caractères.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Adresse e-mail invalide.');
        if (strlen($password) < 6)                      jsonErr('Le mot de passe doit contenir au moins 6 caractères.');
        if ($email === 'admin@iblog.com')               jsonErr('Cet e-mail est réservé.');

        $existing = getUserByEmail($cnx, $email);

        if ($existing !== false) {
            // E-mail déjà existant → simple mise à niveau
            upgradeToPremium($cnx, (int) $existing['id'], $method, $amount);
            $user = getUserById($cnx, (int) $existing['id']);
        } else {
            // Nouvel utilisateur premium
            $ok = AddUser($cnx, [
                'name'      => $name,
                'email'     => $email,
                'password'  => $password,
                'plan'      => 'premium',
                'isPremium' => 1,
                'isAdmin'   => 0,
            ]);
            if (!$ok) jsonErr('Erreur base de données lors de l\'inscription.', 500);

            $user = getUserByEmail($cnx, $email);
            if ($user === false) jsonErr('Compte créé mais utilisateur introuvable.', 500);

            upgradeToPremium($cnx, (int) $user['id'], $method, $amount);
        }

        session_regenerate_id(true);
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['name']      = $user['name'];
        $_SESSION['email']     = $user['email'];
        $_SESSION['plan']      = 'premium';
        $_SESSION['isPremium'] = 1;
        $_SESSION['isAdmin']   = (int) $user['isAdmin'];

        jsonOk([
            'user' => [
                'name'               => $user['name'],
                'email'              => $user['email'],
                'plan'               => 'premium',
                'isPremium'          => true,
                'isAdmin'            => (bool) $user['isAdmin'],
                'initial'            => strtoupper($user['name'][0] ?? 'A'),
                'onboardingComplete' => false,
            ]
        ]);
    }

    // ════════════════════════════
    //  ME — utilisateur de session
    // ════════════════════════════
    if ($action === 'me') {
        if (empty($_SESSION['user_id'])) jsonErr('Non authentifié', 401);

        $user = getUserById($cnx, (int) $_SESSION['user_id']);
        if ($user === false) jsonErr('Utilisateur introuvable', 404);

        jsonOk([
            'user' => [
                'name'               => $user['name'],
                'email'              => $user['email'],
                'plan'               => $user['plan'],
                'isPremium'          => (bool) $user['isPremium'],
                'isAdmin'            => (bool) $user['isAdmin'],
                'initial'            => strtoupper($user['name'][0] ?? 'A'),
                'onboardingComplete' => true,
            ]
        ]);
    }

    // ════════════════════════════
    //  UPDATE_PROFILE
    // ════════════════════════════
    if ($action === 'update_profile') {
        if (empty($_SESSION['user_id'])) jsonErr('Non authentifié', 401);

        $uid   = (int)   $_SESSION['user_id'];
        $name  = trim((string) ($body['name']  ?? ''));
        $email = trim((string) ($body['email'] ?? ''));

        if (mb_strlen($name) < 2)                       jsonErr('Le nom doit contenir au moins 2 caractères.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Adresse e-mail invalide.');

        $existing = getUserByEmail($cnx, $email);
        if ($existing !== false && (int) $existing['id'] !== $uid) {
            jsonErr('Cet e-mail est déjà utilisé par un autre compte.');
        }

        $current = getUserById($cnx, $uid);
        $ok = updateUser($cnx, $uid, [
            'name'      => $name,
            'email'     => $email,
            'password'  => '',
            'plan'      => $current['plan']      ?? 'free',
            'isPremium' => $current['isPremium'] ?? 0,
            'isAdmin'   => $current['isAdmin']   ?? 0,
        ]);

        if (!$ok) jsonErr('Impossible de mettre à jour le profil.', 500);

        $_SESSION['name']  = $name;
        $_SESSION['email'] = $email;

        jsonOk([
            'user' => [
                'name'    => $name,
                'email'   => $email,
                'initial' => strtoupper($name[0] ?? 'A'),
            ]
        ]);
    }

    jsonErr('Action inconnue : ' . htmlspecialchars($action), 400);

} catch (Throwable $e) {
    jsonErr('Erreur serveur : ' . $e->getMessage(), 500);
}