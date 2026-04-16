<?php
function addSubscription($cnx,$data){

    $req = "INSERT INTO subscriptions(userId,plan,amount,currency,status,promoCode,startedAt,expiresAt)
            VALUES('".$data['userId']."','".$data['plan']."','".$data['amount']."','".$data['currency']."',
            '".$data['status']."','".$data['promoCode']."',NOW(),DATE_ADD(NOW(),INTERVAL 30 DAY))";

    return $cnx->query($req);
}
?>