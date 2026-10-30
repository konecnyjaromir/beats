<?php
// Copy to beats-services.php. Never commit real credentials.
if (!defined("BEATS_INTERNAL")) {
    http_response_code(404);
    exit();
}
return [
    // Supported pairs: json + Basic Auth, mysql + Google sign-in.
    "mode" => "json",
    "limits" => ["max_loops" => 1000, "max_bars" => 1000],
    "database" => [
        "host" => "localhost",
        "port" => 3306,
        "name" => "beats",
        "user" => "beats",
        "password" => "",
        "prefix" => "beats_",
        "auto_create_tables" => true,
    ],
    "google" => [
        "client_id" => "",
        // Empty allows registration by any Google account. Otherwise only these
        // verified email addresses may sign in; account identity remains Google sub.
        "allowed_emails" => [],
    ],
];
