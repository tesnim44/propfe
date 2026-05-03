<?php
declare(strict_types=1);

$raw = stream_get_contents(STDIN);
$request = json_decode($raw ?: '{}', true);
if (!is_array($request)) {
    fwrite(STDERR, 'Invalid request payload.');
    exit(1);
}

$url = (string) ($request['url'] ?? '');
$parts = parse_url($url);
$path = (string) ($parts['path'] ?? '');
$queryString = (string) ($parts['query'] ?? '');
$root = dirname(__DIR__, 2);
$target = realpath($root . DIRECTORY_SEPARATOR . ltrim($path, '/'));
if ($target === false || !str_starts_with($target, $root . DIRECTORY_SEPARATOR) || !is_file($target)) {
    fwrite(STDERR, 'Request target not found: ' . $path);
    exit(1);
}

$sessionDir = getenv('IBLOG_TEST_SESSION_DIR');
if (is_string($sessionDir) && $sessionDir !== '') {
    if (!is_dir($sessionDir)) {
        @mkdir($sessionDir, 0777, true);
    }
    ini_set('session.save_path', $sessionDir);
}

$collectCoverage = extension_loaded('xdebug') && getenv('IBLOG_TEST_COLLECT_COVERAGE') === '1' && function_exists('xdebug_start_code_coverage');
if ($collectCoverage) {
    xdebug_start_code_coverage(XDEBUG_CC_UNUSED | XDEBUG_CC_DEAD_CODE);
}

$cookies = is_array($request['cookies'] ?? null) ? $request['cookies'] : [];
$method = strtoupper((string) ($request['method'] ?? 'GET'));
$body = (string) ($request['body'] ?? '');
$headers = is_array($request['headers'] ?? null) ? $request['headers'] : [];
$contentType = '';
foreach ($headers as $header) {
    if (stripos((string) $header, 'Content-Type:') === 0) {
        $contentType = trim((string) substr((string) $header, strlen('Content-Type:')));
        break;
    }
}

parse_str($queryString, $query);
$_GET = is_array($query) ? $query : [];
$_POST = [];
$_COOKIE = $cookies;
$_REQUEST = $_GET;
$_SERVER = [
    'REQUEST_METHOD' => $method,
    'REQUEST_URI' => $path . ($queryString !== '' ? '?' . $queryString : ''),
    'QUERY_STRING' => $queryString,
    'SCRIPT_NAME' => '/' . ltrim(str_replace('\\', '/', substr($target, strlen($root))), '/'),
    'SCRIPT_FILENAME' => $target,
    'DOCUMENT_ROOT' => $root,
    'CONTENT_TYPE' => $contentType,
    'HTTP_HOST' => 'localhost',
];

if ($contentType === 'application/x-www-form-urlencoded') {
    parse_str($body, $form);
    $_POST = is_array($form) ? $form : [];
    $_REQUEST = array_merge($_GET, $_POST);
}

$sessionName = session_name();
if (isset($_COOKIE[$sessionName]) && is_string($_COOKIE[$sessionName]) && $_COOKIE[$sessionName] !== '') {
    session_id($_COOKIE[$sessionName]);
}

putenv('IBLOG_TEST_REQUEST_BODY=' . $body);
$_ENV['IBLOG_TEST_REQUEST_BODY'] = $body;

ob_start();
register_shutdown_function(static function (): void {
    $responseBody = (string) ob_get_contents();
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    $headers = headers_list();
    $sessionId = session_id();
    $sessionName = session_name();
    if ($sessionId !== '') {
        $headers[] = 'Set-Cookie: ' . $sessionName . '=' . $sessionId;
    }

    $coverage = null;
    if (extension_loaded('xdebug') && getenv('IBLOG_TEST_COLLECT_COVERAGE') === '1' && function_exists('xdebug_get_code_coverage')) {
        $coverage = xdebug_get_code_coverage();
        if (function_exists('xdebug_stop_code_coverage')) {
            xdebug_stop_code_coverage(false);
        }
    }

    echo json_encode([
        'status' => http_response_code() ?: 200,
        'headers' => $headers,
        'body' => $responseBody,
        'coverage' => $coverage,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
});

require $target;
