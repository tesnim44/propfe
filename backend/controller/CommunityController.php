
<?php
class CommunityController {
    function addCommunity($cnx,$data){

    $req = "INSERT INTO communities(creatorId,name,description,icon,isPrivate,topics,memberCount,createdAt)
            VALUES('".$data['creatorId']."','".$data['name']."','".$data['description']."',
            '".$data['icon']."','".$data['isPrivate']."','".$data['topics']."','0',NOW())";

    return $cnx->query($req);
}
 
}
?>