<?php
function saveArticle($cnx,$data){

    $req = "INSERT INTO saved_articles(userId,articleId,note,collection,isPinned,savedAt)
            VALUES('".$data['userId']."','".$data['articleId']."','".$data['note']."',
            '".$data['collection']."','".$data['isPinned']."',NOW())";

    return $cnx->query($req);
}
?>