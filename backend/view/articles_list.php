<?php 
include("../controller/traitement_article.php");

// Messages
$successAdd    = isset($_GET['add']) && $_GET['add'] == 'ok';
$successUpdate = isset($_GET['modif']) && $_GET['modif'] == 'ok';
$successDelete = isset($_GET['delete']) && $_GET['delete'] == 'ok';
$errorDelete   = isset($_GET['delete']) && $_GET['delete'] == 'error';

// Recherche
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $articles = searchArticles($cnx, $_GET['search']);
} else {
    $articles = getAllArticles($cnx);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Articles List</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .card-img-top { height: 150px; object-fit: cover; }
    </style>
</head>
<body>

<!-- TOASTS -->
<div class="toast-container position-fixed top-0 end-0 p-3">
    <?php if($successAdd): ?>
        <div class="toast text-bg-success border-0 show">
            <div class="d-flex"><div class="toast-body">Article ajouté avec succès</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
        </div>
    <?php endif; ?>
    <?php if($successUpdate): ?>
        <div class="toast text-bg-success border-0 show">
            <div class="d-flex"><div class="toast-body">Article modifié avec succès</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
        </div>
    <?php endif; ?>
    <?php if($successDelete): ?>
        <div class="toast text-bg-success border-0 show">
            <div class="d-flex"><div class="toast-body">Article supprimé avec succès</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
        </div>
    <?php endif; ?>
    <?php if($errorDelete): ?>
        <div class="toast text-bg-danger border-0 show">
            <div class="d-flex"><div class="toast-body">Erreur lors de la suppression</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
        </div>
    <?php endif; ?>
</div>

<div class="container mt-4">
    <h1 class="text-center mb-4">Gestion des Articles</h1>

    <!-- Barre de recherche + bouton ajouter -->
    <div class="d-flex justify-content-between mb-3">
        <form method="GET" class="d-flex w-50">
            <input type="text" class="form-control me-2" name="search" placeholder="Rechercher par titre ou contenu..."
                   value="<?= isset($_GET['search']) ? htmlspecialchars($_GET['search']) : '' ?>">
            <button class="btn btn-outline-primary">Rechercher</button>
        </form>
        <a href="add_article.php" class="btn btn-success">+ Nouvel article</a>
    </div>

    <!-- Liste des articles sous forme de cartes (ou tableau, selon votre goût) -->
    <div class="row">
        <?php foreach($articles as $article): ?>
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm">
                    <?php if($article->coverImage): ?>
                        <img src="<?= htmlspecialchars($article->coverImage) ?>" class="card-img-top" alt="cover">
                    <?php else: ?>
                        <div class="card-img-top bg-secondary d-flex align-items-center justify-content-center" style="height:150px;">
                            <span class="text-white">Pas d'image</span>
                        </div>
                    <?php endif; ?>
                    <div class="card-body">
                        <h5 class="card-title"><?= htmlspecialchars($article->title) ?></h5>
                        <p class="card-text text-muted small">
                            Par <?= htmlspecialchars($article->author_name ?? 'Inconnu') ?> | 
                            <?= $article->createdAt ?> | 
                            <?= $article->views ?> vues
                        </p>
                        <p class="card-text"><?= htmlspecialchars(substr($article->body, 0, 100)) ?>...</p>
                        <div class="d-flex justify-content-between">
                            <a href="article_detail.php?id=<?= $article->id ?>" class="btn btn-sm btn-info">Lire</a>
                            <div>
                                <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editModal<?= $article->id ?>">Modifier</button>
                                <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#deleteModal<?= $article->id ?>">Supprimer</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODALE ÉDITION -->
            <div class="modal fade" id="editModal<?= $article->id ?>" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modifier l'article</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form action="../controller/update_article.php" method="POST">
                            <div class="modal-body">
                                <input type="hidden" name="id_article" value="<?= $article->id ?>">
                                <label>Titre</label>
                                <input type="text" name="title" class="form-control mb-2" value="<?= htmlspecialchars($article->title) ?>" required>
                                <label>Contenu</label>
                                <textarea name="body" class="form-control mb-2" rows="5"><?= htmlspecialchars($article->body) ?></textarea>
                                <label>Catégorie</label>
                                <input type="text" name="category" class="form-control mb-2" value="<?= htmlspecialchars($article->category) ?>">
                                <label>Tags (séparés par des virgules)</label>
                                <input type="text" name="tags" class="form-control mb-2" value="<?= htmlspecialchars($article->tags) ?>">
                                <label>Statut</label>
                                <select name="status" class="form-select mb-2">
                                    <option value="draft" <?= $article->status == 'draft' ? 'selected' : '' ?>>Brouillon</option>
                                    <option value="published" <?= $article->status == 'published' ? 'selected' : '' ?>>Publié</option>
                                    <option value="archived" <?= $article->status == 'archived' ? 'selected' : '' ?>>Archivé</option>
                                </select>
                                <label>URL de l'image de couverture</label>
                                <input type="text" name="coverImage" class="form-control mb-2" value="<?= htmlspecialchars($article->coverImage) ?>">
                                <label>Temps de lecture (ex: 5 min)</label>
                                <input type="text" name="readingTime" class="form-control mb-2" value="<?= htmlspecialchars($article->readingTime) ?>">
                                <label>Label</label>
                                <input type="text" name="label" class="form-control" value="<?= htmlspecialchars($article->label) ?>">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                <button type="submit" class="btn btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- MODALE SUPPRESSION -->
            <div class="modal fade" id="deleteModal<?= $article->id ?>" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Confirmation</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <p>Voulez-vous vraiment supprimer l'article <strong><?= htmlspecialchars($article->title) ?></strong> ?</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <a href="../controller/delete_article.php?id_article=<?= $article->id ?>" class="btn btn-danger">Supprimer</a>
                        </div>
                    </div>
                </div>
            </div>

        <?php endforeach; ?>
        <?php if(empty($articles)): ?>
            <div class="col-12"><p class="text-center">Aucun article trouvé.</p></div>
        <?php endif; ?>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    setTimeout(() => {
        document.querySelectorAll('.toast').forEach(t => t.classList.remove('show'));
    }, 3000);
    if (window.history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.delete('add');
        url.searchParams.delete('modif');
        url.searchParams.delete('delete');
        window.history.replaceState({}, document.title, url.pathname);
    }
</script>
</body>
</html>