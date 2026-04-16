
<?php

function sendMessage($cnx,$data){

    $req = "INSERT INTO messages(senderId,receiverId,body,isRead,createdAt)
            VALUES('".$data['senderId']."','".$data['receiverId']."','".$data['body']."','0',NOW())";

    return $cnx->query($req);
}

function getInbox($cnx,$userId){

    $res = $cnx->query("SELECT * FROM messages WHERE receiverId='".$userId."'");

    $messages = [];

    foreach($res->fetchAll() as $row){
        $m = new Message($row['senderId'],$row['receiverId'],$row['body']);
        $m->id = $row['id'];
        $messages[] = $m;
    }

    return $messages;
}
?>