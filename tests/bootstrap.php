<?php
declare(strict_types=1);

$vendorAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (is_file($vendorAutoload)) {
    require_once $vendorAutoload;
} else {
    spl_autoload_register(static function (string $class): void {
        $testsPrefix = 'IBlog\\Tests\\';
        if (str_starts_with($class, $testsPrefix)) {
            $relative = substr($class, strlen($testsPrefix));
            $path = __DIR__ . DIRECTORY_SEPARATOR . str_replace('\\', DIRECTORY_SEPARATOR, $relative) . '.php';
            if (is_file($path)) {
                require_once $path;
            }

            return;
        }

        $appPrefix = 'IBlog\\';
        if (str_starts_with($class, $appPrefix)) {
            $relative = substr($class, strlen($appPrefix));
            $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . str_replace('\\', DIRECTORY_SEPARATOR, $relative) . '.php';
            if (is_file($path)) {
                require_once $path;
            }
        }
    });
}
