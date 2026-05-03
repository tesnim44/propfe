<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

final class Mailer
{
    public static function send(string $to, string $subject, string $html, string $text = ''): void
    {
        loadEnvFile();

        if (filter_var((string) env('MAIL_DISABLE', 'false'), FILTER_VALIDATE_BOOLEAN) || env('APP_ENV') === 'test') {
            return;
        }

        $host = env('MAIL_HOST');
        $port = (int) (env('MAIL_PORT', '587') ?? '587');
        $user = env('MAIL_USERNAME');
        $pass = env('MAIL_PASSWORD');
        $from = env('MAIL_FROM_ADDRESS', 'no-reply@iblog.local');
        $fromName = env('MAIL_FROM_NAME', 'IBlog');
        $secure = strtolower((string) env('MAIL_ENCRYPTION', 'tls'));

        if (!$host || !$user || !$pass) {
          throw new RuntimeException('Mail server is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USERNAME and MAIL_PASSWORD.');
        }

        $transport = $secure === 'ssl' ? 'ssl://' : '';
        $socket = @fsockopen($transport . $host, $port, $errno, $errstr, 20);
        if (!$socket) {
            throw new RuntimeException('Unable to connect to the mail server: ' . $errstr);
        }

        self::expect($socket, [220]);
        self::command($socket, 'EHLO iblog.local', [250]);

        if ($secure === 'tls') {
            self::command($socket, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Unable to start TLS for email delivery.');
            }
            self::command($socket, 'EHLO iblog.local', [250]);
        }

        self::command($socket, 'AUTH LOGIN', [334]);
        self::command($socket, base64_encode($user), [334]);
        self::command($socket, base64_encode($pass), [235]);
        self::command($socket, 'MAIL FROM:<' . $from . '>', [250]);
        self::command($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        self::command($socket, 'DATA', [354]);

        $boundary = 'iblog-' . bin2hex(random_bytes(8));
        $plainBody = $text !== '' ? $text : trim(html_entity_decode(strip_tags($html)));
        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . self::formatAddress($from, $fromName),
            'To: ' . self::formatAddress($to, $to),
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];

        $message = implode("\r\n", $headers) . "\r\n\r\n"
            . '--' . $boundary . "\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
            . $plainBody . "\r\n\r\n"
            . '--' . $boundary . "\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n\r\n"
            . $html . "\r\n\r\n"
            . '--' . $boundary . "--\r\n.";

        fwrite($socket, $message . "\r\n");
        self::expect($socket, [250]);
        self::command($socket, 'QUIT', [221]);
        fclose($socket);
    }

    private static function command($socket, string $command, array $expectedCodes): void
    {
        fwrite($socket, $command . "\r\n");
        self::expect($socket, $expectedCodes);
    }

    private static function expect($socket, array $expectedCodes): void
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }

        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $expectedCodes, true)) {
            throw new RuntimeException('Mail server rejected the request: ' . trim($response));
        }
    }

    private static function formatAddress(string $email, string $name): string
    {
        return sprintf('"%s" <%s>', addslashes($name), $email);
    }
}
