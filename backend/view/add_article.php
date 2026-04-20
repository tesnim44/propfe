<?php
session_start();
// Vérifier si l'utilisateur est connecté (optionnel, rediriger si non)
if(!isset($_SESSION['email'])) {
    header("Location: signup.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ajouter un article</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-5">
    <div class="card shadow">
        <div class="card-header bg-primary text-white">
            <h3>Nouvel article</h3>
        </div>
        <div class="card-body">
            <form action="../controller/add_article.php" method="POST">
                <label>Titre</label>
                <input type="text" name="title" class="form-control mb-3" required>

                <label>Contenu</label>
                <textarea name="body" class="form-control mb-3" rows="8" required></textarea>

                <label>Catégorie</label>
                <input type="text" name="category" class="form-control mb-3">

                <label>Tags (séparés par des virgules)</label>
                <input type="text" name="tags" class="form-control mb-3">

                <label>Statut</label>
                <select name="status" class="form-select mb-3">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                </select>

                <label>URL de l'image de couverture</label>
                <input type="text" name="coverImage" class="form-control mb-3">

                <label>Temps de lecture (ex: 5 min)</label>
                <input type="text" name="readingTime" class="form-control mb-3">

                <label>Label (optionnel)</label>
                <input type="text" name="label" class="form-control mb-3">

                <button type="submit" class="btn btn-success">Publier l'article</button>
                <a href="articles_list.php" class="btn btn-secondary">Annuler</a>
            </form>
        </div>
    </div>
</div>
</body>
</html>