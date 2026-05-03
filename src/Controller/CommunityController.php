<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/../Database/Database.php';
require_once __DIR__ . '/../Repository/CommunityRepository.php';
require_once __DIR__ . '/../Service/CommunityService.php';
require_once __DIR__ . '/../Utils/Validator.php';

use IBlog\Repository\CommunityRepository;
use IBlog\Service\CommunityService;

function communityRepository(PDO $cnx): CommunityRepository
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new CommunityRepository($cnx);
    }

    return $instances[$key];
}

function communityService(PDO $cnx): CommunityService
{
    static $instances = [];
    $key = spl_object_id($cnx);
    if (!isset($instances[$key])) {
        $instances[$key] = new CommunityService(communityRepository($cnx));
    }

    return $instances[$key];
}

function readJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (($raw === false || $raw === '') && PHP_SAPI === 'cli') {
        $raw = (string) (getenv('IBLOG_TEST_REQUEST_BODY') ?: '');
    }

    $decoded = json_decode($raw ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function resolveRequestUserId(PDO $cnx, ?array $input = null): int
{
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }

    $input ??= readJsonInput();
    $requestedUserId = (int) ($input['userId'] ?? $_REQUEST['userId'] ?? 0);
    $requestedEmail = trim((string) ($input['userEmail'] ?? $_REQUEST['userEmail'] ?? ''));
    $hasExplicitIdentity = ($requestedUserId > 0) || ($requestedEmail !== '');

    if ($requestedEmail !== '') {
        if (!filter_var($requestedEmail, FILTER_VALIDATE_EMAIL)) {
            return 0;
        }

        try {
            $stmt = $cnx->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $requestedEmail]);
            $resolvedId = (int) ($stmt->fetchColumn() ?: 0);
            if ($resolvedId <= 0 || ($requestedUserId > 0 && $resolvedId !== $requestedUserId)) {
                return 0;
            }

            return $resolvedId;
        } catch (Throwable) {
            return 0;
        }
    }

    if ($requestedUserId > 0) {
        try {
            $stmt = $cnx->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $requestedUserId]);
            return (int) ($stmt->fetchColumn() ?: 0);
        } catch (Throwable) {
            return 0;
        }
    }

    if ($hasExplicitIdentity) {
        return 0;
    }

    return (int) ($_SESSION['user_id'] ?? 0);
}

function createCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }

    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    if (!communityService($cnx)->isUserPremium($userId)) {
        echo json_encode(['success' => false, 'error' => 'Premium subscription required']);
        return;
    }

    $name = trim((string) ($input['name'] ?? ''));
    $description = trim((string) ($input['description'] ?? ''));
    $topics = trim((string) ($input['topics'] ?? ''));
    $communityId = communityService($cnx)->create([
        'creatorId' => $userId,
        'name' => $name,
        'description' => $description,
        'icon' => strtoupper(substr($name, 0, 2)),
        'topics' => $topics !== '' ? implode(',', array_map('trim', explode(',', $topics))) : null,
    ]);

    if ($communityId === false) {
        echo json_encode(['success' => false, 'error' => 'Name and description required']);
        return;
    }

    communityService($cnx)->addCreatorMembership($communityId, $userId);
    echo json_encode(['success' => true, 'id' => $communityId]);
}

function getAllCommunitiesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    echo json_encode(communityService($cnx)->findAll());
}

function getUserCommunitiesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $userId = resolveRequestUserId($cnx);
    echo json_encode($userId > 0 ? communityService($cnx)->findByUser($userId) : []);
}

function joinCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['community_id'] ?? 0);

    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    echo json_encode(communityService($cnx)->join($userId, $communityId));
}

function leaveCommunityAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['community_id'] ?? 0);

    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid community ID']);
        return;
    }

    echo json_encode(['success' => communityService($cnx)->leave($userId, $communityId)]);
}

function getMessagesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $communityId = (int) ($_GET['communityId'] ?? 0);
    $currentUserId = resolveRequestUserId($cnx);

    if ($communityId <= 0) {
        echo json_encode(['success' => false, 'messages' => []]);
        return;
    }

    echo json_encode([
        'success' => true,
        'messages' => communityService($cnx)->findMessages($communityId, $currentUserId),
    ]);
}

function sendMessageAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    $userId = resolveRequestUserId($cnx, $input);
    $communityId = (int) ($input['communityId'] ?? 0);
    $message = trim((string) ($input['message'] ?? ''));

    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    if ($communityId <= 0 || $message === '') {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        return;
    }

    $saved = communityService($cnx)->sendMessage($communityId, $userId, $message);
    if ($saved === false) {
        echo json_encode(['success' => false, 'error' => 'Message could not be saved']);
        return;
    }

    echo json_encode(['success' => true, 'message' => $saved]);
}

function checkMembershipAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $communityId = (int) ($_GET['communityId'] ?? 0);
    $userId = resolveRequestUserId($cnx);
    echo json_encode($communityId > 0 && $userId > 0 ? communityService($cnx)->checkMembership($communityId, $userId) : ['isMember' => false, 'isBanned' => false]);
}

function getThreadsAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $communityId = (int) ($_GET['communityId'] ?? 0);
    $userId = resolveRequestUserId($cnx);

    if ($communityId <= 0 || $userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid request']);
        return;
    }

    echo json_encode(communityService($cnx)->findThreads($communityId, $userId));
}

function createThreadAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    echo json_encode(communityService($cnx)->createThread(
        (int) ($input['communityId'] ?? 0),
        resolveRequestUserId($cnx, $input),
        (string) ($input['title'] ?? '')
    ));
}

function deleteThreadAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    echo json_encode(communityService($cnx)->deleteThread(
        (int) ($input['communityId'] ?? 0),
        (int) ($input['threadId'] ?? 0),
        resolveRequestUserId($cnx, $input)
    ));
}

function getThreadMessagesAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    echo json_encode(communityService($cnx)->findThreadMessages(
        (int) ($_GET['communityId'] ?? 0),
        (int) ($_GET['threadId'] ?? 0),
        resolveRequestUserId($cnx)
    ));
}

function sendThreadMessageAction(PDO $cnx): void
{
    header('Content-Type: application/json');
    $input = readJsonInput();
    echo json_encode(communityService($cnx)->sendThreadMessage(
        (int) ($input['communityId'] ?? 0),
        (int) ($input['threadId'] ?? 0),
        resolveRequestUserId($cnx, $input),
        (string) ($input['message'] ?? '')
    ));
}

if (basename($_SERVER['SCRIPT_FILENAME']) === 'CommunityController.php') {
    header('Content-Type: application/json');

    try {
        if (!($cnx instanceof PDO)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed',
                'detail' => databaseConnectionError(),
            ]);
            return;
        }

        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'getAll':
                getAllCommunitiesAction($cnx);
                break;
            case 'getUserCommunities':
                getUserCommunitiesAction($cnx);
                break;
            case 'create':
                createCommunityAction($cnx);
                break;
            case 'join':
                joinCommunityAction($cnx);
                break;
            case 'leave':
                leaveCommunityAction($cnx);
                break;
            case 'getMessages':
                getMessagesAction($cnx);
                break;
            case 'sendMessage':
                sendMessageAction($cnx);
                break;
            case 'checkMembership':
                checkMembershipAction($cnx);
                break;
            case 'getThreads':
                getThreadsAction($cnx);
                break;
            case 'createThread':
                createThreadAction($cnx);
                break;
            case 'deleteThread':
                deleteThreadAction($cnx);
                break;
            case 'getThreadMessages':
                getThreadMessagesAction($cnx);
                break;
            case 'sendThreadMessage':
                sendThreadMessageAction($cnx);
                break;
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Action not found: ' . htmlspecialchars((string) $action)]);
        }
    } catch (Throwable $e) {
        error_log('[CommunityController router] ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Controller failure', 'detail' => $e->getMessage()]);
    }
}
