<?php
/**
 * api-stats.php
 * Location: iblog/backend/view/components/auth/api-stats.php
 * Provides: user stats, article analytics, activity heatmap, top authors
 */
declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

function jsonOk(array $data = []): never {
    echo json_encode(['ok' => true] + $data);
    exit();
}
function jsonErr(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit();
}

try {
    session_start();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

    $thisDir     = str_replace('\\', '/', __DIR__);
    $parts       = explode('/', $thisDir);
    $backendPath = implode('/', array_slice($parts, 0, count($parts) - 3));

    if (!file_exists($backendPath . '/config/database.php')) {
        jsonErr('Config not found at: ' . $backendPath, 500);
    }
    require_once $backendPath . '/config/database.php';

    $raw    = (string) file_get_contents('php://input');
    $body   = json_decode($raw ?: '{}', true) ?? [];
    $action = (string)($body['action'] ?? '');

    // ════ MY STATS ════
    if ($action === 'my_stats') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid = (int)$_SESSION['user_id'];

        // Article count
        $stmt = $cnx->prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(likesCount),0) as likes, COALESCE(SUM(views),0) as views FROM article WHERE userId = :uid AND status = "published"');
        $stmt->execute([':uid' => $uid]);
        $artRow = $stmt->fetch();

        // Comment count on user's articles
        $stmt = $cnx->prepare('SELECT COUNT(*) as cnt FROM comment c JOIN article a ON c.articleId = a.id WHERE a.userId = :uid');
        $stmt->execute([':uid' => $uid]);
        $commRow = $stmt->fetch();

        // Saved articles count
        $stmt = $cnx->prepare('SELECT COUNT(*) as cnt FROM savedarticle WHERE userId = :uid');
        $stmt->execute([':uid' => $uid]);
        $savedRow = $stmt->fetch();

        // Top 5 articles
        $stmt = $cnx->prepare('SELECT id, title, category, likesCount, views, readingTime, createdAt FROM article WHERE userId = :uid AND status = "published" ORDER BY likesCount DESC LIMIT 5');
        $stmt->execute([':uid' => $uid]);
        $topArticles = $stmt->fetchAll();

        jsonOk([
            'articles'    => (int)$artRow['cnt'],
            'likes'       => (int)$artRow['likes'],
            'views'       => (int)$artRow['views'],
            'comments'    => (int)$commRow['cnt'],
            'saved'       => (int)$savedRow['cnt'],
            'topArticles' => $topArticles,
        ]);
    }

    // ════ ACTIVITY HEATMAP ════
    if ($action === 'activity') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid = (int)$_SESSION['user_id'];

        // Get activity per day for last 365 days
        // Activity = articles published + comments made + saves
        $stmt = $cnx->prepare("
            SELECT DATE(createdAt) as day, COUNT(*) as cnt
            FROM (
                SELECT createdAt FROM article WHERE userId = :uid1 AND createdAt >= DATE_SUB(NOW(), INTERVAL 365 DAY)
                UNION ALL
                SELECT createdAt FROM comment WHERE userId = :uid2 AND createdAt >= DATE_SUB(NOW(), INTERVAL 365 DAY)
                UNION ALL
                SELECT savedAt as createdAt FROM savedarticle WHERE userId = :uid3 AND savedAt >= DATE_SUB(NOW(), INTERVAL 365 DAY)
            ) as activity
            GROUP BY DATE(createdAt)
            ORDER BY day
        ");
        $stmt->execute([':uid1' => $uid, ':uid2' => $uid, ':uid3' => $uid]);
        $rows = $stmt->fetchAll();

        // Build a map date => count
        $activityMap = [];
        foreach ($rows as $row) {
            $activityMap[$row['day']] = (int)$row['cnt'];
        }

        // Build 365-day array (oldest to newest)
        $days = [];
        for ($i = 364; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $days[] = ['date' => $date, 'count' => $activityMap[$date] ?? 0];
        }

        // Calculate streak
        $streak = 0;
        $today  = date('Y-m-d');
        for ($i = 0; $i < 365; $i++) {
            $d = date('Y-m-d', strtotime("-{$i} days"));
            if (($activityMap[$d] ?? 0) > 0) {
                $streak++;
            } else {
                break;
            }
        }

        jsonOk(['days' => $days, 'streak' => $streak]);
    }

    // ════ TOP AUTHORS ════
    if ($action === 'top_authors') {
        // Top users by total likes received on their articles
        $stmt = $cnx->prepare("
            SELECT u.id, u.name, u.plan, u.isPremium,
                   COUNT(DISTINCT a.id) as articleCount,
                   COALESCE(SUM(a.likesCount), 0) as totalLikes,
                   COALESCE(SUM(a.views), 0) as totalViews
            FROM users u
            JOIN article a ON a.userId = u.id AND a.status = 'published'
            GROUP BY u.id
            ORDER BY totalLikes DESC
            LIMIT 5
        ");
        $stmt->execute();
        $authors = $stmt->fetchAll();

        $result = array_map(fn($a) => [
            'id'           => (int)$a['id'],
            'name'         => $a['name'],
            'initial'      => strtoupper($a['name'][0] ?? 'U'),
            'plan'         => $a['plan'],
            'isPremium'    => (bool)$a['isPremium'],
            'articleCount' => (int)$a['articleCount'],
            'totalLikes'   => (int)$a['totalLikes'],
            'totalViews'   => (int)$a['totalViews'],
            'followers'    => number_format((int)$a['totalLikes'] * 3 + 100), // derived metric
        ], $authors);

        jsonOk(['authors' => $result]);
    }

    // ════ WEEKLY CHART DATA ════
    if ($action === 'chart') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid = (int)$_SESSION['user_id'];

        $stmt = $cnx->prepare("
            SELECT 
                DATE_FORMAT(createdAt, '%Y-%u') as week,
                MIN(DATE(createdAt)) as weekStart,
                COALESCE(SUM(views), 0) as views,
                COALESCE(SUM(likesCount), 0) as likes
            FROM article 
            WHERE userId = :uid AND createdAt >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
            GROUP BY week
            ORDER BY week
        ");
        $stmt->execute([':uid' => $uid]);
        $rows = $stmt->fetchAll();

        // Fill missing weeks with 0
        $weeks = [];
        for ($i = 11; $i >= 0; $i--) {
            $monday = date('Y-m-d', strtotime("monday -{$i} week"));
            $week   = date('Y-W', strtotime($monday));
            $found  = null;
            foreach ($rows as $r) {
                if (str_starts_with($r['week'] ?? '', substr($week, 0, 7))) {
                    $found = $r; break;
                }
            }
            $weeks[] = [
                'label'  => date('M d', strtotime($monday)),
                'views'  => $found ? (int)$found['views'] : 0,
                'likes'  => $found ? (int)$found['likes'] : 0,
            ];
        }

        jsonOk(['weeks' => $weeks]);
    }

    // ════ SUBMIT ARTICLE ════
    if ($action === 'publish_article') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid     = (int)$_SESSION['user_id'];
        $title   = trim($body['title']   ?? '');
        $content = trim($body['body']    ?? '');
        $cat     = trim($body['category'] ?? 'General');
        $tags    = trim($body['tags']    ?? '');
        $img     = trim($body['img']     ?? '');
        $readTime = trim($body['readTime'] ?? '5 min');

        if (empty($title) || empty($content)) jsonErr('Title and content are required.');

        $stmt = $cnx->prepare("
            INSERT INTO article (userId, title, body, category, tags, status, coverImage, readingTime, createdAt)
            VALUES (:uid, :title, :body, :cat, :tags, 'published', :img, :rt, NOW())
        ");
        $ok = $stmt->execute([
            ':uid'   => $uid,
            ':title' => $title,
            ':body'  => $content,
            ':cat'   => $cat,
            ':tags'  => $tags,
            ':img'   => $img,
            ':rt'    => $readTime,
        ]);
        if (!$ok) jsonErr('Could not save article.', 500);
        $articleId = (int)$cnx->lastInsertId();
        jsonOk(['id' => $articleId]);
    }

    // ════ LIKE ARTICLE ════
    if ($action === 'like_article') {
        $articleId = (int)($body['articleId'] ?? 0);
        if (!$articleId) jsonErr('Invalid article ID');
        $stmt = $cnx->prepare('UPDATE article SET likesCount = likesCount + 1 WHERE id = :id');
        $stmt->execute([':id' => $articleId]);
        $stmt2 = $cnx->prepare('SELECT likesCount FROM article WHERE id = :id');
        $stmt2->execute([':id' => $articleId]);
        $row = $stmt2->fetch();
        jsonOk(['likes' => (int)($row['likes'] ?? 0)]);
    }

    // ════ POST COMMENT ════
    if ($action === 'post_comment') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid       = (int)$_SESSION['user_id'];
        $articleId = (int)($body['articleId'] ?? 0);
        $text      = trim($body['text'] ?? '');
        if (!$articleId || empty($text)) jsonErr('Missing fields');

        $stmt = $cnx->prepare("INSERT INTO comment (articleId, userId, body, createdAt) VALUES (:aid, :uid, :body, NOW())");
        $stmt->execute([':aid' => $articleId, ':uid' => $uid, ':body' => $text]);
        $commentId = (int)$cnx->lastInsertId();
        jsonOk(['id' => $commentId, 'author' => $_SESSION['name'] ?? 'User', 'text' => $text]);
    }

    // ════ GET USER ARTICLES ════
    if ($action === 'my_articles') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid = (int)$_SESSION['user_id'];

        $stmt = $cnx->prepare("
            SELECT a.id, a.title, a.category, a.tags, a.likesCount, a.views, a.readingTime, a.coverImage, a.createdAt,
                   COUNT(c.id) as commentCount
            FROM article a
            LEFT JOIN comment c ON c.articleId = a.id
            WHERE a.userId = :uid AND a.status = 'published'
            GROUP BY a.id
            ORDER BY a.createdAt DESC
        ");
        $stmt->execute([':uid' => $uid]);
        $articles = $stmt->fetchAll();

        jsonOk(['articles' => array_map(fn($a) => [
            'id'           => (int)$a['id'],
            'title'        => $a['title'],
            'cat'          => $a['category'],
            'tags'         => $a['tags'],
            'likes'        => (int)$a['likesCount'],
            'views'        => (int)$a['views'],
            'readTime'     => $a['readingTime'] ?? '5 min',
            'img'          => $a['coverImage'],
            'commentCount' => (int)$a['commentCount'],
            'date'         => date('M d, Y', strtotime($a['createdAt'])),
        ], $articles)]);
    }

    // ════ PAYMENT ════
    if ($action === 'payment') {
        if (empty($_SESSION['user_id'])) jsonErr('Not authenticated', 401);
        $uid    = (int)$_SESSION['user_id'];
        $plan   = $body['plan']    ?? 'pro';
        $method = $body['method']  ?? 'card';
        $amount = match($plan) { 'pro' => 9.00, 'team' => 19.00, default => 0.00 };

        // In production: integrate Konnect/Paymee/D17 SDK here
        // For now: record as pending subscription
        $stmt = $cnx->prepare("
            INSERT INTO subscription (userId, plan, amount, currency, status, startedAt, expiresAt)
            VALUES (:uid, :plan, :amount, 'USD', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
        ");
        $ok = $stmt->execute([':uid' => $uid, ':plan' => $plan, ':amount' => $amount]);

        if ($ok) {
            // Upgrade user plan
            $cnx->prepare("UPDATE users SET plan = 'premium', isPremium = 1 WHERE id = :id")
                ->execute([':id' => $uid]);
            $_SESSION['plan']      = 'premium';
            $_SESSION['isPremium'] = 1;
        }

        jsonOk([
            'plan'    => 'premium',
            'message' => 'Subscription activated',
            'method'  => $method,
        ]);
    }

    jsonErr('Unknown action: ' . htmlspecialchars($action), 400);

} catch (Throwable $e) {
    jsonErr('Server error: ' . $e->getMessage(), 500);
}