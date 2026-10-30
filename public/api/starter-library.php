<?php
declare(strict_types=1);

function seed_starter_library(PDO $pdo, int $owner): void
{
    // Called inside the new-user transaction: registration and examples are atomic.
    define("BEATS_LIBRARY_ONLY", true);
    require_once __DIR__ . "/loops.php";
    $examples = require __DIR__ . "/starter-loops.php";
    $insert = $pdo->prepare(
        "INSERT INTO " .
            db_table("loops") .
            " (id, owner_id, payload, summary, updated_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())",
    );
    foreach (array_slice($examples, 0, app_limits()["max_loops"]) as $example) {
        if (count($example["bars"]) > app_limits()["max_bars"]) {
            continue;
        }
        foreach ($example["bars"] as &$bar) {
            $bar["id"] = bin2hex(random_bytes(16));
            foreach ($bar["rows"] as &$row) {
                $row["id"] = bin2hex(random_bytes(16));
            }
            unset($row);
        }
        unset($bar);
        $loop = validate($example);
        $loop["id"] = bin2hex(random_bytes(16));
        $loop["updatedAt"] = gmdate("Y-m-d\TH:i:s\Z");
        $insert->execute([
            $loop["id"],
            $owner,
            json_encode($loop, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            json_encode(
                loop_summary($loop),
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
            ),
        ]);
    }
}
