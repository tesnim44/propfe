<?php
/**
 * search-index.php
 * Location : iblog/backend/view/components/auth/search-index.php
 * Retourne les résultats de recherche (articles + utilisateurs) depuis la BDD.
 */
declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function jsonOk(array $data = []): never
{
    echo json_encode(['ok' => true] + $data);
    exit();
}

function jsonErr(string $msg, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Méthode non autorisée', 405);

    $thisDir     = str_replace('\\', '/', __DIR__);
    $parts       = explode('/', $thisDir);
    $backendPath = implode('/', array_slice($parts, 0, count($parts) - 3));

    if (!file_exists($backendPath . '/config/database.php')) {
        jsonErr('Config introuvable : ' . $backendPath, 500);
    }
    require_once $backendPath . '/config/database.php';

    $raw   = (string) file_get_contents('php://input');
    $body  = json_decode($raw ?: '{}', true) ?? [];
    $q     = trim((string) ($body['q']     ?? ''));
    $limit = min((int) ($body['limit'] ?? 10), 30);

    if (strlen($q) < 1) jsonErr('Requête trop courte.');

    $like = '%' . $q . '%';

    // ── Articles ──────────────────────────────────────────────────────────────
    $articleStmt = $cnx->prepare(
        "SELECT a.id,
                a.title,
                a.category AS cat,
                a.tags,
                a.coverImage   AS img,
                a.readingTime  AS readTime,
                a.likesCount   AS likes,
                a.views,
                a.createdAt,
                u.name AS author,
                (
                    CASE WHEN LOWER(a.title)    LIKE :q1 THEN 3 ELSE 0 END +
                    CASE WHEN LOWER(a.category) LIKE :q2 THEN 2 ELSE 0 END +
                    CASE WHEN LOWER(a.tags)     LIKE :q3 THEN 2 ELSE 0 END +
                    CASE WHEN LOWER(a.body)     LIKE :q4 THEN 1 ELSE 0 END +
                    CASE WHEN a.likesCount > 100         THEN 1 ELSE 0 END
                ) AS score
         FROM article a
         JOIN users u ON u.id = a.userId
         WHERE a.status = 'published'
           AND (
                LOWER(a.title)    LIKE :q5
             OR LOWER(a.category) LIKE :q6
             OR LOWER(a.tags)     LIKE :q7
             OR LOWER(a.body)     LIKE :q8
           )
         ORDER BY score DESC, a.likesCount DESC
         LIMIT :lim"
    );
    $articleStmt->execute([
        ':q1' => $like, ':q2' => $like, ':q3' => $like, ':q4' => $like,
        ':q5' => $like, ':q6' => $like, ':q7' => $like, ':q8' => $like,
        ':lim' => $limit,
    ]);
    $dbArticles = $articleStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── Utilisateurs ──────────────────────────────────────────────────────────
    $userStmt = $cnx->prepare(
        "SELECT u.id,
                u.name,
                u.plan,
                u.isPremium,
                u.createdAt,
                COUNT(DISTINCT a.id)            AS articleCount,
                COALESCE(SUM(a.likesCount), 0)  AS totalLikes,
                (CASE WHEN LOWER(u.name) LIKE :q1 THEN 3 ELSE 0 END) AS score
         FROM users u
         LEFT JOIN article a ON a.userId = u.id AND a.status = 'published'
         WHERE LOWER(u.name) LIKE :q2
           AND u.isAdmin = 0
         GROUP BY u.id
         ORDER BY score DESC, totalLikes DESC
         LIMIT 5"
    );
    $userStmt->execute([':q1' => $like, ':q2' => $like]);
    $dbUsers = $userStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── Formatage ─────────────────────────────────────────────────────────────
    $articles = array_map(
        fn(array $a) => [
            'id'       => (int) $a['id'],
            'title'    => $a['title'],
            'cat'      => $a['cat'],
            'img'      => $a['img'],
            'readTime' => $a['readTime'] ?? '5 min',
            'likes'    => (int) $a['likes'],
            'views'    => (int) $a['views'],
            'author'   => $a['author'],
            'date'     => date('M d, Y', strtotime($a['createdAt'])),
            'score'    => (int) $a['score'],
            'source'   => 'db',
        ],
        $dbArticles
    );

    $users = array_map(
        fn(array $u) => [
            'id'           => (int) $u['id'],
            'name'         => $u['name'],
            'initial'      => strtoupper($u['name'][0] ?? 'U'),
            'plan'         => $u['plan'],
            'isPremium'    => (bool) $u['isPremium'],
            'articleCount' => (int) $u['articleCount'],
            'totalLikes'   => (int) $u['totalLikes'],
        ],
        $dbUsers
    );

    jsonOk([
        'q'        => $q,
        'articles' => $articles,
        'users'    => $users,
        'total'    => count($articles) + count($users),
    ]);

} catch (Throwable $e) {
    jsonErr('Erreur de recherche : ' . $e->getMessage(), 500);
}