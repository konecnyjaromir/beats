<?php
require_once __DIR__ . "/bootstrap.php";
try {
    if (!mysql_mode()) {
        require_login();
    }
    header("Content-Type: application/javascript; charset=utf-8");
    echo "window.__BEATS_CONFIG__ = " .
        json_encode(
            [
                "language" => app_language(),
                "authMode" => mysql_mode() ? "google" : "basic",
                "googleClientId" => mysql_mode()
                    ? service_config()["google"]["client_id"] ?? ""
                    : "",
                "limits" => app_limits(),
            ],
            JSON_THROW_ON_ERROR |
                JSON_HEX_TAG |
                JSON_HEX_AMP |
                JSON_HEX_APOS |
                JSON_HEX_QUOT,
        ) .
        ";";
} catch (Throwable $e) {
    error_log((string) $e);
    fail(
        "Přihlášení není dostupné. Zkontrolujte soukromou konfiguraci beats-auth.php.",
        500,
    );
}
