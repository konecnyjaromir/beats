<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");

function respond($data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit();
}
function app_language(): string
{
    static $language = null;
    if ($language !== null) {
        return $language;
    }
    if (!defined("BEATS_INTERNAL")) {
        define("BEATS_INTERNAL", true);
    }
    $path = dirname(__DIR__) . "/beats-config.php";
    $config = is_file($path) ? require $path : [];
    return $language = ($config["language"] ?? "en") === "cs" ? "cs" : "en";
}
function fail(string $text, int $code = 400): never
{
    $messages = require __DIR__ . "/messages.php";
    respond(
        [
            "error" =>
                app_language() === "cs"
                    ? $text
                    : $messages[$text] ?? "The request could not be completed.",
        ],
        $code,
    );
}

function storage_dir(): string
{
    $dir = dirname(__DIR__) . "/private";
    if (!is_dir($dir) && !mkdir($dir, 0700, true)) {
        throw new RuntimeException("Cannot create private storage");
    }
    return realpath($dir);
}

// JSON payload with a PHP guard: no data is returned even without Apache .htaccess.
const DATA_GUARD = "<?php http_response_code(404); exit; __halt_compiler();\n";
function read_loop(string $file): array
{
    $raw = file_get_contents($file);
    if (!str_starts_with($raw, DATA_GUARD)) {
        throw new RuntimeException("Invalid stored loop");
    }
    return json_decode(
        substr($raw, strlen(DATA_GUARD)),
        true,
        512,
        JSON_THROW_ON_ERROR,
    );
}

function require_login(): void
{
    $configPath = dirname(__DIR__) . "/beats-auth.php";
    if (!is_readable($configPath)) {
        throw new RuntimeException(
            "beats/beats-auth.php configuration is missing or unreadable",
        );
    }
    if (!defined("BEATS_INTERNAL")) {
        define("BEATS_INTERNAL", true);
    }
    $config = require $configPath;
    $users = $config["users"] ?? [];
    if (!is_array($users) || !$users) {
        throw new RuntimeException("No Basic Auth users configured");
    }

    $username = $_SERVER["PHP_AUTH_USER"] ?? null;
    $password = $_SERVER["PHP_AUTH_PW"] ?? null;
    // Apache/FastCGI may pass Authorization without filling PHP_AUTH_*.
    if ($username === null) {
        $authorization =
            $_SERVER["HTTP_AUTHORIZATION"] ??
            ($_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? "");
        if (preg_match('/^Basic\s+(.+)$/i', $authorization, $match)) {
            $decoded = base64_decode($match[1], true);
            if ($decoded !== false && str_contains($decoded, ":")) {
                [$username, $password] = explode(":", $decoded, 2);
            }
        }
    }
    // Verify a real hash even for an unknown username to avoid a fast rejection path.
    $hash =
        is_string($username) && isset($users[$username])
            ? $users[$username]
            : reset($users);
    $valid =
        is_string($password) &&
        strlen($password) <= 1024 &&
        password_verify($password, $hash);
    if (!$valid || !is_string($username) || !isset($users[$username])) {
        header('WWW-Authenticate: Basic realm="BEATS", charset="UTF-8"');
        fail("Pro vstup do BEATS zadejte uživatelské jméno a heslo.", 401);
    }
    if (!in_array($_SERVER["REQUEST_METHOD"], ["GET", "HEAD"], true)) {
        if (isset($_SERVER["HTTP_ORIGIN"])) {
            $origin = parse_url($_SERVER["HTTP_ORIGIN"]);
            $host =
                ($origin["host"] ?? "") .
                (isset($origin["port"]) ? ":" . $origin["port"] : "");
            if ($host !== ($_SERVER["HTTP_HOST"] ?? "")) {
                fail("Požadavek z jiné domény není povolen.", 403);
            }
        }
        // A cross-origin form cannot add this header; CORS is not enabled.
        if (($_SERVER["HTTP_X_BEATS_REQUEST"] ?? "") !== "1") {
            fail("Neplatný požadavek aplikace.", 403);
        }
    }
}
