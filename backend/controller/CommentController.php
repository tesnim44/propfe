<?php 
function addComment($cnx,$data){

    $req = "INSERT INTO comments(articleId,userId,body,parentId,likesCount,isFlagged,createdAt)
            VALUES('".$data['articleId']."','".$data['userId']."','".$data['body']."',
            '".$data['parentId']."','0','0',NOW())";

    return $cnx->query($req);
}

function getCommentsByArticle($cnx,$articleId){

    $res = $cnx->query("SELECT * FROM comments WHERE articleId='".$articleId."'");

    $comments = [];

    foreach($res->fetchAll() as $row){
        $c = new Comment($row['articleId'],$row['userId'],$row['body']);
        $c->id = $row['id'];
        $comments[] = $c;
    }

    return $comments;
}
?>