<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

session_start();

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

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function tableExists(PDO $cnx, string $table): bool
{
    try {
        $stmt = $cnx->prepare('SHOW TABLES LIKE :table');
        $stmt->execute([':table' => $table]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function columnExists(PDO $cnx, string $table, string $column): bool
{
    try {
        $stmt = $cnx->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
        $stmt->execute([':column' => $column]);
        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable) {
        return false;
    }
}

function ensureActivityTable(PDO $cnx): void
{
    $cnx->exec(
        "CREATE TABLE IF NOT EXISTS user_activity (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            event_type VARCHAR(60) NOT NULL,
            entity_type VARCHAR(40) DEFAULT NULL,
            entity_id VARCHAR(120) DEFAULT NULL,
            title VARCHAR(255) DEFAULT NULL,
            category VARCHAR(120) DEFAULT NULL,
            value INT NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_created (user_id, created_at),
            INDEX idx_event_created (event_type, created_at),
            INDEX idx_entity (entity_type, entity_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

function resolveUserId(array $body): int
{
    if (!empty($_SESSION['user_id'])) {
        return (int) $_SESSION['user_id'];
    }
    return (int) ($body['userId'] ?? 0);
}

function platformSummary(PDO $cnx): array
{
    $users = 0;
    $articles = 0;
    $premium = 0;

    if (tableExists($cnx, 'users')) {
        $users = (int) $cnx->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $premium = (int) $cnx->query("SELECT COUNT(*) FROM users WHERE plan = 'premium'")->fetchColumn();
    }

    if (tableExists($cnx, 'article')) {
        $statusFilter = columnExists($cnx, 'article', 'status') ? " WHERE status = 'published'" : '';
        $articles = (int) $cnx->query("SELECT COUNT(*) FROM article{$statusFilter}")->fetchColumn();
    }

    return [
        'total_users' => $users,
        'total_articles' => $articles,
        'premium_count' => $premium,
    ];
}

function trackEvent(PDO $cnx, int $userId, array $body): array
{
    ensureActivityTable($cnx);

    $eventType = trim((string) ($body['eventType'] ?? ''));
    if ($eventType === '') {
        return ['tracked' => false];
    }

    $stmt = $cnx->prepare(
        "INSERT INTO user_activity
            (user_id, event_type, entity_type, entity_id, title, category, value, created_at)
         VALUES
            (:user_id, :event_type, :entity_type, :entity_id, :title, :category, :value, NOW())"
    );

    $stmt->execute([
        ':user_id' => $userId > 0 ? $userId : null,
        ':event_type' => $eventType,
        ':entity_type' => trim((string) ($body['entityType'] ?? '')) ?: null,
        ':entity_id' => (string) ($body['entityId'] ?? '') ?: null,
        ':title' => trim((string) ($body['title'] ?? '')) ?: null,
        ':category' => trim((string) ($body['category'] ?? '')) ?: null,
        ':value' => max(1, (int) ($body['value'] ?? 1)),
    ]);

    return ['tracked' => true];
}

function getMyStats(PDO $cnx, int $userId): array
{
    ensureActivityTable($cnx);

    $articlesCount = 0;
    if ($userId > 0 && tableExists($cnx, 'article') && columnExists($cnx, 'article', 'userId')) {
        $statusFilter = columnExists($cnx, 'article', 'status') ? " AND status = 'published'" : '';
        $stmt = $cnx->prepare("SELECT COUNT(*) FROM article WHERE userId = :uid{$statusFilter}");
        $stmt->execute([':uid' => $userId]);
        $articlesCount = (int) $stmt->fetchColumn();
    }

    $evStmt = $cnx->prepare(
        "SELECT
            COALESCE(SUM(CASE WHEN event_type='view_article' THEN value ELSE 0 END),0) AS views,
            COALESCE(SUM(CASE WHEN event_type='like_article' THEN value ELSE 0 END),0) AS likes,
            COALESCE(SUM(CASE WHEN event_type='comment_article' THEN value ELSE 0 END),0) AS comments,
            COALESCE(SUM(CASE WHEN event_type='save_article' THEN value ELSE 0 END),0) AS saved,
            COALESCE(SUM(CASE WHEN event_type='publish_article' THEN value ELSE 0 END),0) AS publish_events
         FROM user_activity
         WHERE user_id = :uid"
    );
    $evStmt->execute([':uid' => $userId]);
    $ev = $evStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $articlesCount = max($articlesCount, (int) ($ev['publish_events'] ?? 0));

    $topArticles = [];
    $topStmt = $cnx->prepare(
        "SELECT
            COALESCE(NULLIF(entity_id, ''), CONCAT('evt-', id)) AS id,
            COALESCE(title, 'Untitled article') AS title,
            COALESCE(category, 'General') AS category,
            SUM(CASE WHEN event_type='like_article' THEN value ELSE 0 END) AS likesCount,
            SUM(CASE WHEN event_type='view_article' THEN value ELSE 0 END) AS views
         FROM user_activity
         WHERE user_id = :uid
           AND entity_type = 'article'
         GROUP BY entity_id, title, category
         ORDER BY views DESC, likesCount DESC
         LIMIT 5"
    );
    $topStmt->execute([':uid' => $userId]);
    $rows = $topStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($rows as $row) {
        $topArticles[] = [
            'id' => $row['id'],
            'title' => (string) $row['title'],
            'category' => (string) $row['category'],
            'likesCount' => (int) ($row['likesCount'] ?? 0),
            'views' => (int) ($row['views'] ?? 0),
            'readingTime' => '5 min',
        ];
    }

    return [
        'articles' => $articlesCount,
        'views' => (int) ($ev['views'] ?? 0),
        'likes' => (int) ($ev['likes'] ?? 0),
        'comments' => (int) ($ev['comments'] ?? 0),
        'saved' => (int) ($ev['saved'] ?? 0),
        'topArticles' => $topArticles,
    ];
}

function getChart(PDO $cnx, int $userId): array
{
    ensureActivityTable($cnx);
    $stmt = $cnx->prepare(
        "SELECT
            DATE_FORMAT(created_at, '%x-W%v') AS label,
            SUM(CASE WHEN event_type = 'view_article' THEN value ELSE 0 END) AS views,
            SUM(CASE WHEN event_type = 'like_article' THEN value ELSE 0 END) AS likes
         FROM user_activity
         WHERE user_id = :uid
           AND created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
         GROUP BY YEARWEEK(created_at, 3)
         ORDER BY YEARWEEK(created_at, 3)"
    );
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $weeks = [];
    foreach ($rows as $row) {
        $weeks[] = [
            'label' => (string) $row['label'],
            'views' => (int) ($row['views'] ?? 0),
            'likes' => (int) ($row['likes'] ?? 0),
        ];
    }
    return ['weeks' => $weeks];
}

function buildStreak(array $days): int
{
    $set = [];
    foreach ($days as $d) {
        if ((int) ($d['count'] ?? 0) > 0) {
            $set[(string) $d['date']] = true;
        }
    }

    $streak = 0;
    $cursor = new DateTime('today');
    while (true) {
        $key = $cursor->format('Y-m-d');
        if (!isset($set[$key])) {
            break;
        }
        $streak++;
        $cursor->modify('-1 day');
    }
    return $streak;
}

function getActivity(PDO $cnx, int $userId): array
{
    ensureActivityTable($cnx);

    $stmt = $cnx->prepare(
        "SELECT DATE(created_at) AS d, SUM(value) AS cnt
         FROM user_activity
         WHERE user_id = :uid
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)"
    );
    $stmt->execute([':uid' => $userId]);
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $map = [];
    foreach ($raw as $row) {
        $map[(string) $row['d']] = (int) ($row['cnt'] ?? 0);
    }

    $days = [];
    $start = new DateTime('today -364 day');
    for ($i = 0; $i < 365; $i++) {
        $d = clone $start;
        $d->modify("+{$i} day");
        $key = $d->format('Y-m-d');
        $days[] = ['date' => $key, 'count' => $map[$key] ?? 0];
    }

    return [
        'days' => $days,
        'streak' => buildStreak($days),
    ];
}

function getTopAuthors(PDO $cnx): array
{
    if (!tableExists($cnx, 'users') || !tableExists($cnx, 'article')) {
        return ['authors' => []];
    }

    $likesExpr = columnExists($cnx, 'article', 'likesCount') ? 'COALESCE(a.likesCount,0)' : '0';
    $statusFilter = columnExists($cnx, 'article', 'status') ? " AND a.status = 'published'" : '';

    $sql = "SELECT
                u.id,
                u.name,
                COALESCE(u.isPremium, 0) AS isPremium,
                COUNT(a.id) AS articleCount,
                COALESCE(SUM({$likesExpr}), 0) AS totalLikes
            FROM users u
            LEFT JOIN article a
                ON a.userId = u.id{$statusFilter}
            WHERE COALESCE(u.isAdmin, 0) = 0
            GROUP BY u.id, u.name, u.isPremium
            ORDER BY totalLikes DESC, articleCount DESC
            LIMIT 6";

    $rows = $cnx->query($sql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $authors = [];
    foreach ($rows as $row) {
        $name = (string) ($row['name'] ?? 'Unknown');
        $authors[] = [
            'id' => (int) ($row['id'] ?? 0),
            'name' => $name,
            'initial' => strtoupper($name[0] ?? 'U'),
            'isPremium' => (bool) ($row['isPremium'] ?? 0),
            'articleCount' => (int) ($row['articleCount'] ?? 0),
            'totalLikes' => (int) ($row['totalLikes'] ?? 0),
        ];
    }

    return ['authors' => $authors];
}

try {
    require_once __DIR__ . '/../../../config/database.php';
    if (!($cnx instanceof PDO)) {
        jsonErr(databaseConnectionError() ?? 'Database connection failed.', 500);
    }
    $body = readJsonBody();
    $action = trim((string) ($body['action'] ?? 'summary'));
    $userId = resolveUserId($body);

    if ($action === 'track_event') {
        jsonOk(trackEvent($cnx, $userId, $body));
    }

    if ($action === 'my_stats') {
        if ($userId <= 0) {
            jsonOk([
                'articles' => 0,
                'views' => 0,
                'likes' => 0,
                'comments' => 0,
                'saved' => 0,
                'topArticles' => [],
            ]);
        }
        jsonOk(getMyStats($cnx, $userId));
    }

    if ($action === 'chart') {
        if ($userId <= 0) jsonOk(['weeks' => []]);
        jsonOk(getChart($cnx, $userId));
    }

    if ($action === 'activity') {
        if ($userId <= 0) jsonOk(['days' => [], 'streak' => 0]);
        jsonOk(getActivity($cnx, $userId));
    }

    if ($action === 'top_authors' || $action === 'topAuthors') {
        jsonOk(getTopAuthors($cnx));
    }

    jsonOk(platformSummary($cnx));
} catch (Throwable $e) {
    jsonErr('Stats API error: ' . $e->getMessage(), 500);
}
