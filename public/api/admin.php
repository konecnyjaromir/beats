<?php
declare(strict_types=1);
require_once __DIR__ . "/bootstrap.php";
try {
    if (!mysql_mode()) {
        fail("Přístup pouze pro administrátora.", 403);
    }
    $user = session_user();
    if (!$user) {
        fail("Přihlaste se přes Google.", 401);
    }
    if (!is_admin_user($user)) {
        fail("Přístup pouze pro administrátora.", 403);
    }
    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        header("Allow: GET");
        fail("Metoda není podporována.", 405);
    }
    $page = filter_var($_GET["page"] ?? "1", FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 1, "max_range" => 1000000],
    ]);
    if ($page === false) {
        fail("Neplatný požadavek aplikace.");
    }
    $users = db_table("users");
    $loops = db_table("loops");
    $total = (int) db()
        ->query("SELECT COUNT(*) FROM $users")
        ->fetchColumn();
    $offset = ($page - 1) * 100;
    $query = db()->query(
        "SELECT u.name, u.email, (SELECT COUNT(*) FROM $loops l WHERE l.owner_id = u.id) AS loop_count FROM $users u ORDER BY u.id DESC LIMIT 100 OFFSET $offset",
    );
    $rows = $query->fetchAll();
    foreach ($rows as &$row) {
        $row["loop_count"] = (int) $row["loop_count"];
    }
    respond([
        "users" => $rows,
        "total" => $total,
        "page" => $page,
        "pageSize" => 100,
    ]);
} catch (Throwable $e) {
    error_log("BEATS administration failed: " . get_class($e));
    fail("Seznam uživatelů se nepodařilo načíst.", 503);
}
