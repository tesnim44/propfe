<?php
function joinCommunity($cnx,$data){

    $req = "INSERT INTO community_members(communityId,userId,role,isBanned,notificationsOn,joinedAt)
            VALUES('".$data['communityId']."','".$data['userId']."','".$data['role']."',
            '".$data['isBanned']."','".$data['notificationsOn']."',NOW())";

    return $cnx->query($req);
}
?>