<?php
include("../config/database.php");
include("../controller/traitement_article.php");

if(isset($_GET['id_article'])) {
    $id = $_GET['id_article'];
    $res = deleteArticle($cnx, $id);
    if($res) {
        header("location: ../view/articles_list.php?delete=ok");
    } else {
        header("location: ../view/articles_list.php?delete=error");
    }
} else {
    header("location: ../view/articles_list.php");
}
?>