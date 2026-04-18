<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── Auth guard ────────────────────────────────────────────────────────────────
if (empty($_SESSION['adminLoggedIn']) || $_SESSION['adminLoggedIn'] !== true) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Forbidden - not logged in as admin']);
    exit();
}

// ── Load DB ───────────────────────────────────────────────────────────────────
// __DIR__ = .../iblog/backend/view/components/admin
// 3 levels up  = .../iblog/backend
require_once __DIR__ . '/../../../config/database.php';

// database.php sets the file-scope variable $cnx.
// Bring it into this file's scope explicitly so all code below can use it.
// (getDatabaseConnection() uses a static, so this is a no-op on re-call)
if (!isset($cnx) || !($cnx instanceof PDO)) {
    $cnx = getDatabaseConnection();
}

header('Content-Type: application/json');

// Accept action from GET or POST
$action = trim((string)($_GET['action'] ?? $_POST['action'] ?? ''));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Add the `status` column to `users` if it doesn't exist yet.
 * Accepts $cnx explicitly — never relies on globals inside functions.
 */
function ensureStatusColumn(PDO $db): void
{
    try {
        $db->query("SELECT status FROM users LIMIT 1");
    } catch (PDOException $e) {
        $db->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'");
    }
}

/**
 * Add the `label` column to `article` if it doesn't exist yet.
 */
function ensureLabelColumn(PDO $db): void
{
    try {
        $db->query("SELECT label FROM article LIMIT 1");
    } catch (PDOException $e) {
        $db->exec("ALTER TABLE article ADD COLUMN label VARCHAR(20) NOT NULL DEFAULT 'none'");
    }
}

/**
 * Check whether the article table exists at all.
 */
function articleTableExists(PDO $db): bool
{
    try {
        $db->query("SELECT 1 FROM article LIMIT 1");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

// ── Router ────────────────────────────────────────────────────────────────────
try {

    switch ($action) {

        // ── GET USERS ─────────────────────────────────────────────────────────
        case 'get_users':
            ensureStatusColumn($cnx);

            if (articleTableExists($cnx)) {
                $sql = "
                    SELECT u.id,
                           u.name,
                           u.email,
                           u.plan,
                           COALESCE(u.isPremium, 0)     AS isPremium,
                           COALESCE(u.isAdmin,   0)     AS isAdmin,
                           COALESCE(u.status, 'active') AS status,
                           u.createdAt,
                           u.createdAt AS created_at,
                           (SELECT COUNT(*) FROM article a WHERE a.userId = u.id) AS article_count
                    FROM users u
                    ORDER BY u.id DESC";
            } else {
                $sql = "
                    SELECT id,
                           name,
                           email,
                           plan,
                           COALESCE(isPremium, 0)     AS isPremium,
                           COALESCE(isAdmin,   0)     AS isAdmin,
                           COALESCE(status, 'active') AS status,
                           createdAt,
                           createdAt AS created_at,
                           0 AS article_count
                    FROM users
                    ORDER BY id DESC";
            }

            $users = $cnx->query($sql)->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['users' => $users]);
            break;

        // ── GET STATS ─────────────────────────────────────────────────────────
        case 'get_stats':
            $totalUsers   = (int) $cnx->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $premiumCount = (int) $cnx->query("SELECT COUNT(*) FROM users WHERE plan = 'premium'")->fetchColumn();

            $totalArticles = 0;
            if (articleTableExists($cnx)) {
                $totalArticles = (int) $cnx->query("SELECT COUNT(*) FROM article")->fetchColumn();
            }

            echo json_encode([
                'total_users'     => $totalUsers,
                'total_articles'  => $totalArticles,
                'premium_count'   => $premiumCount,
                'monthly_revenue' => '$' . number_format($premiumCount * 9),
            ]);
            break;

        // ── GET ARTICLES ──────────────────────────────────────────────────────
        case 'get_articles':
            if (!articleTableExists($cnx)) {
                // No article table yet — return empty, don't crash
                echo json_encode(['articles' => []]);
                break;
            }

            ensureLabelColumn($cnx);

            $stmt = $cnx->query("
                SELECT a.id,
                       a.title,
                       COALESCE(a.category, 'Uncategorized') AS category,
                       COALESCE(a.views,    0)               AS views,
                       COALESCE(a.label,    'none')          AS label,
                       a.createdAt                           AS created_at,
                       u.name                                AS author,
                       u.id                                  AS author_id
                FROM article a
                LEFT JOIN users u ON u.id = a.userId
                ORDER BY a.createdAt DESC
            ");
            // KEY FIX: was 'article', JS reads 'articles'
            echo json_encode(['articles' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        // ── GET REVENUE ───────────────────────────────────────────────────────
        case 'get_revenue':
            $stmt = $cnx->query("
                SELECT id,
                       name,
                       email,
                       createdAt AS created_at
                FROM users
                WHERE plan = 'premium'
                ORDER BY id DESC
            ");
            echo json_encode(['members' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        // ── TOGGLE BAN ────────────────────────────────────────────────────────
        case 'toggle_ban':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) { echo json_encode(['error' => 'Invalid ID']); break; }

            ensureStatusColumn($cnx);

            $stmt = $cnx->prepare("SELECT status FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $current = $stmt->fetchColumn();

            $newStatus = ($current === 'banned') ? 'active' : 'banned';
            $cnx->prepare("UPDATE users SET status = ? WHERE id = ?")->execute([$newStatus, $id]);
            echo json_encode(['ok' => true, 'new_status' => $newStatus]);
            break;

        // ── DELETE USER ───────────────────────────────────────────────────────
        case 'delete_user':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) { echo json_encode(['error' => 'Invalid ID']); break; }

            $cnx->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
            echo json_encode(['ok' => true]);
            break;

        // ── SET ARTICLE LABEL ─────────────────────────────────────────────────
        case 'set_label':
            $id    = (int)($_POST['id'] ?? 0);
            $label = trim($_POST['label'] ?? '');
            $allowed = ['featured', 'pinned', 'boosted', 'hidden', 'none'];

            if ($id <= 0 || !in_array($label, $allowed, true)) {
                echo json_encode(['error' => 'Invalid parameters']);
                break;
            }
            $cnx->prepare("UPDATE article SET label = ? WHERE id = ?")->execute([$label, $id]);
            echo json_encode(['ok' => true]);
            break;

        // ── CHANGE CATEGORY ───────────────────────────────────────────────────
        case 'change_cat':
            $id  = (int)($_POST['id'] ?? 0);
            $cat = trim($_POST['cat'] ?? '');
            if ($id <= 0 || $cat === '') {
                echo json_encode(['error' => 'Invalid parameters']);
                break;
            }
            $cnx->prepare("UPDATE article SET category = ? WHERE id = ?")->execute([$cat, $id]);
            echo json_encode(['ok' => true]);
            break;

        // ── CANCEL SUBSCRIPTION ───────────────────────────────────────────────
        case 'cancel_sub':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) { echo json_encode(['error' => 'Invalid ID']); break; }

            $cnx->prepare("UPDATE users SET plan = 'free', isPremium = 0 WHERE id = ?")->execute([$id]);
            echo json_encode(['ok' => true]);
            break;

        // ── PING (health check) ───────────────────────────────────────────────
        case 'ping':
            echo json_encode([
                'ok'    => true,
                'msg'   => 'API reachable',
                'admin' => !empty($_SESSION['adminLoggedIn']),
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action: ' . htmlspecialchars($action)]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}