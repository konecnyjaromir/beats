<?php
declare(strict_types=1);
require_once __DIR__ . "/bootstrap.php";
function integer($n, int $min, int $max): bool
{
    return is_int($n) && $n >= $min && $n <= $max;
}
function normalize_loop(array $p): array
{
    foreach ($p["bars"] as &$b) {
        $b["numerator"] ??= $p["numerator"] ?? 4;
        $b["denominator"] ??= $p["denominator"] ?? 4;
    }
    unset($b);
    return $p;
}
function validate(array $p): array
{
    if (
        !is_string($p["name"] ?? null) ||
        strlen(trim($p["name"])) < 1 ||
        strlen($p["name"]) > 320
    ) {
        fail("Vyplňte název smyčky (max. 80 znaků).");
    }
    if (!integer($p["bpm"] ?? null, 30, 300)) {
        fail("Neplatné tempo.");
    }
    if (
        !is_array($p["bars"] ?? null) ||
        !array_is_list($p["bars"]) ||
        count($p["bars"]) < 1 ||
        count($p["bars"]) > 64
    ) {
        fail("Smyčka musí mít 1–64 taktů.");
    }
    $instruments = [
        "kick",
        "snare",
        "hat",
        "openhat",
        "crash",
        "ride",
        "tomHigh",
        "tomMid",
        "tomLow",
        "rim",
        "clap",
        "tambourine",
        "cowbell",
        "maracas",
        "pedalHat",
        "snareEdge",
        "rideBell",
        "splash",
    ];
    $bars = [];
    foreach ($p["bars"] as $b) {
        if (
            !is_array($b) ||
            !is_string($b["id"] ?? null) ||
            strlen($b["id"]) > 80 ||
            !is_array($b["rows"] ?? null) ||
            !array_is_list($b["rows"]) ||
            count($b["rows"]) < 1 ||
            count($b["rows"]) > 32
        ) {
            fail("Neplatné řádky taktu.");
        }
        $numerator = $b["numerator"] ?? ($p["numerator"] ?? 4);
        $denominator = $b["denominator"] ?? ($p["denominator"] ?? 4);
        if (
            !in_array($numerator, [3, 4, 5, 6, 7, 8], true) ||
            !in_array($denominator, [4, 8, 16], true)
        ) {
            fail("Neplatné označení taktu.");
        }
        $rows = [];
        foreach ($b["rows"] as $r) {
            if (
                !is_array($r) ||
                !is_string($r["id"] ?? null) ||
                strlen($r["id"]) > 80 ||
                !in_array($r["instrument"] ?? null, $instruments, true) ||
                !is_bool($r["muted"] ?? null) ||
                !is_array($r["steps"] ?? null) ||
                !array_is_list($r["steps"]) ||
                count($r["steps"]) < 1 ||
                count($r["steps"]) > 64
            ) {
                fail("Neplatný nástroj nebo dělení řádku.");
            }
            foreach ($r["steps"] as $s) {
                if (!integer($s, 0, 3)) {
                    fail("Neplatná síla úderu.");
                }
            }
            $rows[] = [
                "id" => $r["id"],
                "instrument" => $r["instrument"],
                "muted" => $r["muted"],
                "steps" => $r["steps"],
            ];
        }
        $bars[] = [
            "id" => $b["id"],
            "numerator" => $numerator,
            "denominator" => $denominator,
            "rows" => $rows,
        ];
    }
    return [
        "name" => trim($p["name"]),
        "bpm" => $p["bpm"],
        "numerator" => $bars[0]["numerator"],
        "denominator" => $bars[0]["denominator"],
        "bars" => $bars,
    ];
}
try {
    require_login();
    $method = $_SERVER["REQUEST_METHOD"];
    if (!in_array($method, ["GET", "POST", "DELETE"], true)) {
        header("Allow: GET, POST, DELETE");
        fail("Metoda není podporována.", 405);
    }
    if ($method !== "GET" && isset($_SERVER["HTTP_ORIGIN"])) {
        $origin = parse_url($_SERVER["HTTP_ORIGIN"]);
        $host =
            ($origin["host"] ?? "") .
            (isset($origin["port"]) ? ":" . $origin["port"] : "");
        if ($host !== ($_SERVER["HTTP_HOST"] ?? "")) {
            fail("Požadavek z jiné domény není povolen.", 403);
        }
    }
    $dir = storage_dir();
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new RuntimeException("storage");
    }
    $id = $_GET["id"] ?? null;
    if (
        $id !== null &&
        (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/D', $id))
    ) {
        fail("Neplatné ID.");
    }
    if ($method === "GET") {
        if ($id !== null) {
            $file = $dir . "/" . $id . ".json.php";
            if (!is_file($file)) {
                fail("Smyčka nebyla nalezena.", 404);
            }
            respond(normalize_loop(read_loop($file)));
        }
        $list = [];
        foreach (glob($dir . "/*.json.php") as $file) {
            $p = normalize_loop(read_loop($file));
            $meters = array_values(
                array_unique(
                    array_map(
                        fn($b) => $b["numerator"] . "/" . $b["denominator"],
                        $p["bars"],
                    ),
                ),
            );
            $list[] = [
                "id" => $p["id"],
                "name" => $p["name"],
                "bpm" => $p["bpm"],
                "numerator" => $p["bars"][0]["numerator"],
                "denominator" => $p["bars"][0]["denominator"],
                "meters" => $meters,
                "barCount" => count($p["bars"]),
                "updatedAt" => $p["updatedAt"],
            ];
        }
        usort($list, fn($a, $b) => strcmp($b["updatedAt"], $a["updatedAt"]));
        respond($list);
    }
    $lock = fopen($dir . "/.write.lock", "c");
    if (!$lock || !flock($lock, LOCK_EX)) {
        throw new RuntimeException("lock");
    }
    if ($method === "DELETE") {
        if ($id === null) {
            fail("Chybí ID.");
        }
        $file = $dir . "/" . $id . ".json.php";
        if (!is_file($file)) {
            fail("Smyčka nebyla nalezena.", 404);
        }
        if (!unlink($file)) {
            throw new RuntimeException("delete");
        }
        respond(["ok" => true]);
    }
    if (!str_starts_with($_SERVER["CONTENT_TYPE"] ?? "", "application/json")) {
        fail("Očekáván JSON.", 415);
    }
    $raw = file_get_contents("php://input", false, null, 0, 1048577);
    if (strlen($raw) > 1048576) {
        fail("Smyčka je příliš velká.", 413);
    }
    try {
        $input = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        fail("Neplatný JSON.");
    }
    if (!is_array($input)) {
        fail("Neplatná smyčka.");
    }
    $p = validate($input);
    $id = $input["id"] ?? null;
    if (
        $id !== null &&
        (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/D', $id))
    ) {
        fail("Neplatné ID.");
    }
    $exists = $id !== null;
    if ($exists && !is_file($dir . "/" . $id . ".json.php")) {
        fail("Smyčka nebyla nalezena.", 404);
    }
    $id ??= bin2hex(random_bytes(16));
    $p["id"] = $id;
    $p["updatedAt"] = gmdate("Y-m-d\TH:i:s\Z");
    $temp = $dir . "/write-" . bin2hex(random_bytes(16)) . ".php";
    if (
        file_put_contents(
            $temp,
            DATA_GUARD .
                json_encode(
                    $p,
                    JSON_UNESCAPED_UNICODE |
                        JSON_PRETTY_PRINT |
                        JSON_THROW_ON_ERROR,
                ),
        ) === false ||
        !rename($temp, $dir . "/" . $id . ".json.php")
    ) {
        if (is_file($temp)) {
            unlink($temp);
        }
        throw new RuntimeException("write");
    }
    respond($p, $exists ? 200 : 201);
} catch (Throwable $e) {
    error_log((string) $e);
    fail(
        "Nepodařilo se zpracovat smyčku. Zkontrolujte oprávnění úložiště.",
        500,
    );
}
