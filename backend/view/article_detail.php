<?php
include("../controller/traitement_article.php");
if(!isset($_GET['id'])) {
    header("Location: articles_list.php");
    exit();
}
$article = getArticleById($cnx, $_GET['id']);
if(!$article) {
    echo "Article introuvable";
    exit();
}
// Incrémenter le compteur de vues
$req = $cnx->prepare("UPDATE article SET views = views + 1 WHERE id = :id");
$req->execute([':id' => $article->id]);
$article->views++;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($article->title) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-5">
    <h1><?= htmlspecialchars($article->title) ?></h1>
    <p class="text-muted">
        Par <?= htmlspecialchars($article->author_name ?? 'Anonyme') ?> | 
        <?= $article->createdAt ?> | 
        <?= $article->views ?> vues | 
        <?= $article->readingTime ?>
    </p>
    <?php if($article->coverImage): ?>
        <img src="<?= htmlspecialchars($article->coverImage) ?>" class="img-fluid mb-4" style="max-height:400px; width:100%; object-fit:cover">
    <?php endif; ?>
    <div class="content">
        <?= nl2br(htmlspecialchars($article->body)) ?>
    </div>
    <a href="articles_list.php" class="btn btn-secondary mt-4">← Retour à la liste</a>
</div>
</body>
</html>