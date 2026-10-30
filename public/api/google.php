<?php
declare(strict_types=1);

function google_autoload(): void
{
    $file = dirname(__DIR__) . "/vendor/autoload.php";
    if (!is_file($file)) {
        $file = dirname(__DIR__, 2) . "/vendor/autoload.php";
    }
    if (!is_file($file)) {
        throw new RuntimeException("Missing Composer dependencies");
    }
    require_once $file;
}
function google_keys(bool $refresh = false): array
{
    $file = storage_dir() . "/google-keys.php";
    if (!$refresh && is_file($file)) {
        try {
            $cache = read_loop($file);
            if (($cache["expires"] ?? 0) > time()) {
                return $cache["keys"];
            }
        } catch (Throwable $e) {
            /* Refresh an incomplete cache. */
        }
    }
    $curl = curl_init("https://www.googleapis.com/oauth2/v1/certs");
    $maxAge = 300;
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HEADERFUNCTION => function ($handle, $line) use (&$maxAge) {
            if (
                preg_match("/^cache-control:.*max-age=(\d+)/i", $line, $match)
            ) {
                $maxAge = min(86400, (int) $match[1]);
            }
            return strlen($line);
        },
    ]);
    $raw = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($status !== 200 || !is_string($raw) || strlen($raw) > 100000) {
        throw new RuntimeException(
            "Cannot retrieve Google signing certificates",
        );
    }
    $keys = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    if (!is_array($keys) || !$keys) {
        throw new RuntimeException("Invalid Google signing certificates");
    }
    file_put_contents(
        $file,
        DATA_GUARD .
            json_encode(
                ["expires" => time() + $maxAge, "keys" => $keys],
                JSON_THROW_ON_ERROR,
            ),
        LOCK_EX,
    );
    return $keys;
}
// Explicit keys make this verifier testable without ever trusting client-supplied keys.
function verify_google_token(
    string $token,
    string $clientId,
    string $nonce,
    array $certificates,
): array {
    google_autoload();
    $keys = [];
    foreach ($certificates as $id => $pem) {
        $keys[$id] = new Firebase\JWT\Key($pem, "RS256");
    }
    $claims = (array) Firebase\JWT\JWT::decode($token, $keys);
    if (
        !in_array(
            $claims["iss"] ?? "",
            ["accounts.google.com", "https://accounts.google.com"],
            true,
        ) ||
        ($claims["aud"] ?? null) !== $clientId ||
        (isset($claims["azp"]) && $claims["azp"] !== $clientId) ||
        !is_int($claims["exp"] ?? null) ||
        $claims["exp"] <= time() ||
        !is_int($claims["iat"] ?? null) ||
        $claims["iat"] > time() + 30 ||
        !is_string($claims["sub"] ?? null) ||
        !preg_match('/^[A-Za-z0-9_-]{1,255}$/D', $claims["sub"]) ||
        !is_string($claims["nonce"] ?? null) ||
        !hash_equals($nonce, $claims["nonce"]) ||
        ($claims["email_verified"] ?? false) !== true ||
        !is_string($claims["email"] ?? null) ||
        !filter_var($claims["email"], FILTER_VALIDATE_EMAIL) ||
        strlen($claims["email"]) > 254
    ) {
        throw new UnexpectedValueException("Invalid Google identity claims");
    }
    return $claims;
}
