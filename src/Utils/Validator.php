<?php
declare(strict_types=1);

namespace IBlog\Utils;

final class Validator
{
    public static function validateName(string $name): bool
    {
        return mb_strlen(trim($name)) >= 2;
    }

    public static function validateEmail(string $email): bool
    {
        return $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function validatePassword(string $password): bool
    {
        return mb_strlen($password) >= 6;
    }

    public static function validateThreadTitle(string $title): bool
    {
        return mb_strlen(trim($title)) <= 180;
    }
}
