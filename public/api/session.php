<?php
declare(strict_types=1);

function app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $path = str_replace(
        "\\",
        "/",
        dirname($_SERVER["SCRIPT_NAME"] ?? "/api/auth.php"),
    );
    if (str_ends_with($path, "/api")) {
        $path = substr($path, 0, -4);
    }
    $path = rtrim($path, "/") . "/";
    session_name("beats_" . substr(hash("sha256", $path), 0, 12));
    ini_set("session.use_strict_mode", "1");
    ini_set("session.use_only_cookies", "1");
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => $path,
        "secure" => isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
        "httponly" => true,
        "samesite" => "Lax",
    ]);
    if (!session_start()) {
        throw new RuntimeException("Cannot start session");
    }
    if (isset($_SESSION["expires"]) && $_SESSION["expires"] < time()) {
        $_SESSION = [];
    }
    $_SESSION["csrf"] ??= bin2hex(random_bytes(32));
    $_SESSION["nonce"] ??= bin2hex(random_bytes(32));
}
function require_write_request(bool $csrf = false): void
{
    if (isset($_SERVER["HTTP_ORIGIN"])) {
        $origin = parse_url($_SERVER["HTTP_ORIGIN"]);
        $host =
            ($origin["host"] ?? "") .
            (isset($origin["port"]) ? ":" . $origin["port"] : "");
        $scheme =
            isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off"
                ? "https"
                : "http";
        if (
            $host !== ($_SERVER["HTTP_HOST"] ?? "") ||
            ($origin["scheme"] ?? "") !== $scheme
        ) {
            fail("Požadavek z jiné domény není povolen.", 403);
        }
    }
    if (($_SERVER["HTTP_X_BEATS_REQUEST"] ?? "") !== "1") {
        fail("Neplatný požadavek aplikace.", 403);
    }
    if ($csrf) {
        app_session();
        $token = $_SERVER["HTTP_X_BEATS_CSRF"] ?? "";
        if (!is_string($token) || !hash_equals($_SESSION["csrf"], $token)) {
            fail("Neplatný požadavek aplikace.", 403);
        }
    }
}
function session_user(): ?array
{
    app_session();
    if (!isset($_SESSION["user_id"])) {
        return null;
    }
    $query = db()->prepare(
        "SELECT id, google_sub, email, name FROM " .
            db_table("users") .
            " WHERE id = ?",
    );
    $query->execute([$_SESSION["user_id"]]);
    return $query->fetch() ?: null;
}
function owner_id(): int
{
    app_session();
    if (!isset($_SESSION["user_id"])) {
        fail("Přihlaste se přes Google.", 401);
    }
    return (int) $_SESSION["user_id"];
}
