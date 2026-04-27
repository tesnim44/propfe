<?php
session_start();
include("../config/database.php");
include("../controller/ArticleController.php");

// Messages flash
$successAdd    = isset($_GET['add'])    && $_GET['add']    === 'ok';
$addError      = isset($_GET['add'])    && $_GET['add']    === 'error';
$successUpdate = isset($_GET['modif'])  && $_GET['modif']  === 'ok';
$successDelete = isset($_GET['delete']) && $_GET['delete'] === 'ok';

// Recherche ou liste complète
if (!empty($_GET['search'])) {
    $articles = searchArticles($cnx, $_GET['search']);
} else {
    $articles = getAllArticles($cnx);
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Articles</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .card-img-top  { height: 180px; object-fit: cover; }
        .img-placeholder { height: 180px; background: #e9ecef; 
                           display:flex; align-items:center; 
                           justify-content:center; color:#adb5bd; font-size:2rem; }
        .badge-status-published { background-color: #198754; }
        .badge-status-draft     { background-color: #6c757d; }
        .badge-status-archived  { background-color: #fd7e14; }
    </style>
</head>
<body class="bg-light">

<!-- NAVBAR -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
    <div class="container">
        <a class="navbar-brand fw-bold" href="#">📝 IBlog Admin</a>
        <div class="ms-auto">
            <a href="add_article.php" class="btn btn-light btn-sm">+ Nouvel article</a>
        </div>
    </div>
</nav>

<!-- TOASTS (notifications) -->
<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index:9999">
    <?php if ($successAdd): ?>
        <div class="toast text-bg-success border-0 show align-items-center">
            <div class="d-flex">
                <div class="toast-body">✅ Article ajouté avec succès !</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    <?php endif; ?>
    <?php if ($addError): ?>
        <div class="toast text-bg-danger border-0 show align-items-center">
            <div class="d-flex">
                <div class="toast-body">❌ Erreur lors de l'ajout.</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    <?php endif; ?>
    <?php if ($successUpdate): ?>
        <div class="toast text-bg-success border-0 show align-items-center">
            <div class="d-flex">
                <div class="toast-body">✅ Article modifié avec succès !</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    <?php endif; ?>
    <?php if ($successDelete): ?>
        <div class="toast text-bg-success border-0 show align-items-center">
            <div class="d-flex">
                <div class="toast-body">🗑️ Article supprimé.</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    <?php endif; ?>
</div>

<div class="container">

    <!-- Titre + barre de recherche -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h3 class="fw-bold mb-0">
            Tous les articles 
            <span class="badge bg-secondary"><?= count($articles) ?></span>
        </h3>
        <form method="GET" class="d-flex gap-2" style="min-width:300px;">
            <input type="text" name="search" class="form-control" 
                   placeholder="🔍 Rechercher..."
                   value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
            <button class="btn btn-outline-primary">Go</button>
            <?php if (!empty($_GET['search'])): ?>
                <a href="articles_list.php" class="btn btn-outline-secondary">✕</a>
            <?php endif; ?>
        </form>
    </div>

    <!-- Grille d'articles -->
    <?php if (empty($articles)): ?>
        <div class="text-center py-5">
            <p class="text-muted fs-5">Aucun article trouvé.</p>
            <a href="add_article.php" class="btn btn-primary">Créer le premier article</a>
        </div>
    <?php else: ?>
        <div class="row g-4">
            <?php foreach ($articles as $article): ?>
                <div class="col-sm-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0">

                        <!-- Image ou placeholder -->
                        <?php if (!empty($article->coverImage)): ?>
                            <img src="<?= htmlspecialchars($article->coverImage) ?>"
                                 class="card-img-top" alt="cover">
                        <?php else: ?>
                            <div class="img-placeholder rounded-top">🖼️</div>
                        <?php endif; ?>

                        <div class="card-body d-flex flex-column">

                            <!-- Badge statut -->
                            <div class="mb-2">
                                <span class="badge badge-status-<?= $article->status ?>">
                                    <?= ucfirst($article->status) ?>
                                </span>
                                <?php if (!empty($article->category)): ?>
                                    <span class="badge bg-info text-dark ms-1">
                                        <?= htmlspecialchars($article->category) ?>
                                    </span>
                                <?php endif; ?>
                            </div>

                            <!-- Titre -->
                            <h5 class="card-title fw-bold">
                                <?= htmlspecialchars($article->title) ?>
                            </h5>

                            <!-- Meta -->
                            <p class="text-muted small mb-2">
                                👤 <?= htmlspecialchars($article->author_name ?? 'Inconnu') ?>
                                &nbsp;·&nbsp;
                                📅 <?= date('d/m/Y', strtotime($article->createdAt)) ?>
                                &nbsp;·&nbsp;
                                👁 <?= $article->views ?> vues
                            </p>

                            <!-- Extrait -->
                            <p class="card-text text-muted flex-grow-1">
                                <?= htmlspecialchars(mb_substr($article->body, 0, 100)) ?>...
                            </p>

                            <!-- Boutons d'action -->
                            <div class="d-flex gap-2 mt-3">
                                <a href="article_detail.php?id=<?= $article->id ?>" 
                                   class="btn btn-sm btn-outline-primary flex-fill">
                                    👁 Lire
                                </a>
                                <button class="btn btn-sm btn-outline-warning flex-fill"
                                        data-bs-toggle="modal" 
                                        data-bs-target="#editModal<?= $article->id ?>">
                                    ✏️ Modifier
                                </button>
                                <button class="btn btn-sm btn-outline-danger"
                                        data-bs-toggle="modal" 
                                        data-bs-target="#deleteModal<?= $article->id ?>">
                                    🗑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── MODALE ÉDITION ── -->
                <div class="modal fade" id="editModal<?= $article->id ?>" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header bg-warning">
                                <h5 class="modal-title">✏️ Modifier l'article</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <form action="../controller/update_article.php" method="POST">
                                <div class="modal-body">
                                    <input type="hidden" name="id_article" value="<?= $article->id ?>">

                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">Titre</label>
                                        <input type="text" name="title" class="form-control"
                                               value="<?= htmlspecialchars($article->title) ?>" required>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">Contenu</label>
                                        <textarea name="body" class="form-control" rows="6"><?= htmlspecialchars($article->body) ?></textarea>
                                    </div>

                                    <div class="row g-3 mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label fw-semibold">Catégorie</label>
                                            <input type="text" name="category" class="form-control"
                                                   value="<?= htmlspecialchars($article->category) ?>">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label fw-semibold">Tags</label>
                                            <input type="text" name="tags" class="form-control"
                                                   value="<?= htmlspecialchars($article->tags) ?>">
                                        </div>
                                    </div>

                                    <div class="row g-3 mb-3">
                                        <div class="col-md-4">
                                            <label class="form-label fw-semibold">Statut</label>
                                            <select name="status" class="form-select">
                                                <option value="draft"     <?= $article->status==='draft'     ? 'selected':'' ?>>Brouillon</option>
                                                <option value="published" <?= $article->status==='published' ? 'selected':'' ?>>Publié</option>
                                                <option value="archived"  <?= $article->status==='archived'  ? 'selected':'' ?>>Archivé</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label fw-semibold">Temps de lecture</label>
                                            <input type="text" name="readingTime" class="form-control"
                                                   value="<?= htmlspecialchars($article->readingTime) ?>">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label fw-semibold">Label</label>
                                            <input type="text" name="label" class="form-control"
                                                   value="<?= htmlspecialchars($article->label) ?>">
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">URL image de couverture</label>
                                        <input type="text" name="coverImage" class="form-control"
                                               value="<?= htmlspecialchars($article->coverImage) ?>">
                                    </div>

                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                    <button type="submit" class="btn btn-warning">💾 Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- ── MODALE SUPPRESSION ── -->
                <div class="modal fade" id="deleteModal<?= $article->id ?>" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title">🗑️ Confirmer la suppression</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-center py-4">
                                <p class="fs-5">Supprimer <strong>«&nbsp;<?= htmlspecialchars($article->title) ?>&nbsp;»</strong> ?</p>
                                <p class="text-muted small">Cette action est irréversible.</p>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                <a href="../controller/delete_article.php?id_article=<?= $article->id ?>"
                                   class="btn btn-danger">Oui, supprimer</a>
                            </div>
                        </div>
                    </div>
                </div>

            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Auto-hide toasts après 3s
    setTimeout(() => {
        document.querySelectorAll('.toast').forEach(t => {
            new bootstrap.Toast(t, { delay: 100 }).hide();
        });
    }, 3000);

    // Nettoyer les params GET de l'URL (évite le re-toast au refresh)
    if (window.history.replaceState) {
        const url = new URL(window.location);
        ['add','modif','delete'].forEach(p => url.searchParams.delete(p));
        window.history.replaceState({}, document.title, url.toString());
    }
</script>
</body>
</html>