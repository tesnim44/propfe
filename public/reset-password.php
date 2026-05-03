<?php
declare(strict_types=1);

$target = '../reset-password.php';
$query = (string) ($_SERVER['QUERY_STRING'] ?? '');
if ($query !== '') {
    $target .= '?' . $query;
}

header('Location: ' . $target, true, 302);
exit;
