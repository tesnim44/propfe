<?php
session_start();
include("../config/database.php");
include("../controller/ArticleController.php");
include("../controller/savedArticleController.php");

if (!isset($_GET['id'])) {
    header("Location: articles_list.php");
    exit();
}

$article = getArticleById($cnx, (int)$_GET['id']);
if (!$article) {
    echo "Article introuvable";
    exit();
}

// Incrémenter les vues
$req = $cnx->prepare("UPDATE article SET views = views + 1 WHERE id = :id");
$req->execute([':id' => $article->id]);
$article->views++;

// Vérifier si déjà sauvegardé
$isSaved = false;
$savedId = null;
if (isset($_SESSION['user_id'])) {
    $isSaved = isArticleSaved($cnx, (int)$_SESSION['user_id'], $article->id);
    if ($isSaved) {
        $savedId = getSavedId($cnx, (int)$_SESSION['user_id'], $article->id);
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($article->title) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<nav class="navbar navbar-dark bg-primary mb-4">
    <div class="container">
        <a class="navbar-brand fw-bold" href="articles_list.php">📝 IBlog</a>
        <?php if (isset($_SESSION['user_id'])): ?>
            <a href="saved_articles.php" class="btn btn-outline-light btn-sm">
                🔖 Mes sauvegardés
            </a>
        <?php endif; ?>
    </div>
</nav>

<div class="container" style="max-width: 800px;">

    <!-- Image de couverture -->
    <?php if (!empty($article->coverImage)): ?>
        <img src="<?= htmlspecialchars($article->coverImage) ?>"
             class="img-fluid rounded mb-4 w-100"
             style="max-height:400px; object-fit:cover;"
             alt="cover">
    <?php endif; ?>

    <!-- Titre + bouton sauvegarder -->
    <div class="d-flex justify-content-between align-items-start mb-2 gap-3">
        <h1 class="fw-bold fs-2"><?= htmlspecialchars($article->title) ?></h1>

        <!-- BOUTON SAUVEGARDER -->
        <?php if (isset($_SESSION['user_id'])): ?>
            <button id="saveBtn"
                    data-article-id="<?= $article->id ?>"
                    data-saved-id="<?= $savedId ?? '' ?>"
                    data-is-saved="<?= $isSaved ? '1' : '0' ?>"
                    onclick="toggleSave(this)"
                    class="btn btn-sm flex-shrink-0
                           <?= $isSaved ? 'btn-warning' : 'btn-outline-warning' ?>">
                <?= $isSaved ? '🔖 Sauvegardé' : '🔖 Sauvegarder' ?>
            </button>
        <?php else: ?>
            <a href="signup.php" class="btn btn-sm btn-outline-warning flex-shrink-0">
                🔖 Sauvegarder
            </a>
        <?php endif; ?>
    </div>

    <!-- Meta -->
    <p class="text-muted small mb-4">
        👤 <?= htmlspecialchars($article->author_name ?? 'Anonyme') ?>
        &nbsp;·&nbsp;
        📅 <?= date('d/m/Y', strtotime($article->createdAt)) ?>
        &nbsp;·&nbsp;
        👁 <?= $article->views ?> vues
        <?php if (!empty($article->readingTime)): ?>
            &nbsp;·&nbsp; ⏱ <?= htmlspecialchars($article->readingTime) ?>
        <?php endif; ?>
        <?php if (!empty($article->category)): ?>
            &nbsp;·&nbsp;
            <span class="badge bg-info text-dark">
                <?= htmlspecialchars($article->category) ?>
            </span>
        <?php endif; ?>
    </p>

    <!-- Contenu -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4 lh-lg">
            <?= nl2br(htmlspecialchars($article->body)) ?>
        </div>
    </div>

    <!-- Toast notification -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="saveToast" class="toast align-items-center border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body" id="toastMsg">Article sauvegardé !</div>
                <button type="button" class="btn-close me-2 m-auto"
                        data-bs-dismiss="toast"></button>
            </div>
        </div>
    </div>

    <a href="articles_list.php" class="btn btn-outline-secondary">← Retour</a>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
function toggleSave(btn) {
    const articleId = btn.dataset.articleId;
    const savedId   = btn.dataset.savedId;
    const isSaved   = btn.dataset.isSaved === '1';

    const body = isSaved
        ? `action=unsave&savedId=${savedId}`
        : `action=save&articleId=${articleId}`;

    fetch('../controller/save_action.php', {
        method : 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body   : body
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            if (isSaved) {
                // Passer à "non sauvegardé"
                btn.classList.replace('btn-warning', 'btn-outline-warning');
                btn.textContent      = '🔖 Sauvegarder';
                btn.dataset.isSaved  = '0';
                btn.dataset.savedId  = '';
                showToast('Article retiré des sauvegardés', 'bg-secondary');
            } else {
                // Passer à "sauvegardé"
                btn.classList.replace('btn-outline-warning', 'btn-warning');
                btn.textContent      = '🔖 Sauvegardé';
                btn.dataset.isSaved  = '1';
                showToast('Article sauvegardé !', 'bg-success');
            }
        } else {
            showToast(data.message ?? 'Erreur', 'bg-danger');
        }
    })
    .catch(() => showToast('Erreur réseau', 'bg-danger'));
}

function showToast(msg, bgClass) {
    const toastEl = document.getElementById('saveToast');
    const toastMsg = document.getElementById('toastMsg');
    toastEl.className = `toast align-items-center text-white border-0 ${bgClass}`;
    toastMsg.textContent = msg;
    new bootstrap.Toast(toastEl, { delay: 2500 }).show();
}
</script>
</body>
</html>