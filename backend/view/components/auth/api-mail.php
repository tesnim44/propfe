<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../lib/Mailer.php';

function jsonResponse(array $payload, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['ok' => false, 'error' => 'Method not allowed.'], 405);
    }

    $body = json_decode((string) file_get_contents('php://input'), true) ?? [];
    $type = (string) ($body['type'] ?? '');
    $to = trim((string) ($body['to'] ?? ''));
    $name = trim((string) ($body['name'] ?? 'Member'));

    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['ok' => false, 'error' => 'Invalid recipient email.'], 422);
    }

    $subject = 'IBlog notification';
    $html = '<p>Hello ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '.</p>';
    $text = "Hello {$name}.";

    if ($type === 'premium_activated') {
        $plan = (string) ($body['plan'] ?? 'Premium');
        $amount = (string) ($body['amount'] ?? '9');
        $method = strtoupper((string) ($body['method'] ?? 'card'));
        $subject = 'Your IBlog premium access is active';
        $html = '<div style="font-family:Arial,sans-serif;color:#1c1a16;line-height:1.6">'
            . '<h2>Premium activated</h2>'
            . '<p>Hello ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ',</p>'
            . '<p>Your ' . htmlspecialchars($plan, ENT_QUOTES, 'UTF-8') . ' plan is now active.</p>'
            . '<p>Amount: <strong>$' . htmlspecialchars($amount, ENT_QUOTES, 'UTF-8') . '</strong><br>Method: <strong>' . htmlspecialchars($method, ENT_QUOTES, 'UTF-8') . '</strong></p>'
            . '</div>';
        $text = "Hello {$name},\n\nYour {$plan} plan is now active.\nAmount: \${$amount}\nMethod: {$method}";
    } elseif ($type === 'welcome') {
        $subject = 'Welcome to IBlog';
        $html = '<div style="font-family:Arial,sans-serif;color:#1c1a16;line-height:1.6"><h2>Welcome to IBlog</h2><p>Hello ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ',</p><p>Your account is ready.</p></div>';
        $text = "Hello {$name},\n\nYour IBlog account is ready.";
    }

    Mailer::send($to, $subject, $html, $text);
    jsonResponse(['ok' => true]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => $e->getMessage()], 500);
}
