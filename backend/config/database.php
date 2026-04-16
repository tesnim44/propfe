<?php
// config/database.php

$host = "localhost";
$dbname = "iblog";
$user = "root";
$pass = "";

try {
    $cnx = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $cnx->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    die("Erreur DB: " . $e->getMessage());
}