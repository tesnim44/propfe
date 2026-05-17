<?php
// TOUJOURS en premier — avant tout include
session_start();

require_once dirname(__DIR__) . '/config/database.php';
require_once __DIR__ . '/ArticleController.php';

// Vérifier connexion
if (!isset($_SESSION['email'])) {
    header("Location: ../view/signup.php");
    exit();
}

// Récupérer user_id
if (!isset($_SESSION['user_id'])) {
    $req = $cnx->prepare("SELECT id FROM users WHERE email = :email");
    $req->execute([':email' => $_SESSION['email']]);
    $user = $req->fetch();
    if ($user) {
        $_SESSION['user_id'] = $user['id'];
    } else {
        header("Location: ../view/signup.php");
        exit();
    }
}

// Vérifier que c'est bien un POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../view/add_article.php");
    exit();
}

// ─── GESTION DE L'IMAGE ──────────────────────────────────
$coverImage = '';

// Priorité 1 : fichier uploadé depuis l'ordinateur
if (!empty($_FILES['coverImage']['name']) && $_FILES['coverImage']['error'] === UPLOAD_ERR_OK) {

    $uploadDir = __DIR__ . '/../public/uploads/covers/';

    // Créer le dossier si inexistant
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext      = strtolower(pathinfo($_FILES['coverImage']['name'], PATHINFO_EXTENSION));
    $allowed  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (in_array($ext, $allowed)) {
        // Nom unique pour éviter les conflits
        $filename = uniqid('cover_') . '.' . $ext;

        if (move_uploaded_file($_FILES['coverImage']['tmp_name'], $uploadDir . $filename)) {
            // Chemin relatif pour l'affichage dans le navigateur
            $coverImage = '../public/uploads/covers/' . $filename;
        }
    }
}

// Priorité 2 : URL collée (si pas de fichier uploadé)
if (empty($coverImage) && !empty($_POST['coverImage_url'])) {
    $coverImage = trim($_POST['coverImage_url']);
}
// ─────────────────────────────────────────────────────────

$data = [
    'authorId'    => $_SESSION['user_id'],
    'title'       => trim($_POST['title']       ?? ''),
    'body'        => trim($_POST['body']        ?? ''),
    'category'    => trim($_POST['category']    ?? ''),
    'tags'        => trim($_POST['tags']        ?? ''),
    'status'      => $_POST['status']           ?? 'draft',
    'coverImage'  => $coverImage,
    'readingTime' => trim($_POST['readingTime'] ?? ''),
    'label'       => $_POST['label']            ?? 'none',
];

$res = addArticle($cnx, $data);

if ($res) {
    header("Location: ../view/articles_list.php?add=ok");
    exit();
} else {
    header("Location: ../view/articles_list.php?add=error");
    exit();
}
