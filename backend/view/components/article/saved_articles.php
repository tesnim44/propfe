<?php
session_start();
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/controller/SavedArticleController.php';

// Rediriger si non connecté
if (!isset($_SESSION['user_id'])) {
    header("Location: signup.php");
    exit();
}

$userId = (int) $_SESSION['user_id'];
$saved  = getSavedArticlesByUser($cnx, $userId);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mes articles sauvegardés</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .card-img-top    { height: 160px; object-fit: cover; }
        .img-placeholder { height: 160px; background: #f0f0f0;
                           display: flex; align-items: center;
                           justify-content: center;
                           color: #aaa; font-size: 2rem; }
    </style>
</head>
<body class="bg-light">

<!-- NAVBAR -->
<nav class="navbar navbar-dark bg-primary mb-4">
    <div class="container">
        <a class="navbar-brand fw-bold" href="articles_list.php">📝 IBlog</a>
        <span class="text-white fw-semibold">🔖 Mes sauvegardés</span>
    </div>
</nav>

<div class="container">

    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="fw-bold mb-0">
            Mes articles sauvegardés
            <span class="badge bg-secondary ms-2"><?= count($saved) ?></span>
        </h3>
        <a href="articles_list.php" class="btn btn-outline-secondary btn-sm">
            ← Retour aux articles
        </a>
    </div>

    <!-- État vide -->
    <?php if (empty($saved)): ?>
        <div class="card border-0 shadow-sm">
            <div class="card-body text-center py-5">
                <div style="font-size: 3rem;">🔖</div>
                <h5 class="mt-3 fw-bold">Aucun article sauvegardé</h5>
                <p class="text-muted">
                    Parcourez les articles et cliquez sur "Sauvegarder"
                </p>
                <a href="articles_list.php" class="btn btn-primary">
                    Parcourir les articles
                </a>
            </div>
        </div>

    <!-- Liste des sauvegardés -->
    <?php else: ?>
        <div class="row g-4">
            <?php foreach ($saved as $item): ?>
                <div class="col-sm-6 col-lg-4" id="card-<?= $item['savedId'] ?>">
                    <div class="card h-100 border-0 shadow-sm">

                        <!-- Image -->
                        <?php if (!empty($item['coverImage'])): ?>
                            <img src="<?= htmlspecialchars($item['coverImage']) ?>"
                                 class="card-img-top" alt="cover">
                        <?php else: ?>
                            <div class="img-placeholder rounded-top">🖼️</div>
                        <?php endif; ?>

                        <div class="card-body d-flex flex-column">

                            <!-- Catégorie -->
                            <?php if (!empty($item['category'])): ?>
                                <span class="badge bg-info text-dark mb-2 align-self-start">
                                    <?= htmlspecialchars($item['category']) ?>
                                </span>
                            <?php endif; ?>

                            <!-- Titre -->
                            <h6 class="card-title fw-bold">
                                <?= htmlspecialchars($item['title']) ?>
                            </h6>

                            <!-- Meta -->
                            <p class="text-muted small mb-2">
                                👤 <?= htmlspecialchars($item['author_name'] ?? 'Anonyme') ?>
                                &nbsp;·&nbsp;
                                <?php if (!empty($item['readingTime'])): ?>
                                    ⏱ <?= htmlspecialchars($item['readingTime']) ?>
                                    &nbsp;·&nbsp;
                                <?php endif; ?>
                                🔖 <?= date('d/m/Y', strtotime($item['savedAt'])) ?>
                            </p>

                            <!-- Extrait -->
                            <p class="card-text text-muted small flex-grow-1">
                                <?= htmlspecialchars(mb_substr($item['body'], 0, 90)) ?>...
                            </p>

                            <!-- Boutons -->
                            <div class="d-flex gap-2 mt-3">
                                <a href="article_detail.php?id=<?= $item['articleId'] ?>"
                                   class="btn btn-sm btn-outline-primary flex-fill">
                                    👁 Lire
                                </a>
                                <button class="btn btn-sm btn-outline-danger"
                                        onclick="unsave(<?= $item['savedId'] ?>, this)">
                                    🗑 Retirer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

</div>

<!-- Toast -->
<div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="toast" class="toast text-white border-0 align-items-center" role="alert">
        <div class="d-flex">
            <div class="toast-body" id="toastMsg"></div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast"></button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
function unsave(savedId, btn) {
    if (!confirm('Retirer cet article de vos sauvegardés ?')) return;

    btn.disabled = true;
    btn.textContent = '...';

    fetch('../controller/save_action.php', {
        method : 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body   : `action=unsave&savedId=${savedId}`
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Supprimer la carte avec une animation
            const card = document.getElementById('card-' + savedId);
            card.style.transition = 'opacity .3s';
            card.style.opacity    = '0';
            setTimeout(() => card.remove(), 300);
            showToast('Article retiré', 'bg-secondary');
        } else {
            btn.disabled    = false;
            btn.textContent = '🗑 Retirer';
            showToast('Erreur', 'bg-danger');
        }
    });
}

function showToast(msg, bgClass) {
    const el = document.getElementById('toast');
    el.className  = `toast text-white border-0 align-items-center ${bgClass}`;
    document.getElementById('toastMsg').textContent = msg;
    new bootstrap.Toast(el, { delay: 2000 }).show();
}
</script>
</body>
</html>
