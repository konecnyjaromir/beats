<?php
// Copy to beats-config.php. Supported languages: 'en' (default), 'cs'.
if (!defined("BEATS_INTERNAL")) {
    http_response_code(404);
    exit();
}
return ["language" => "en"];
