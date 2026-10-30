<?php
// Development entry; the production build replaces this with the guarded configuration.
if (!defined("BEATS_INTERNAL")) {
    http_response_code(404);
    exit();
}
return require dirname(__DIR__) . "/beats-auth.php";
