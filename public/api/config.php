<?php
require_once __DIR__ . "/bootstrap.php";
try {
    require_login();
    header("Content-Type: application/javascript; charset=utf-8");
    echo "window.__BEATS_CONFIG__ = " .
        json_encode(["language" => app_language()], JSON_THROW_ON_ERROR) .
        ";";
} catch (Throwable $e) {
    error_log((string) $e);
    fail(
        "Přihlášení není dostupné. Zkontrolujte soukromou konfiguraci beats-auth.php.",
        500,
    );
}
