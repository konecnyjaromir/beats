<?php
// Optional CLI helper. The web application creates missing tables automatically.
if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit();
}
$base = is_dir(dirname(__DIR__) . "/api")
    ? dirname(__DIR__)
    : dirname(__DIR__) . "/public";
define("BEATS_LIBRARY_ONLY", true);
require_once $base . "/api/loops.php";
require_once $base . "/api/schema.php";
$command = $argv[1] ?? "help";
try {
    if ($command === "schema") {
        echo implode(";\n\n", database_schema()) . ";\n";
    } elseif ($command === "install") {
        db();
        echo "Database tables are ready.\n";
    } else {
        echo "Usage: php database/manage.php schema|install\n";
    }
} catch (Throwable $e) {
    fwrite(
        STDERR,
        "Database setup failed (" .
            $e->getCode() .
            "). Check host, credentials and CREATE privileges." .
            "\n",
    );
    exit(1);
}
