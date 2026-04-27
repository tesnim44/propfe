<?php
session_start();
if (!isset($_SESSION['email'])) {
    header("Location: signup.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouvel article</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container mt-5" style="max-width: 750px;">

    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold">✏️ Nouvel article</h2>
        <a href="articles_list.php" class="btn btn-outline-secondary btn-sm">← Retour</a>
    </div>

    <!-- Carte formulaire -->
    <div class="card shadow-sm border-0">
        <div class="card-body p-4">

            <!--
                IMPORTANT : enctype="multipart/form-data"
                Sans ça, PHP ne reçoit JAMAIS les fichiers uploadés
                $_FILES sera toujours vide
            -->
            <form action="../controller/add_article.php" 
                  method="POST" 
                  enctype="multipart/form-data">

                <!-- Titre -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">Titre <span class="text-danger">*</span></label>
                    <input type="text" name="title" class="form-control" 
                           placeholder="Titre de votre article" required>
                </div>

                <!-- Contenu -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">Contenu <span class="text-danger">*</span></label>
                    <textarea name="body" class="form-control" rows="8" 
                              placeholder="Écrivez votre article ici..." required></textarea>
                </div>

                <!-- Catégorie + Tags côte à côte -->
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Catégorie</label>
                        <input type="text" name="category" class="form-control" 
                               placeholder="ex: Technologie">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Tags</label>
                        <input type="text" name="tags" class="form-control" 
                               placeholder="php, web, tutorial">
                    </div>
                </div>

                <!-- Statut + Temps de lecture côte à côte -->
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Statut</label>
                        <select name="status" class="form-select">
                            <option value="draft">📝 Brouillon</option>
                            <option value="published">✅ Publié</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Temps de lecture</label>
                        <input type="text" name="readingTime" class="form-control" 
                               placeholder="ex: 5 min">
                    </div>
                </div>

                <!-- IMAGE DE COUVERTURE -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">Image de couverture</label>

                    <!-- Option 1 : Upload depuis l'ordinateur -->
                    <input type="file" 
                           name="coverImage" 
                           class="form-control mb-2" 
                           accept="image/jpeg,image/png,image/webp,image/gif"
                           id="fileInput"
                           onchange="previewImage(this)">

                    <!-- Prévisualisation avant envoi -->
                    <div id="preview" class="mt-2" style="display:none;">
                        <p class="text-muted small mb-1">Aperçu :</p>
                        <img id="previewImg" src="" alt="aperçu" 
                             class="img-thumbnail" style="max-height:200px;">
                    </div>

                    <div class="text-center text-muted my-2">— ou —</div>

                    <!-- Option 2 : Coller une URL -->
                    <input type="text" 
                           name="coverImage_url" 
                           class="form-control" 
                           placeholder="https://exemple.com/image.jpg">
                </div>

                <!-- Label -->
                <div class="mb-4">
                    <label class="form-label fw-semibold">Label</label>
                    <select name="label" class="form-select">
                        <option value="none">Aucun</option>
                        <option value="featured">⭐ Featured</option>
                        <option value="trending">🔥 Trending</option>
                        <option value="new">🆕 New</option>
                    </select>
                </div>

                <!-- Boutons -->
                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-success px-4">
                        🚀 Publier l'article
                    </button>
                    <a href="articles_list.php" class="btn btn-outline-secondary px-4">
                        Annuler
                    </a>
                </div>

            </form>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Prévisualisation de l'image avant upload
function previewImage(input) {
    const preview = document.getElementById('preview');
    const img     = document.getElementById('previewImg');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            img.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
</script>
</body>
</html>