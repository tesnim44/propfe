<?php
include("../config/database.php");
include("../controller/traitement_article.php");
session_start();

// Récupérer l'id de l'utilisateur connecté
if(!isset($_SESSION['user_id']) && isset($_SESSION['email'])) {
    // Si vous avez seulement l'email en session, récupérez l'id depuis la table users
    $req = $cnx->prepare("SELECT id FROM users WHERE email = :email");
    $req->execute([':email' => $_SESSION['email']]);
    $user = $req->fetch();
    if($user) {
        $_SESSION['user_id'] = $user['id'];
    } else {
        header("Location: ../view/signup.php");
        exit();
    }
}
$authorId = $_SESSION['user_id'] ?? 1; // temporaire

if(isset($_POST['title'])) {
    $data = [
        'authorId'    => $authorId,
        'title'       => $_POST['title'],
        'body'        => $_POST['body'],
        'category'    => $_POST['category'] ?? '',
        'tags'        => $_POST['tags'] ?? '',
        'status'      => $_POST['status'] ?? 'draft',
        'coverImage'  => $_POST['coverImage'] ?? '',
        'readingTime' => $_POST['readingTime'] ?? '',
        'label'       => $_POST['label'] ?? 'none'
    ];
    
    $res = addArticle($cnx, $data);
    if($res) {
        header("location: ../view/articles_list.php?add=ok");
    } else {
        header("location: ../view/articles_list.php?add=error");
    }
} else {
    header("location: ../view/add_article.php");
}
?>