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

function uniqueTokens(array $tokens): array
{
    return array_values(array_unique(array_filter($tokens, static fn($token) => $token !== '')));
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

function normalizeProfileAssetPath(string $path): string
{
    $path = trim($path);
    if ($path === '') {
        return '';
    }

    if (preg_match('#^backend/public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $path) === 1) {
        return substr($path, strlen('backend/'));
    }

    if (preg_match('#^/blog_12(?:3)?/public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $path) === 1) {
        return preg_replace('#^/blog_12(?:3)?/#', '', $path) ?: $path;
    }

    if (preg_match('#^https?://[^/]+/blog_12(?:3)?/public/uploads/(?:avatars|covers)/[A-Za-z0-9._-]+$#', $path) === 1) {
        return preg_replace('#^https?://[^/]+/blog_12(?:3)?/#', '', $path) ?: $path;
    }

    return $path;
}

function termCoverageScore(array $queryTokens, array $docTokens): float
{
    $queryTokens = uniqueTokens($queryTokens);
    if ($queryTokens === []) {
        return 0.0;
    }

    $docSet = array_fill_keys(uniqueTokens($docTokens), true);
    $hits = 0;
    foreach ($queryTokens as $token) {
        if (isset($docSet[$token])) {
            $hits++;
        }
    }

    return $hits / count($queryTokens);
}

function prefixCoverageScore(array $queryTokens, array $docTokens): float
{
    $queryTokens = uniqueTokens($queryTokens);
    $docTokens = uniqueTokens($docTokens);
    if ($queryTokens === [] || $docTokens === []) {
        return 0.0;
    }

    $hits = 0;
    foreach ($queryTokens as $queryToken) {
        foreach ($docTokens as $docToken) {
            if ($queryToken !== '' && str_starts_with($docToken, $queryToken)) {
                $hits++;
                break;
            }
        }
    }

    return $hits / count($queryTokens);
}

function fieldBoost(string $fieldValue, string $queryLower, array $queryTokens, float $containsWeight, float $coverageWeight, float $prefixWeight): float
{
    $fieldValue = trim($fieldValue);
    if ($fieldValue === '') {
        return 0.0;
    }

    $score = 0.0;
    $fieldLower = mb_strtolower($fieldValue, 'UTF-8');
    if ($queryLower !== '' && str_contains($fieldLower, $queryLower)) {
        $score += $containsWeight;
    }
    if ($queryLower !== '' && str_starts_with($fieldLower, $queryLower)) {
        $score += $containsWeight * 0.22;
    }

    $fieldTokens = tokenize($fieldValue);
    $score += termCoverageScore($queryTokens, $fieldTokens) * $coverageWeight;
    $score += prefixCoverageScore($queryTokens, $fieldTokens) * $prefixWeight;

    return $score;
}

function clampSearchScore(float $value, float $min = 0.0, float $max = 1.0): float
{
    return max($min, min($max, $value));
}

function searchConfidenceScore(
    float $base,
    float $coverage,
    float $prefixCoverage,
    float $boost,
    bool $exactMatch,
    bool $prefixMatch
): float {
    if ($exactMatch) {
        return 1.0;
    }

    $confidence = ($coverage * 0.48)
        + ($prefixCoverage * 0.18)
        + min($base * 1.35, 0.18)
        + min($boost / 6.2, 0.16);

    if ($prefixMatch) {
        $confidence = max($confidence, 0.9);
    }

    return clampSearchScore($confidence);
}

function minimumSearchConfidence(string $query): float
{
    $length = mb_strlen(trim($query), 'UTF-8');
    if ($length <= 3) {
        return 0.8;
    }
    if ($length <= 6) {
        return 0.72;
    }
    return 0.64;
}

function confidenceTier(float $confidence): string
{
    if ($confidence >= 0.995) {
        return 'exact';
    }
    if ($confidence >= 0.9) {
        return 'high_precision';
    }
    if ($confidence >= 0.8) {
        return 'strong_match';
    }
    return 'good_match';
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
            'method' => 'hybrid_tfidf',
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
        $hasUserProfile = tableExists($cnx, 'user_profile');
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
                u.id AS authorId,
                u.name AS author,
                " . ($hasUserProfile
                    ? 'COALESCE(up.avatar, ' . (columnExists($cnx, 'users', 'avatar') ? 'u.avatar' : '""') . ', "")'
                    : (columnExists($cnx, 'users', 'avatar') ? 'COALESCE(u.avatar, "")' : '""')) . " AS authorAvatar
            FROM article a
            JOIN users u ON u.id = a.userId
            " . ($hasUserProfile ? 'LEFT JOIN user_profile up ON up.userId = u.id' : '') . "
            WHERE 1=1{$statusFilter}";

        $articles = $cnx->query($articleSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($articles as $a) {
            $docId = 'article:' . (int) $a['id'];
            $title = (string) ($a['title'] ?? 'Untitled');
            $author = (string) ($a['author'] ?? 'Unknown');
            $category = (string) ($a['category'] ?? 'General');
            $tags = (string) ($a['tags'] ?? '');
            $body = (string) ($a['body'] ?? '');
            $documents[$docId] = [
                'id' => $docId,
                'type' => 'article',
                'entity_id' => (int) $a['id'],
                'authorId' => (int) ($a['authorId'] ?? 0),
                'title' => $title,
                'author' => $author,
                'category' => $category,
                'tags' => $tags,
                'readTime' => (string) ($a['readingTime'] ?? '5 min'),
                'img' => (string) ($a['coverImage'] ?? ''),
                'authorAvatar' => normalizeProfileAssetPath((string) ($a['authorAvatar'] ?? '')),
                'likes' => (int) ($a['likesCount'] ?? 0),
                'views' => (int) ($a['views'] ?? 0),
                'titleText' => $title,
                'authorText' => $author,
                'categoryText' => $category,
                'tagsText' => $tags,
                'bodyText' => $body,
                'text' => implode(' ', [
                    $title,
                    $title,
                    $author,
                    $category,
                    $category,
                    $tags,
                    $tags,
                    $body,
                ]),
            ];
        }
    }

    if (tableExists($cnx, 'users')) {
        $hasUserProfile = tableExists($cnx, 'user_profile');
        $userSql = "SELECT
                u.id,
                u.name,
                u.email,
                COALESCE(u.plan, 'free') AS plan,
                COALESCE(u.isPremium, 0) AS isPremium,
                " . ($hasUserProfile
                    ? 'COALESCE(up.avatar, ' . (columnExists($cnx, 'users', 'avatar') ? 'u.avatar' : '""') . ', "")'
                    : (columnExists($cnx, 'users', 'avatar') ? 'COALESCE(u.avatar, "")' : '""')) . " AS avatar,
                " . ($hasUserProfile
                    ? 'COALESCE(up.cover, ' . (columnExists($cnx, 'users', 'cover') ? 'u.cover' : '""') . ', "")'
                    : (columnExists($cnx, 'users', 'cover') ? 'COALESCE(u.cover, "")' : '""')) . " AS cover,
                " . ($hasUserProfile
                    ? 'COALESCE(up.bio, ' . (columnExists($cnx, 'users', 'bio') ? 'u.bio' : '""') . ', "")'
                    : (columnExists($cnx, 'users', 'bio') ? 'COALESCE(u.bio, "")' : '""')) . " AS bio
            FROM users u
            " . ($hasUserProfile ? 'LEFT JOIN user_profile up ON up.userId = u.id' : '') . "
            WHERE COALESCE(u.isAdmin,0) = 0";

        $users = $cnx->query($userSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($users as $u) {
            $docId = 'user:' . (int) $u['id'];
            $name = (string) ($u['name'] ?? 'Unknown');
            $bio = (string) ($u['bio'] ?? '');
            $plan = (string) ($u['plan'] ?? 'free');
            $documents[$docId] = [
                'id' => $docId,
                'type' => 'user',
                'entity_id' => (int) $u['id'],
                'name' => $name,
                'email' => (string) ($u['email'] ?? ''),
                'plan' => $plan,
                'isPremium' => (bool) ($u['isPremium'] ?? 0),
                'avatar' => normalizeProfileAssetPath((string) ($u['avatar'] ?? '')),
                'cover' => normalizeProfileAssetPath((string) ($u['cover'] ?? '')),
                'bio' => $bio,
                'nameText' => $name,
                'emailText' => (string) ($u['email'] ?? ''),
                'bioText' => $bio,
                'text' => implode(' ', [
                    $name,
                    $name,
                    (string) ($u['email'] ?? ''),
                    $bio,
                    $plan,
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

    $qLower = mb_strtolower($query, 'UTF-8');

    $minConfidence = minimumSearchConfidence($query);

    foreach ($documents as $docId => $doc) {
        $base = cosine($qVec, $docVectors[$docId] ?? []);
        $coverage = termCoverageScore($qTokens, $docTokens[$docId] ?? []);
        $prefixCoverage = prefixCoverageScore($qTokens, $docTokens[$docId] ?? []);
        $boost = ($coverage * 1.25) + ($prefixCoverage * 0.7);
        $primaryField = (string) ($doc['type'] === 'article' ? ($doc['titleText'] ?? '') : ($doc['nameText'] ?? ''));
        $primaryLower = mb_strtolower($primaryField, 'UTF-8');
        $exactMatch = $qLower !== '' && $primaryLower === $qLower;
        $prefixMatch = $qLower !== '' && str_starts_with($primaryLower, $qLower);

        if (($doc['type'] ?? '') === 'article') {
            $titleText = (string) ($doc['titleText'] ?? '');
            $boost += fieldBoost($titleText, $qLower, $qTokens, 1.55, 1.8, 0.92);
            $boost += fieldBoost((string) ($doc['tagsText'] ?? ''), $qLower, $qTokens, 0.95, 1.35, 0.68);
            $boost += fieldBoost((string) ($doc['categoryText'] ?? ''), $qLower, $qTokens, 0.7, 0.98, 0.5);
            $boost += fieldBoost((string) ($doc['authorText'] ?? ''), $qLower, $qTokens, 0.5, 0.72, 0.36);
            $boost += fieldBoost((string) ($doc['bodyText'] ?? ''), $qLower, $qTokens, 0.04, 0.12, 0.05);
            if ($qLower !== '' && mb_strtolower($titleText, 'UTF-8') === $qLower) {
                $boost += 2.8;
            }

            $engagement = log(1 + max(0, (int) ($doc['likes'] ?? 0)) + (max(0, (int) ($doc['views'] ?? 0)) / 30));
            $boost += min($engagement / 30, 0.18);
        }

        if (($doc['type'] ?? '') === 'user') {
            $nameText = (string) ($doc['nameText'] ?? '');
            $boost += fieldBoost($nameText, $qLower, $qTokens, 1.7, 2.0, 0.95);
            $boost += fieldBoost((string) ($doc['emailText'] ?? ''), $qLower, $qTokens, 1.15, 1.1, 0.72);
            $boost += fieldBoost((string) ($doc['bioText'] ?? ''), $qLower, $qTokens, 0.12, 0.3, 0.12);
            $boost += fieldBoost((string) ($doc['plan'] ?? ''), $qLower, $qTokens, 0.05, 0.1, 0.05);
            if ($qLower !== '' && mb_strtolower($nameText, 'UTF-8') === $qLower) {
                $boost += 2.8;
            }
        }

        $score = $base + $boost;
        $confidence = searchConfidenceScore($base, $coverage, $prefixCoverage, $boost, $exactMatch, $prefixMatch);
        if ($score <= 0.04) {
            continue;
        }
        if ($confidence < $minConfidence && !$exactMatch && !($coverage >= 1.0 && $prefixCoverage >= 0.66)) {
            continue;
        }
        $ranking[] = [
            'doc_id' => $docId,
            'type' => $doc['type'],
            'score' => $score,
            'confidence' => $confidence,
            'match_tier' => confidenceTier($confidence),
        ];
    }

    usort($ranking, static fn(array $a, array $b) => $b['score'] <=> $a['score']);

    $filterMode = static function (array $rows) use ($mode): array {
        if ($mode === 'articles') {
            return array_values(array_filter($rows, static fn(array $row): bool => $row['type'] === 'article'));
        }
        if ($mode === 'people') {
            return array_values(array_filter($rows, static fn(array $row): bool => $row['type'] === 'user'));
        }
        return array_values($rows);
    };

    $ranking = $filterMode($ranking);
    usort($ranking, static function (array $a, array $b) use ($documents): int {
        $scoreDiff = ($b['score'] ?? 0.0) <=> ($a['score'] ?? 0.0);
        if ($scoreDiff !== 0) {
            return $scoreDiff;
        }

        $docA = $documents[$a['doc_id']] ?? [];
        $docB = $documents[$b['doc_id']] ?? [];
        $textA = mb_strtolower((string) ($docA['title'] ?? $docA['name'] ?? ''), 'UTF-8');
        $textB = mb_strtolower((string) ($docB['title'] ?? $docB['name'] ?? ''), 'UTF-8');
        return $textA <=> $textB;
    });

    $ranking = array_slice($ranking, 0, $limit);

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
            'confidence' => round((float) ($row['confidence'] ?? 0.0), 4),
            'matchTier' => (string) ($row['match_tier'] ?? 'good_match'),
        ];

        if ($doc['type'] === 'article') {
            $item += [
                'id' => (int) $doc['entity_id'],
                'authorId' => (int) ($doc['authorId'] ?? 0),
                'title' => $doc['title'],
                'author' => $doc['author'],
                'authorAvatar' => $doc['authorAvatar'],
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
                'email' => $doc['email'],
                'plan' => $doc['plan'],
                'isPremium' => (bool) $doc['isPremium'],
                'avatar' => $doc['avatar'],
                'cover' => $doc['cover'],
                'bio' => $doc['bio'],
                'initial' => strtoupper($doc['name'][0] ?? 'U'),
            ];
            $usersOut[] = $item;
        }

        $results[] = $item;
    }

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
                'confidence' => round((float) ($r['confidence'] ?? 0.0), 4),
                'matchTier' => (string) ($r['match_tier'] ?? 'good_match'),
            ],
            $ranking,
            array_keys($ranking)
        ),
        'method' => 'hybrid_tfidf_tuned',
    ]);
} catch (Throwable $e) {
    error_log('[search-index] ' . $e->getMessage());
    jsonOk([
        'query' => $query ?? '',
        'results' => [],
        'articles' => [],
        'users' => [],
        'ranking' => [],
        'method' => 'hybrid_tfidf_tuned',
    ]);
}
