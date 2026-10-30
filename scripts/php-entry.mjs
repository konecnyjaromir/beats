import {
  readFile,
  writeFile,
  unlink,
  copyFile,
  access,
} from "node:fs/promises";

// Serve the HTML entry through PHP to prompt before showing the studio.
const html = await readFile("dist/index.html", "utf8");
const guard = `<?php
require_once __DIR__ . '/api/bootstrap.php';
try { require_login(); }
catch (Throwable $e) {
    error_log((string)$e);
    fail('Přihlášení není dostupné. Zkontrolujte soukromou konfiguraci beats-auth.php.', 500);
}
header('Content-Type: text/html; charset=utf-8');
?>
`;
await writeFile("dist/index.php", guard + html);
await unlink("dist/index.html");
for (const name of ["beats-auth", "beats-config"]) {
  let source = `${name}.php`;
  try {
    await access(source);
  } catch {
    source = `${name}.example.php`;
  }
  await copyFile(source, `dist/${name}.php`);
}
