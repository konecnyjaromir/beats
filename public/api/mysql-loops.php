<?php
declare(strict_types=1);

function mysql_loops(string $method, ?string $id): never
{
    $pdo = db();
    $table = db_table("loops");
    $owner = owner_id();
    if ($method === "GET") {
        $query = $pdo->prepare(
            "SELECT " .
                ($id !== null ? "payload" : "summary") .
                " FROM " .
                $table .
                " WHERE owner_id = ?" .
                ($id !== null
                    ? " AND id = ?"
                    : " ORDER BY updated_at DESC, id"),
        );
        $query->execute($id !== null ? [$owner, $id] : [$owner]);
        if ($id !== null) {
            $raw = $query->fetchColumn();
            if ($raw === false) {
                fail("Smyčka nebyla nalezena.", 404);
            }
            respond(
                normalize_loop(
                    json_decode($raw, true, 64, JSON_THROW_ON_ERROR),
                ),
            );
        }
        $list = [];
        while (($raw = $query->fetchColumn()) !== false) {
            $list[] = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        }
        respond($list);
    }
    if ($method === "DELETE") {
        if ($id === null) {
            fail("Chybí ID.");
        }
        $query = $pdo->prepare(
            "DELETE FROM " . $table . " WHERE id = ? AND owner_id = ?",
        );
        $query->execute([$id, $owner]);
        if (!$query->rowCount()) {
            fail("Smyčka nebyla nalezena.", 404);
        }
        respond(["ok" => true]);
    }
    $input = read_loop_input();
    $p = validate($input);
    $id = $input["id"] ?? null;
    if (
        $id !== null &&
        (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/D', $id))
    ) {
        fail("Neplatné ID.");
    }
    $exists = $id !== null;
    $pdo->beginTransaction();
    // Serialize creates for one owner so concurrent requests cannot bypass quota.
    $lock = $pdo->prepare(
        "SELECT id FROM " . db_table("users") . " WHERE id = ? FOR UPDATE",
    );
    $lock->execute([$owner]);
    if (!$lock->fetchColumn()) {
        $pdo->rollBack();
        fail("Přihlaste se přes Google.", 401);
    }
    if ($exists) {
        $query = $pdo->prepare(
            "SELECT id FROM " . $table . " WHERE id = ? AND owner_id = ?",
        );
        $query->execute([$id, $owner]);
        if (!$query->fetchColumn()) {
            $pdo->rollBack();
            fail("Smyčka nebyla nalezena.", 404);
        }
    } else {
        $query = $pdo->prepare(
            "SELECT COUNT(*) FROM " . $table . " WHERE owner_id = ?",
        );
        $query->execute([$owner]);
        if ((int) $query->fetchColumn() >= app_limits()["max_loops"]) {
            $pdo->rollBack();
            fail("Byl dosažen limit uložených smyček.", 409);
        }
        $id = bin2hex(random_bytes(16));
    }
    $p["id"] = $id;
    $p["updatedAt"] = gmdate("Y-m-d\TH:i:s\Z");
    $payload = json_encode($p, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $summary = json_encode(
        loop_summary($p),
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
    );
    if ($exists) {
        $query = $pdo->prepare(
            "UPDATE " .
                $table .
                " SET payload = ?, summary = ?, updated_at = UTC_TIMESTAMP() WHERE id = ? AND owner_id = ?",
        );
        $query->execute([$payload, $summary, $id, $owner]);
    } else {
        $query = $pdo->prepare(
            "INSERT INTO " .
                $table .
                " (id, owner_id, payload, summary) VALUES (?, ?, ?, ?)",
        );
        $query->execute([$id, $owner, $payload, $summary]);
    }
    $pdo->commit();
    respond($p, $exists ? 200 : 201);
}
