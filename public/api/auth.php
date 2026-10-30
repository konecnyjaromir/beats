<?php
declare(strict_types=1);
require_once __DIR__ . "/bootstrap.php";
require_once __DIR__ . "/google.php";
$stage = "CONFIG";
try {
    if (!mysql_mode()) {
        respond(["mode" => "basic"]);
    }
    $stage = "SESSION";
    app_session();
    $method = $_SERVER["REQUEST_METHOD"];
    if ($method === "GET") {
        $stage = isset($_SESSION["user_id"]) ? "DATABASE" : "SESSION";
        $user = session_user();
        respond([
            "user" => $user
                ? ["name" => $user["name"], "email" => $user["email"]]
                : null,
            "csrf" => $_SESSION["csrf"],
            "nonce" => $_SESSION["nonce"],
        ]);
    }
    if ($method !== "POST") {
        header("Allow: GET, POST");
        fail("Metoda není podporována.", 405);
    }
    require_write_request(true);
    if (!str_starts_with($_SERVER["CONTENT_TYPE"] ?? "", "application/json")) {
        fail("Očekáván JSON.", 415);
    }
    $raw = file_get_contents("php://input", false, null, 0, 20001);
    if (strlen($raw) > 20000) {
        fail("Neplatný požadavek aplikace.", 413);
    }
    try {
        $input = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        fail("Neplatný JSON.");
    }
    if (($input["action"] ?? "") === "logout") {
        $_SESSION = [];
        session_regenerate_id(true);
        respond(["ok" => true]);
    }
    if (($input["action"] ?? "") === "delete-account") {
        if (($input["confirm"] ?? false) !== true) {
            fail("Neplatný požadavek aplikace.", 400);
        }
        $stage = "DATABASE";
        $owner = owner_id();
        $pdo = db();
        $pdo->beginTransaction();
        // Only the session owner can be deleted. Foreign-key cascade removes their loops.
        $delete = $pdo->prepare(
            "DELETE FROM " . db_table("users") . " WHERE id = ?",
        );
        $delete->execute([$owner]);
        $pdo->commit();
        $_SESSION = [];
        session_regenerate_id(true);
        respond(["ok" => true]);
    }
    $token = $input["credential"] ?? null;
    if (!is_string($token) || strlen($token) < 20) {
        fail("Neplatné přihlášení Google.", 401);
    }
    // Limit expensive verification and key refreshes per browser session.
    $now = time();
    $_SESSION["login_attempts"] = array_values(
        array_filter(
            $_SESSION["login_attempts"] ?? [],
            fn($at) => $at > $now - 60,
        ),
    );
    if (count($_SESSION["login_attempts"]) >= 10) {
        fail("Příliš mnoho pokusů. Zkuste to za minutu.", 429);
    }
    $_SESSION["login_attempts"][] = $now;
    $clientId = service_config()["google"]["client_id"] ?? "";
    if (
        !is_string($clientId) ||
        !str_ends_with($clientId, ".apps.googleusercontent.com")
    ) {
        throw new RuntimeException("Missing Google client ID");
    }
    $stage = "PHP_CURL";
    if (!function_exists("curl_init")) {
        throw new RuntimeException("Required extension unavailable");
    }
    $stage = "GOOGLE_CERTIFICATES";
    $keys = google_keys();
    $stage = "PHP_OPENSSL";
    if (!function_exists("openssl_verify")) {
        throw new RuntimeException("Required extension unavailable");
    }
    $stage = "GOOGLE_LIBRARY";
    google_autoload();
    try {
        // Refresh only for a rotated key ID, not for every invalid signature.
        $parts = explode(".", $token);
        $header =
            count($parts) === 3
                ? json_decode(base64_decode(strtr($parts[0], "-_", "+/")), true)
                : null;
        if (
            is_string($header["kid"] ?? null) &&
            !isset($keys[$header["kid"]])
        ) {
            if (($_SESSION["key_refresh"] ?? 0) < $now - 60) {
                $_SESSION["key_refresh"] = $now;
                $keys = google_keys(true);
            }
        }
        $claims = verify_google_token(
            $token,
            $clientId,
            $_SESSION["nonce"],
            $keys,
        );
    } catch (Throwable $e) {
        fail("Neplatné přihlášení Google.", 401);
    }
    $allowed = service_config()["google"]["allowed_emails"] ?? [];
    if (
        $allowed &&
        !in_array(
            strtolower($claims["email"]),
            array_map("strtolower", $allowed),
            true,
        )
    ) {
        fail("Tento účet nemá povolený přístup.", 403);
    }
    $stage = "PHP_MBSTRING";
    if (!function_exists("mb_substr")) {
        throw new RuntimeException("Required extension unavailable");
    }
    $name = is_string($claims["name"] ?? null)
        ? mb_substr($claims["name"], 0, 200)
        : $claims["email"];
    $stage = "PHP_PDO_MYSQL";
    if (
        !class_exists("PDO") ||
        !in_array("mysql", PDO::getAvailableDrivers(), true)
    ) {
        throw new RuntimeException("Required extension unavailable");
    }
    $stage = "DATABASE";
    $pdo = db();
    $pdo->beginTransaction();
    $query = db()->prepare(
        "INSERT INTO " .
            db_table("users") .
            " (google_sub, email, name, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name)",
    );
    $query->execute([$claims["sub"], $claims["email"], $name]);
    $isNewUser = $query->rowCount() === 1;
    $query = db()->prepare(
        "SELECT id FROM " . db_table("users") . " WHERE google_sub = ?",
    );
    $query->execute([$claims["sub"]]);
    $id = $query->fetchColumn();
    if ($isNewUser) {
        require_once __DIR__ . "/starter-library.php";
        seed_starter_library($pdo, (int) $id);
    }
    $pdo->commit();
    $stage = "SESSION";
    session_regenerate_id(true);
    $_SESSION = [
        "user_id" => (int) $id,
        "expires" => time() + 7 * 86400,
        "csrf" => bin2hex(random_bytes(32)),
        "nonce" => bin2hex(random_bytes(32)),
    ];
    respond([
        "user" => ["name" => $name, "email" => $claims["email"]],
        "csrf" => $_SESSION["csrf"],
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Never expose exception messages: PDO messages can contain account details.
    $reference = "AUTH_" . $stage;
    if (
        $e instanceof PDOException &&
        isset($e->errorInfo[1]) &&
        is_numeric($e->errorInfo[1])
    ) {
        $reference .= "_" . (int) $e->errorInfo[1];
    }
    error_log(
        "BEATS authentication failed: " .
            $reference .
            " (" .
            get_class($e) .
            ")",
    );
    fail(
        "Přihlášení není dostupné. Zkontrolujte konfiguraci služeb a databázi.",
        503,
        $reference,
    );
}
