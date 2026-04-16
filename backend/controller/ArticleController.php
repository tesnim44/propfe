<?php 
include("../model/Article.php");

function addArticle($cnx,$data){

    $req = "INSERT INTO articles(authorId,title,body,category)
            VALUES('".$data['authorId']."','".$data['title']."','".$data['body']."','".$data['category']."')";

    return $cnx->query($req);
}

function getAllArticles($cnx){

    $res = $cnx->query("SELECT * FROM articles");

    $articles = [];

    foreach($res->fetchAll() as $row){
        $a = new Article($row['authorId'],$row['title'],$row['body'],$row['category']);
        $a->id = $row['id'];
        $articles[] = $a;
    }

    return $articles;
}

function deleteArticle($cnx,$id){
    return $cnx->query("DELETE FROM articles WHERE id='".$id."'");
}
?>
