<?php
include("../config/database.php");
include("../controller/traitement_article.php");

if(isset($_POST['id_article'])) {
    $data = [
        'id'          => $_POST['id_article'],
        'title'       => $_POST['title'],
        'body'        => $_POST['body'],
        'category'    => $_POST['category'] ?? '',
        'tags'        => $_POST['tags'] ?? '',
        'status'      => $_POST['status'] ?? 'draft',
        'coverImage'  => $_POST['coverImage'] ?? '',
        'readingTime' => $_POST['readingTime'] ?? '',
        'label'       => $_POST['label'] ?? 'none'
    ];
    
    $res = updateArticle($cnx, $data);
    if($res) {
        header("location: ../view/articles_list.php?modif=ok");
    } else {
        header("location: ../view/articles_list.php?modif=error");
    }
} else {
    header("location: ../view/articles_list.php");
}
?>