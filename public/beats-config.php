<?php
// Development entry, replaced by the production build.
if (!defined("BEATS_INTERNAL")) {
    http_response_code(404);
    exit();
}
$file = dirname(__DIR__) . "/beats-config.php";
return is_file($file) ? require $file : ["language" => "en"];
