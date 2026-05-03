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
    if (($raw === false || $raw === '') && PHP_SAPI === 'cli') {
        $raw = (string) (getenv('IBLOG_TEST_REQUEST_BODY') ?: '');
    }
    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function tableExists(PDO $cnx, string $table): bool
{
    return dbTableExists($cnx, $table);
}

function columnExists(PDO $cnx, string $table, string $column): bool
{
    return dbColumnExists($cnx, $table, $column);
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

function lowered(string $value): string
{
    return mb_strtolower(trim($value), 'UTF-8');
}

function tokenize(string $value): array
{
    $value = lowered($value);
    $value = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $value) ?? '';
    $parts = preg_split('/\s+/u', trim($value)) ?: [];
    return array_values(array_filter($parts, static fn(string $token): bool => mb_strlen($token, 'UTF-8') >= 2));
}

function containsAllTokens(array $tokens, string $haystack): bool
{
    $haystack = lowered($haystack);
    foreach ($tokens as $token) {
        if ($token !== '' && !str_contains($haystack, $token)) {
            return false;
        }
    }
    return $tokens !== [];
}

function scoreTextMatch(string $query, array $tokens, array $fields, float $engagementBoost = 0.0): array
{
    $queryLower = lowered($query);
    $score = 0.0;
    $confidence = 0.0;
    $exact = false;
    $prefix = false;
    $contains = false;

    foreach ($fields as $field => $weight) {
        $value = trim((string) $field);
        if ($value === '' || $weight <= 0) {
            continue;
        }

        $lower = lowered($value);
        if ($lower === $queryLower && $queryLower !== '') {
            $score += 100 * $weight;
            $confidence = max($confidence, 1.0);
            $exact = true;
            continue;
        }

        if ($queryLower !== '' && str_starts_with($lower, $queryLower)) {
            $score += 60 * $weight;
            $confidence = max($confidence, 0.96);
            $prefix = true;
        }

        if ($queryLower !== '' && str_contains($lower, $queryLower)) {
            $score += 34 * $weight;
            $confidence = max($confidence, 0.88);
            $contains = true;
        }

        if ($tokens !== []) {
            $fieldTokens = tokenize($value);
            $hits = 0;
            foreach ($tokens as $token) {
                foreach ($fieldTokens as $fieldToken) {
                    if ($fieldToken === $token) {
                        $hits++;
                        break;
                    }
                    if (str_starts_with($fieldToken, $token)) {
                        $hits += 0.7;
                        break;
                    }
                }
            }

            if ($hits > 0) {
                $coverage = min(1.0, $hits / max(count($tokens), 1));
                $score += (24 * $weight) * $coverage;
                $confidence = max($confidence, 0.58 + ($coverage * 0.28));
            }
        }
    }

    if (!$exact && !$prefix && !$contains && !containsAllTokens($tokens, implode(' ', array_keys($fields)))) {
        return ['score' => 0.0, 'confidence' => 0.0, 'matchTier' => 'good_match'];
    }

    $score += $engagementBoost;
    $confidence = min(1.0, $confidence + min(0.08, $engagementBoost / 20));
    $matchTier = $exact ? 'exact' : ($confidence >= 0.92 ? 'high_precision' : ($confidence >= 0.8 ? 'strong_match' : 'good_match'));

    return [
        'score' => round($score, 6),
        'confidence' => round($confidence, 4),
        'matchTier' => $matchTier,
    ];
}

function loadArticleMatches(PDO $cnx, string $query, array $tokens, int $limit): array
{
    if (!tableExists($cnx, 'article') || !tableExists($cnx, 'users')) {
        return [];
    }

    $hasUserProfile = tableExists($cnx, 'user_profile');
    $hasStatus = columnExists($cnx, 'article', 'status');
    $hasTags = columnExists($cnx, 'article', 'tags');
    $hasBody = columnExists($cnx, 'article', 'body');
    $hasCategory = columnExists($cnx, 'article', 'category');
    $hasReadingTime = columnExists($cnx, 'article', 'readingTime');
    $hasCoverImage = columnExists($cnx, 'article', 'coverImage');
    $hasViews = columnExists($cnx, 'article', 'views');
    $hasLikes = columnExists($cnx, 'article', 'likesCount');
    $hasUserAvatar = columnExists($cnx, 'users', 'avatar');

    $avatarExpr = $hasUserProfile
        ? 'COALESCE(up.avatar, ' . ($hasUserAvatar ? 'u.avatar' : '""') . ', "")'
        : ($hasUserAvatar ? 'COALESCE(u.avatar, "")' : '""');

    $sql = "SELECT
                a.id,
                a.userId,
                a.title,
                " . ($hasCategory ? 'COALESCE(a.category, "General")' : '"General"') . " AS category,
                " . ($hasTags ? 'COALESCE(a.tags, "")' : '""') . " AS tags,
                " . ($hasBody ? 'COALESCE(a.body, "")' : '""') . " AS body,
                " . ($hasReadingTime ? 'COALESCE(a.readingTime, "5 min")' : '"5 min"') . " AS readingTime,
                " . ($hasCoverImage ? 'COALESCE(a.coverImage, "")' : '""') . " AS coverImage,
                " . ($hasLikes ? 'COALESCE(a.likesCount, 0)' : '0') . " AS likesCount,
                " . ($hasViews ? 'COALESCE(a.views, 0)' : '0') . " AS views,
                u.name AS author,
                {$avatarExpr} AS authorAvatar
            FROM article a
            INNER JOIN users u ON u.id = a.userId
            " . ($hasUserProfile ? 'LEFT JOIN user_profile up ON up.userId = u.id' : '') . "
            WHERE COALESCE(u.isAdmin, 0) = 0";

    if ($hasStatus) {
        $sql .= " AND a.status = 'published'";
    }

    $sql .= " AND (
                a.title LIKE :query
                OR u.name LIKE :query
                " . ($hasCategory ? 'OR a.category LIKE :query ' : '') . "
                " . ($hasTags ? 'OR a.tags LIKE :query ' : '') . "
                " . ($hasBody ? 'OR a.body LIKE :query ' : '') . "
            )
            ORDER BY " . ($hasViews ? 'COALESCE(a.views, 0)' : '0') . " DESC, " . ($hasLikes ? 'COALESCE(a.likesCount, 0)' : '0') . " DESC, a.id DESC
            LIMIT {$limit}";

    $stmt = $cnx->prepare($sql);
    $stmt->execute([':query' => '%' . $query . '%']);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $results = [];
    foreach ($rows as $row) {
        $engagementBoost = min(8.0, log(1 + max(0, (int) ($row['views'] ?? 0)) + max(0, (int) ($row['likesCount'] ?? 0))));
        $match = scoreTextMatch($query, $tokens, [
            (string) ($row['title'] ?? '') => 2.2,
            (string) ($row['author'] ?? '') => 1.1,
            (string) ($row['category'] ?? '') => 0.8,
            (string) ($row['tags'] ?? '') => 1.0,
            (string) ($row['body'] ?? '') => 0.3,
        ], $engagementBoost);

        if (($match['score'] ?? 0) <= 0) {
            continue;
        }

        $results[] = [
            'id' => (int) ($row['id'] ?? 0),
            'type' => 'article',
            'authorId' => (int) ($row['userId'] ?? 0),
            'title' => (string) ($row['title'] ?? ''),
            'author' => (string) ($row['author'] ?? 'Unknown'),
            'authorAvatar' => normalizeProfileAssetPath((string) ($row['authorAvatar'] ?? '')),
            'cat' => (string) ($row['category'] ?? 'General'),
            'tags' => (string) ($row['tags'] ?? ''),
            'img' => (string) ($row['coverImage'] ?? ''),
            'readTime' => (string) ($row['readingTime'] ?? '5 min'),
            'likes' => (int) ($row['likesCount'] ?? 0),
            'views' => (int) ($row['views'] ?? 0),
            'score' => $match['score'],
            'confidence' => $match['confidence'],
            'matchTier' => $match['matchTier'],
        ];
    }

    return $results;
}

function loadUserMatches(PDO $cnx, string $query, array $tokens, int $limit): array
{
    if (!tableExists($cnx, 'users')) {
        return [];
    }

    $hasUserProfile = tableExists($cnx, 'user_profile');
    $hasUserAvatar = columnExists($cnx, 'users', 'avatar');
    $hasUserCover = columnExists($cnx, 'users', 'cover');
    $hasUserBio = columnExists($cnx, 'users', 'bio');

    $avatarExpr = $hasUserProfile
        ? 'COALESCE(up.avatar, ' . ($hasUserAvatar ? 'u.avatar' : '""') . ', "")'
        : ($hasUserAvatar ? 'COALESCE(u.avatar, "")' : '""');
    $coverExpr = $hasUserProfile
        ? 'COALESCE(up.cover, ' . ($hasUserCover ? 'u.cover' : '""') . ', "")'
        : ($hasUserCover ? 'COALESCE(u.cover, "")' : '""');
    $bioExpr = $hasUserProfile
        ? 'COALESCE(up.bio, ' . ($hasUserBio ? 'u.bio' : '""') . ', "")'
        : ($hasUserBio ? 'COALESCE(u.bio, "")' : '""');

    $sql = "SELECT
                u.id,
                u.name,
                u.email,
                COALESCE(u.plan, 'free') AS plan,
                COALESCE(u.isPremium, 0) AS isPremium,
                {$avatarExpr} AS avatar,
                {$coverExpr} AS cover,
                {$bioExpr} AS bio
            FROM users u
            " . ($hasUserProfile ? 'LEFT JOIN user_profile up ON up.userId = u.id' : '') . "
            WHERE COALESCE(u.isAdmin, 0) = 0
              AND (
                  u.name LIKE :query
                  OR u.email LIKE :query
                  OR {$bioExpr} LIKE :query
              )
            ORDER BY COALESCE(u.isPremium, 0) DESC, u.name ASC
            LIMIT {$limit}";

    $stmt = $cnx->prepare($sql);
    $stmt->execute([':query' => '%' . $query . '%']);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $results = [];
    foreach ($rows as $row) {
        $match = scoreTextMatch($query, $tokens, [
            (string) ($row['name'] ?? '') => 2.4,
            (string) ($row['email'] ?? '') => 1.2,
            (string) ($row['bio'] ?? '') => 0.45,
            (string) ($row['plan'] ?? 'free') => 0.15,
        ]);

        if (($match['score'] ?? 0) <= 0) {
            continue;
        }

        $name = (string) ($row['name'] ?? 'Unknown');
        $results[] = [
            'id' => (int) ($row['id'] ?? 0),
            'type' => 'user',
            'name' => $name,
            'email' => (string) ($row['email'] ?? ''),
            'plan' => (string) ($row['plan'] ?? 'free'),
            'isPremium' => (bool) ($row['isPremium'] ?? 0),
            'avatar' => normalizeProfileAssetPath((string) ($row['avatar'] ?? '')),
            'cover' => normalizeProfileAssetPath((string) ($row['cover'] ?? '')),
            'bio' => (string) ($row['bio'] ?? ''),
            'initial' => strtoupper(mb_substr($name, 0, 1) ?: 'U'),
            'score' => $match['score'],
            'confidence' => $match['confidence'],
            'matchTier' => $match['matchTier'],
        ];
    }

    return $results;
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
            'method' => 'db_like_ranked',
        ]);
    }

    $body = readBody();
    $query = trim((string) ($body['q'] ?? ''));
    $mode = trim((string) ($body['mode'] ?? 'all'));
    $limit = max(1, min((int) ($body['limit'] ?? 20), 50));

    if (mb_strlen($query, 'UTF-8') < 2) {
        jsonErr('Query too short');
    }

    $tokens = tokenize($query);
    $sourceLimit = max($limit * 4, 20);
    $articles = $mode === 'people' ? [] : loadArticleMatches($cnx, $query, $tokens, $sourceLimit);
    $users = $mode === 'articles' ? [] : loadUserMatches($cnx, $query, $tokens, $sourceLimit);

    $combined = array_merge($articles, $users);
    usort($combined, static function (array $a, array $b): int {
        $confidenceDiff = ($b['confidence'] ?? 0) <=> ($a['confidence'] ?? 0);
        if ($confidenceDiff !== 0) {
            return $confidenceDiff;
        }

        $scoreDiff = ($b['score'] ?? 0) <=> ($a['score'] ?? 0);
        if ($scoreDiff !== 0) {
            return $scoreDiff;
        }

        $labelA = lowered((string) ($a['title'] ?? $a['name'] ?? ''));
        $labelB = lowered((string) ($b['title'] ?? $b['name'] ?? ''));
        return $labelA <=> $labelB;
    });

    $combined = array_slice($combined, 0, $limit);
    $results = [];
    $articlesOut = [];
    $usersOut = [];
    $ranking = [];

    foreach ($combined as $index => $item) {
        $payload = [
            'rank' => $index + 1,
            'doc_id' => $item['type'] . ':' . (int) ($item['id'] ?? 0),
            'type' => (string) $item['type'],
            'score' => (float) ($item['score'] ?? 0),
            'confidence' => (float) ($item['confidence'] ?? 0),
            'matchTier' => (string) ($item['matchTier'] ?? 'good_match'),
        ];

        unset($item['score'], $item['confidence'], $item['matchTier']);
        $results[] = $payload + $item;
        $ranking[] = $payload;

        if (($item['type'] ?? '') === 'article') {
            $articlesOut[] = $payload + $item;
        } else {
            $usersOut[] = $payload + $item;
        }
    }

    jsonOk([
        'query' => $query,
        'results' => $results,
        'articles' => $articlesOut,
        'users' => $usersOut,
        'ranking' => $ranking,
        'method' => 'db_like_ranked',
    ]);
} catch (Throwable $e) {
    error_log('[search-index] ' . $e->getMessage());
    jsonOk([
        'query' => $query ?? '',
        'results' => [],
        'articles' => [],
        'users' => [],
        'ranking' => [],
        'method' => 'db_like_ranked',
    ]);
}
