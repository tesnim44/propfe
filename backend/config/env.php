<?php
declare(strict_types=1);

function loadEnvFile(?string $path = null): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }

    $path ??= dirname(__DIR__, 2) . '/.env';
    if (!is_file($path)) {
        $loaded = true;
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        $loaded = true;
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, "\"'");

        if (!array_key_exists($name, $_ENV)) {
            $_ENV[$name] = $value;
        }
        if (getenv($name) === false) {
            putenv($name . '=' . $value);
        }
    }

    $loaded = true;
}

function env(string $name, ?string $default = null): ?string
{
    loadEnvFile();

    $value = $_ENV[$name] ?? getenv($name);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string) $value;
}
