<?php
session_start();
require_once dirname(__DIR__) . '/config/database.php';
require_once __DIR__ . '/SavedArticleController.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit();
}

$userId    = (int) $_SESSION['user_id'];
$action    = $_POST['action'] ?? '';
$articleId = (int) ($_POST['articleId'] ?? 0);

switch ($action) {

    case 'save':
        $result = saveArticle($cnx, $userId, $articleId);
        echo json_encode($result);
        break;

    case 'unsave':
        $savedId = (int) ($_POST['savedId'] ?? 0);
        $ok      = unsaveArticle($cnx, $savedId, $userId);
        echo json_encode(['success' => $ok]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
}
exit();
