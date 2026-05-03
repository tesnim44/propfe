<?php
declare(strict_types=1);

namespace IBlog\Service;

final class RouteRegistry
{
    public static function all(): array
    {
        return [
            'web' => [
                '/' => 'views/home.php',
                '/index.php' => 'views/home.php',
                '/reset-password.php' => 'views/reset-password.php',
                '/public/index.php' => 'public/index.php',
                '/public/reset-password.php' => 'public/reset-password.php',
            ],
            'api' => [
                '/backend/view/components/article/api-articles.php' => 'Article API',
                '/backend/view/components/auth/api-auth.php' => 'Authentication API',
                '/backend/view/components/auth/search-index.php' => 'Search API',
                '/backend/controller/CommunityController.php' => 'Community API',
            ],
        ];
    }
}
