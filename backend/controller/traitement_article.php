<?php
include("../config/database.php");
include("../model/Article.php");

// Ajouter un article
function addArticle($cnx, $data) {
    $req = $cnx->prepare("INSERT INTO article(authorId, title, body, category, tags, status, coverImage, readingTime, label, likesCount, views)
                          VALUES (:authorId, :title, :body, :category, :tags, :status, :coverImage, :readingTime, :label, 0, 0)");
    $res = $req->execute([
        ':authorId'    => $data['authorId'],
        ':title'       => $data['title'],
        ':body'        => $data['body'],
        ':category'    => $data['category'],
        ':tags'        => $data['tags'],
        ':status'      => $data['status'],
        ':coverImage'  => $data['coverImage'],
        ':readingTime' => $data['readingTime'],
        ':label'       => $data['label']
    ]);
    return $res;
}

// Récupérer tous les articles (avec nom de l'auteur)
function getAllArticles($cnx) {
    $req = $cnx->prepare("SELECT article.*, users.nom as author_name 
                          FROM article 
                          LEFT JOIN users ON article.authorId = users.id 
                          ORDER BY article.createdAt DESC");
    $req->execute();
    $rows = $req->fetchAll();
    $articles = [];
    foreach($rows as $row) {
        $article = new Article(
            $row['authorId'], $row['title'], $row['body'], $row['category'],
            $row['tags'], $row['status'], $row['coverImage'], $row['readingTime'], $row['label']
        );
        $article->id = $row['id'];
        $article->likesCount = $row['likesCount'];
        $article->views = $row['views'];
        $article->createdAt = $row['createdAt'];
        $article->author_name = $row['author_name'];
        $articles[] = $article;
    }
    return $articles;
}

// Récupérer un article par son id
function getArticleById($cnx, $id) {
    $req = $cnx->prepare("SELECT article.*, users.nom as author_name 
                          FROM article 
                          LEFT JOIN users ON article.authorId = users.id 
                          WHERE article.id = :id");
    $req->execute([':id' => $id]);
    $row = $req->fetch();
    if($row) {
        $article = new Article(
            $row['authorId'], $row['title'], $row['body'], $row['category'],
            $row['tags'], $row['status'], $row['coverImage'], $row['readingTime'], $row['label']
        );
        $article->id = $row['id'];
        $article->likesCount = $row['likesCount'];
        $article->views = $row['views'];
        $article->createdAt = $row['createdAt'];
        $article->author_name = $row['author_name'];
        return $article;
    }
    return null;
}

// Mettre à jour un article
function updateArticle($cnx, $data) {
    $req = $cnx->prepare("UPDATE article 
                          SET title = :title,
                              body = :body,
                              category = :category,
                              tags = :tags,
                              status = :status,
                              coverImage = :coverImage,
                              readingTime = :readingTime,
                              label = :label
                          WHERE id = :id");
    $res = $req->execute([
        ':id'          => $data['id'],
        ':title'       => $data['title'],
        ':body'        => $data['body'],
        ':category'    => $data['category'],
        ':tags'        => $data['tags'],
        ':status'      => $data['status'],
        ':coverImage'  => $data['coverImage'],
        ':readingTime' => $data['readingTime'],
        ':label'       => $data['label']
    ]);
    return $res;
}

// Supprimer un article
function deleteArticle($cnx, $id) {
    $req = $cnx->prepare("DELETE FROM article WHERE id = :id");
    return $req->execute([':id' => $id]);
}

// Rechercher des articles par titre ou contenu
function searchArticles($cnx, $keyword) {
    $req = $cnx->prepare("SELECT article.*, users.nom as author_name 
                          FROM article 
                          LEFT JOIN users ON article.authorId = users.id
                          WHERE article.title LIKE :kw OR article.body LIKE :kw
                          ORDER BY article.createdAt DESC");
    $req->execute([':kw' => '%' . $keyword . '%']);
    $rows = $req->fetchAll();
    $articles = [];
    foreach($rows as $row) {
        $article = new Article(
            $row['authorId'], $row['title'], $row['body'], $row['category'],
            $row['tags'], $row['status'], $row['coverImage'], $row['readingTime'], $row['label']
        );
        $article->id = $row['id'];
        $article->likesCount = $row['likesCount'];
        $article->views = $row['views'];
        $article->createdAt = $row['createdAt'];
        $article->author_name = $row['author_name'];
        $articles[] = $article;
    }
    return $articles;
}
?>