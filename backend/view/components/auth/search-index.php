<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function jsonOk(array $data = []): never
{
    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonErr(string $message, int $status = 400): never
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readBody(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function tableExists(PDO $cnx, string $table): bool
{
    $stmt = $cnx->prepare('SHOW TABLES LIKE :table');
    $stmt->execute([':table' => $table]);
    return (bool) $stmt->fetchColumn();
}

function columnExists(PDO $cnx, string $table, string $column): bool
{
    $stmt = $cnx->prepare("SHOW COLUMNS FROM `{$table}` LIKE :col");
    $stmt->execute([':col' => $column]);
    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

function tokenize(string $text): array
{
    static $stop = [
        'the','a','an','and','or','to','for','of','in','on','with','by','at','is','are','was','were',
        'be','been','from','that','this','it','as','you','your','our','we','their','they','about',
    ];

    $text = mb_strtolower($text, 'UTF-8');
    $text = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $text) ?? '';
    $parts = preg_split('/\s+/u', trim($text)) ?: [];

    $tokens = [];
    foreach ($parts as $p) {
        if ($p === '' || mb_strlen($p, 'UTF-8') < 2) continue;
        if (in_array($p, $stop, true)) continue;
        $tokens[] = $p;
    }
    return $tokens;
}

function tf(array $tokens): array
{
    $freq = [];
    $total = max(count($tokens), 1);
    foreach ($tokens as $t) {
        $freq[$t] = ($freq[$t] ?? 0) + 1;
    }
    foreach ($freq as $term => $count) {
        $freq[$term] = $count / $total;
    }
    return $freq;
}

function dotProduct(array $a, array $b): float
{
    $sum = 0.0;
    foreach ($a as $k => $v) {
        if (isset($b[$k])) {
            $sum += $v * $b[$k];
        }
    }
    return $sum;
}

function norm(array $v): float
{
    $sum = 0.0;
    foreach ($v as $x) {
        $sum += $x * $x;
    }
    return sqrt($sum);
}

function cosine(array $a, array $b): float
{
    $na = norm($a);
    $nb = norm($b);
    if ($na <= 0 || $nb <= 0) return 0.0;
    return dotProduct($a, $b) / ($na * $nb);
}

function computeMetrics(array $rankedIds, array $relevantIds): array
{
    $relevantSet = array_fill_keys($relevantIds, true);
    $tp = 0;
    foreach ($rankedIds as $rid) {
        if (isset($relevantSet[$rid])) $tp++;
    }

    $fp = count($rankedIds) - $tp;
    $fn = max(0, count($relevantIds) - $tp);
    $precision = ($tp + $fp) > 0 ? $tp / ($tp + $fp) : 0.0;
    $recall = ($tp + $fn) > 0 ? $tp / ($tp + $fn) : 0.0;
    $f1 = ($precision + $recall) > 0 ? 2 * $precision * $recall / ($precision + $recall) : 0.0;

    $pAt = function (int $k) use ($rankedIds, $relevantSet): float {
        if ($k <= 0) return 0.0;
        $top = array_slice($rankedIds, 0, $k);
        if (!$top) return 0.0;
        $hits = 0;
        foreach ($top as $rid) {
            if (isset($relevantSet[$rid])) $hits++;
        }
        return $hits / $k;
    };

    return [
        'precision' => round($precision, 4),
        'recall' => round($recall, 4),
        'f1' => round($f1, 4),
        'p_at_3' => round($pAt(3), 4),
        'p_at_5' => round($pAt(5), 4),
        'relevant_total' => count($relevantIds),
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonErr('Method not allowed', 405);
    }

    require_once __DIR__ . '/../../../config/database.php';
    if (!($cnx instanceof PDO)) {
        jsonOk([
            'query' => '',
            'results' => [],
            'articles' => [],
            'users' => [],
            'ranking' => [],
            'metrics' => computeMetrics([], []),
            'method' => 'tfidf_cosine',
        ]);
    }

    $body = readBody();
    $query = trim((string) ($body['q'] ?? ''));
    $limit = max(1, min((int) ($body['limit'] ?? 20), 50));
    $mode = trim((string) ($body['mode'] ?? 'all')); // all | articles | people

    if (mb_strlen($query, 'UTF-8') < 2) {
        jsonErr('Query too short');
    }

    $documents = [];
    $ranking = [];

    if (tableExists($cnx, 'article') && tableExists($cnx, 'users')) {
        $statusFilter = columnExists($cnx, 'article', 'status') ? " AND a.status = 'published'" : '';
        $likesExpr = columnExists($cnx, 'article', 'likesCount') ? 'COALESCE(a.likesCount,0)' : '0';
        $viewsExpr = columnExists($cnx, 'article', 'views') ? 'COALESCE(a.views,0)' : '0';
        $catExpr = columnExists($cnx, 'article', 'category') ? 'COALESCE(a.category, "General")' : '"General"';
        $tagExpr = columnExists($cnx, 'article', 'tags') ? 'COALESCE(a.tags, "")' : '""';
        $bodyExpr = columnExists($cnx, 'article', 'body') ? 'COALESCE(a.body, "")' : '""';
        $readExpr = columnExists($cnx, 'article', 'readingTime') ? 'COALESCE(a.readingTime, "5 min")' : '"5 min"';
        $imgExpr = columnExists($cnx, 'article', 'coverImage') ? 'COALESCE(a.coverImage, "")' : '""';

        $articleSql = "SELECT
                a.id,
                a.title,
                {$catExpr} AS category,
                {$tagExpr} AS tags,
                {$bodyExpr} AS body,
                {$readExpr} AS readingTime,
                {$imgExpr} AS coverImage,
                {$likesExpr} AS likesCount,
                {$viewsExpr} AS views,
                u.name AS author
            FROM article a
            JOIN users u ON u.id = a.userId
            WHERE 1=1{$statusFilter}";

        $articles = $cnx->query($articleSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($articles as $a) {
            $docId = 'article:' . (int) $a['id'];
            $documents[$docId] = [
                'id' => $docId,
                'type' => 'article',
                'entity_id' => (int) $a['id'],
                'title' => (string) ($a['title'] ?? 'Untitled'),
                'author' => (string) ($a['author'] ?? 'Unknown'),
                'category' => (string) ($a['category'] ?? 'General'),
                'tags' => (string) ($a['tags'] ?? ''),
                'readTime' => (string) ($a['readingTime'] ?? '5 min'),
                'img' => (string) ($a['coverImage'] ?? ''),
                'likes' => (int) ($a['likesCount'] ?? 0),
                'views' => (int) ($a['views'] ?? 0),
                'text' => implode(' ', [
                    (string) ($a['title'] ?? ''),
                    (string) ($a['author'] ?? ''),
                    (string) ($a['category'] ?? ''),
                    (string) ($a['tags'] ?? ''),
                    (string) ($a['body'] ?? ''),
                ]),
            ];
        }
    }

    if (tableExists($cnx, 'users')) {
        $userSql = "SELECT
                u.id,
                u.name,
                COALESCE(u.plan, 'free') AS plan,
                COALESCE(u.isPremium, 0) AS isPremium
            FROM users u
            WHERE COALESCE(u.isAdmin,0) = 0";

        $users = $cnx->query($userSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($users as $u) {
            $docId = 'user:' . (int) $u['id'];
            $documents[$docId] = [
                'id' => $docId,
                'type' => 'user',
                'entity_id' => (int) $u['id'],
                'name' => (string) ($u['name'] ?? 'Unknown'),
                'plan' => (string) ($u['plan'] ?? 'free'),
                'isPremium' => (bool) ($u['isPremium'] ?? 0),
                'text' => implode(' ', [
                    (string) ($u['name'] ?? ''),
                    (string) ($u['plan'] ?? ''),
                    (bool) ($u['isPremium'] ?? 0) ? 'premium' : 'free',
                ]),
            ];
        }
    }

    if (empty($documents)) {
        jsonOk([
            'query' => $query,
            'results' => [],
            'articles' => [],
            'users' => [],
            'ranking' => [],
            'metrics' => computeMetrics([], []),
        ]);
    }

    $docTokens = [];
    $docTf = [];
    $df = [];

    foreach ($documents as $docId => $doc) {
        $tokens = tokenize((string) ($doc['text'] ?? ''));
        $docTokens[$docId] = $tokens;
        $docTf[$docId] = tf($tokens);
        foreach (array_keys($docTf[$docId]) as $term) {
            $df[$term] = ($df[$term] ?? 0) + 1;
        }
    }

    $N = max(count($documents), 1);
    $idf = [];
    foreach ($df as $term => $count) {
        $idf[$term] = log(($N + 1) / ($count + 1)) + 1.0;
    }

    $docVectors = [];
    foreach ($docTf as $docId => $weights) {
        $vec = [];
        foreach ($weights as $term => $w) {
            $vec[$term] = $w * ($idf[$term] ?? 1.0);
        }
        $docVectors[$docId] = $vec;
    }

    $qTokens = tokenize($query);
    $qTf = tf($qTokens);
    $qVec = [];
    foreach ($qTf as $term => $w) {
        $qVec[$term] = $w * ($idf[$term] ?? (log(($N + 1) / 1) + 1.0));
    }

    foreach ($documents as $docId => $doc) {
        $base = cosine($qVec, $docVectors[$docId] ?? []);
        $boost = 0.0;
        $qLower = mb_strtolower($query, 'UTF-8');

        if (($doc['type'] ?? '') === 'article') {
            $cat = mb_strtolower((string) ($doc['category'] ?? ''), 'UTF-8');
            $author = mb_strtolower((string) ($doc['author'] ?? ''), 'UTF-8');
            if ($cat !== '' && str_contains($cat, $qLower)) $boost += 0.25;
            if ($author !== '' && str_contains($author, $qLower)) $boost += 0.25;
        }

        if (($doc['type'] ?? '') === 'user') {
            $name = mb_strtolower((string) ($doc['name'] ?? ''), 'UTF-8');
            if ($name !== '' && str_contains($name, $qLower)) $boost += 0.35;
        }

        $score = $base + $boost;
        $ranking[] = [
            'doc_id' => $docId,
            'type' => $doc['type'],
            'score' => $score,
        ];
    }

    usort($ranking, static fn(array $a, array $b) => $b['score'] <=> $a['score']);

    if ($mode === 'articles') {
        $ranking = array_values(array_filter($ranking, static fn($r) => $r['type'] === 'article'));
    } elseif ($mode === 'people') {
        $ranking = array_values(array_filter($ranking, static fn($r) => $r['type'] === 'user'));
    }

    $ranking = array_slice($ranking, 0, $limit);
    $resultIds = array_column($ranking, 'doc_id');

    $results = [];
    $articlesOut = [];
    $usersOut = [];
    foreach ($ranking as $idx => $row) {
        $doc = $documents[$row['doc_id']] ?? null;
        if ($doc === null) continue;
        $item = [
            'rank' => $idx + 1,
            'doc_id' => $row['doc_id'],
            'type' => $doc['type'],
            'score' => round((float) $row['score'], 6),
        ];

        if ($doc['type'] === 'article') {
            $item += [
                'id' => (int) $doc['entity_id'],
                'title' => $doc['title'],
                'author' => $doc['author'],
                'cat' => $doc['category'],
                'tags' => $doc['tags'],
                'img' => $doc['img'],
                'readTime' => $doc['readTime'],
                'likes' => (int) $doc['likes'],
                'views' => (int) $doc['views'],
            ];
            $articlesOut[] = $item;
        } else {
            $item += [
                'id' => (int) $doc['entity_id'],
                'name' => $doc['name'],
                'plan' => $doc['plan'],
                'isPremium' => (bool) $doc['isPremium'],
                'initial' => strtoupper($doc['name'][0] ?? 'U'),
            ];
            $usersOut[] = $item;
        }

        $results[] = $item;
    }

    $relevantIds = [];
    $qLower = mb_strtolower($query, 'UTF-8');
    foreach ($documents as $docId => $doc) {
        $text = mb_strtolower((string) ($doc['text'] ?? ''), 'UTF-8');
        if (str_contains($text, $qLower)) {
            $relevantIds[] = $docId;
            continue;
        }
        $allTermsFound = true;
        foreach ($qTokens as $qt) {
            if (!str_contains($text, $qt)) {
                $allTermsFound = false;
                break;
            }
        }
        if ($allTermsFound && !empty($qTokens)) {
            $relevantIds[] = $docId;
        }
    }

    $metrics = computeMetrics($resultIds, array_values(array_unique($relevantIds)));

    jsonOk([
        'query' => $query,
        'results' => $results,
        'articles' => $articlesOut,
        'users' => $usersOut,
        'ranking' => array_map(
            static fn(array $r, int $i) => [
                'rank' => $i + 1,
                'doc_id' => $r['doc_id'],
                'type' => $r['type'],
                'score' => round((float) $r['score'], 6),
            ],
            $ranking,
            array_keys($ranking)
        ),
        'metrics' => $metrics,
        'method' => 'tfidf_cosine',
    ]);
} catch (Throwable $e) {
    jsonErr('Search error: ' . $e->getMessage(), 500);
}
