<?php
declare(strict_types=1);

function database_schema(): array
{
    $users = db_table("users");
    $loops = db_table("loops");
    return [
        "CREATE TABLE IF NOT EXISTS $users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            google_sub VARBINARY(255) NOT NULL UNIQUE,
            email VARCHAR(254) NOT NULL,
            name VARCHAR(200) NOT NULL,
            created_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS $loops (
            id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
            owner_id BIGINT UNSIGNED NOT NULL,
            payload LONGTEXT NOT NULL,
            summary TEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX owner_updated (owner_id, updated_at),
            FOREIGN KEY (owner_id) REFERENCES $users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ];
}
