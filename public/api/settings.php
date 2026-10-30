<?php
declare(strict_types=1);

function service_config(): array
{
    static $config;
    if ($config !== null) {
        return $config;
    }
    if (!defined("BEATS_INTERNAL")) {
        define("BEATS_INTERNAL", true);
    }
    $file = dirname(__DIR__) . "/beats-services.php";
    $config = is_file($file) ? require $file : [];
    if (
        !is_array($config) ||
        !in_array($config["mode"] ?? "json", ["json", "mysql"], true)
    ) {
        throw new RuntimeException("Invalid storage mode");
    }
    return $config;
}
function mysql_mode(): bool
{
    return (service_config()["mode"] ?? "json") === "mysql";
}
function app_limits(): array
{
    $settings = service_config()["limits"] ?? [];
    $limits = [];
    foreach (["max_loops" => 1000, "max_bars" => 1000] as $key => $default) {
        $value = $settings[$key] ?? $default;
        if (!is_int($value) || $value < 1 || $value > 10000) {
            throw new RuntimeException("Invalid limit: " . $key);
        }
        $limits[$key] = $value;
    }
    return $limits;
}
function db_table(string $name): string
{
    if (!in_array($name, ["users", "loops"], true)) {
        throw new RuntimeException("Invalid table");
    }
    $prefix = service_config()["database"]["prefix"] ?? "beats_";
    if (
        !is_string($prefix) ||
        !preg_match('/^[a-zA-Z0-9_]{0,40}$/D', $prefix)
    ) {
        throw new RuntimeException("Invalid database prefix");
    }
    return "`" . $prefix . $name . "`";
}
function db(): PDO
{
    static $pdo;
    if ($pdo) {
        return $pdo;
    }
    $c = service_config()["database"] ?? [];
    foreach (["host", "name", "user"] as $key) {
        if (
            !is_string($c[$key] ?? null) ||
            $c[$key] === "" ||
            preg_match('/[;\x00-\x1f]/', $c[$key])
        ) {
            throw new RuntimeException("Missing or invalid database " . $key);
        }
    }
    $port = $c["port"] ?? 3306;
    if (!is_int($port) || $port < 1 || $port > 65535) {
        throw new RuntimeException("Invalid database port");
    }
    $pdo = new PDO(
        "mysql:host=" .
            $c["host"] .
            ";port=" .
            $port .
            ";dbname=" .
            $c["name"] .
            ";charset=utf8mb4",
        $c["user"],
        $c["password"] ?? "",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 10,
        ],
    );
    try {
        $pdo->query("SELECT id FROM " . db_table("users") . " LIMIT 0");
        $pdo->query("SELECT id FROM " . db_table("loops") . " LIMIT 0");
    } catch (PDOException $e) {
        if ($e->getCode() !== "42S02" || !($c["auto_create_tables"] ?? true)) {
            throw $e;
        }
        require_once __DIR__ . "/schema.php";
        foreach (database_schema() as $sql) {
            $pdo->exec($sql);
        }
    }
    return $pdo;
}
