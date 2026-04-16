<?php
include("../config/database.php");
include("../model/User.php");

function addUser($cnx,$data){

    $password = password_hash($data['password'], PASSWORD_DEFAULT);

    $req = "INSERT INTO users(name,email,password,plan,isPremium,isAdmin,avatarUrl,createdAt)
            VALUES('".$data['name']."','".$data['email']."','".$password."',
            '".$data['plan']."','".$data['isPremium']."','".$data['isAdmin']."',
            '".$data['avatarUrl']."',NOW())";

    return $cnx->query($req);
}
function getAllUsers($cnx){

    $req = "SELECT * FROM users";
    $res = $cnx->query($req);

    $users = [];

    foreach($res->fetchAll() as $row){
        $user = new User($row['name'],$row['email'],$row['password']);
        $user->id = $row['id'];
        $users[] = $user;
    }

    return $users;
}

function deleteUser($cnx,$id){
    return $cnx->query("DELETE FROM users WHERE id='".$id."'");
}