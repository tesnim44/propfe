<?php
declare(strict_types=1);

namespace IBlog\Tests\Support;

use PHPUnit\Runner\CodeCoverage as PhpUnitCodeCoverageRunner;
use RuntimeException;
use SebastianBergmann\CodeCoverage\Data\RawCodeCoverageData;

final class WebClient
{
    private string $baseUrl;
    private ?string $localRootPath;
    private array $cookies = [];

    public function __construct(string $baseUrl, ?string $localRootPath = null)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->localRootPath = $localRootPath;
    }

    public function get(string $path, array $query = []): HttpResponse
    {
        $url = $this->baseUrl . $path;
        if ($query !== []) {
            $url .= '?' . http_build_query($query);
        }

        return $this->request('GET', $url);
    }

    public function postJson(string $path, array $payload): HttpResponse
    {
        return $this->request(
            'POST',
            $this->baseUrl . $path,
            json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}',
            ['Content-Type: application/json']
        );
    }

    public function postForm(string $path, array $payload, array $query = []): HttpResponse
    {
        $url = $this->baseUrl . $path;
        if ($query !== []) {
            $url .= '?' . http_build_query($query);
        }

        return $this->request(
            'POST',
            $url,
            http_build_query($payload),
            ['Content-Type: application/x-www-form-urlencoded']
        );
    }

    private function request(string $method, string $url, ?string $body = null, array $headers = []): HttpResponse
    {
        if ($this->localRootPath !== null) {
            return $this->localRequest($method, $url, $body, $headers);
        }

        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('Unable to initialize cURL.');
        }

        if ($this->cookies !== []) {
            $headers[] = 'Cookie: ' . $this->cookieHeader();
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $raw = curl_exec($ch);
        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('HTTP request failed: ' . $error);
        }

        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $headerText = substr($raw, 0, $headerSize);
        $bodyText = substr($raw, $headerSize);
        $parsedHeaders = $this->parseHeaders($headerText);
        $this->storeCookies($parsedHeaders['set-cookie'] ?? []);

        return new HttpResponse($status, $parsedHeaders, $bodyText);
    }

    private function localRequest(string $method, string $url, ?string $body = null, array $headers = []): HttpResponse
    {
        if (!function_exists('proc_open')) {
            throw new RuntimeException('Local test transport requires proc_open.');
        }

        $runner = $this->localRootPath . DIRECTORY_SEPARATOR . 'tests' . DIRECTORY_SEPARATOR . 'Support' . DIRECTORY_SEPARATOR . 'local_request.php';
        $payload = [
            'method' => $method,
            'url' => $url,
            'headers' => $headers,
            'body' => $body ?? '',
            'cookies' => $this->cookies,
        ];

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $environment = array_merge($_ENV, [
            'DB_DSN' => getenv('DB_DSN') !== false ? (string) getenv('DB_DSN') : TestApplication::databaseDsn(),
            'APP_ENV' => getenv('APP_ENV') !== false ? (string) getenv('APP_ENV') : 'test',
            'MAIL_DISABLE' => getenv('MAIL_DISABLE') !== false ? (string) getenv('MAIL_DISABLE') : '1',
            'IBLOG_TEST_SESSION_DIR' => TestApplication::sessionDirectory(),
            'IBLOG_TEST_COLLECT_COVERAGE' => PhpUnitCodeCoverageRunner::instance()->isActive() ? '1' : '0',
        ]);

        $process = proc_open([PHP_BINARY, $runner], $descriptors, $pipes, $this->localRootPath, $environment, ['bypass_shell' => true]);
        if (!is_resource($process)) {
            throw new RuntimeException('Unable to start the local request runner.');
        }

        fwrite($pipes[0], json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}');
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        proc_close($process);

        $decoded = json_decode($stdout ?: '', true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Local request runner returned invalid output: ' . trim($stderr . "\n" . $stdout));
        }

        $responseHeaders = $this->headersFromLines($decoded['headers'] ?? []);
        $this->storeCookies($responseHeaders['set-cookie'] ?? []);
        $this->appendCoverage($decoded['coverage'] ?? null);

        return new HttpResponse(
            (int) ($decoded['status'] ?? 200),
            $responseHeaders,
            (string) ($decoded['body'] ?? '')
        );
    }

    private function appendCoverage(mixed $coverage): void
    {
        if (!is_array($coverage) || $coverage === []) {
            return;
        }

        $runner = PhpUnitCodeCoverageRunner::instance();
        if (!$runner->isActive()) {
            return;
        }

        $runner->codeCoverage()->append(RawCodeCoverageData::fromXdebugWithoutPathCoverage($coverage));
    }

    private function parseHeaders(string $headerText): array
    {
        $headers = [];
        $lines = preg_split("/\r\n|\n|\r/", trim($headerText)) ?: [];
        return $this->headersFromLines($lines);
    }

    private function headersFromLines(array $lines): array
    {
        $headers = [];
        foreach ($lines as $line) {
            if (!str_contains($line, ':')) {
                continue;
            }

            [$name, $value] = explode(':', $line, 2);
            $key = strtolower(trim($name));
            $headers[$key] ??= [];
            $headers[$key][] = trim($value);
        }

        return $headers;
    }

    private function storeCookies(array $cookieHeaders): void
    {
        foreach ($cookieHeaders as $cookieHeader) {
            $parts = explode(';', $cookieHeader);
            if (!isset($parts[0]) || !str_contains($parts[0], '=')) {
                continue;
            }

            [$name, $value] = explode('=', trim($parts[0]), 2);
            $this->cookies[$name] = $value;
        }
    }

    private function cookieHeader(): string
    {
        $pairs = [];
        foreach ($this->cookies as $name => $value) {
            $pairs[] = $name . '=' . $value;
        }

        return implode('; ', $pairs);
    }
}

final class HttpResponse
{
    public function __construct(
        public readonly int $status,
        public readonly array $headers,
        public readonly string $body,
    ) {
    }

    public function json(): array
    {
        $decoded = json_decode($this->body, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Response body is not valid JSON: ' . $this->body);
        }

        return $decoded;
    }
}
