<?php
declare(strict_types=1);
// Only public examples; no sessions, credentials or database access.
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");
define("BEATS_INTERNAL", true);
echo json_encode(
    require __DIR__ . "/starter-loops.php",
    JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
);
