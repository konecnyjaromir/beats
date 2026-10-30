<?php
// Copy to beats-auth.php and add password_hash() output for each account.
// Never commit the real configuration or plaintext passwords.
if (!defined("BEATS_INTERNAL")) {
    http_response_code(404);
    exit();
}
return [
    "users" => [
        // 'username' => 'PASTE_PASSWORD_HASH_HERE',
    ],
];
