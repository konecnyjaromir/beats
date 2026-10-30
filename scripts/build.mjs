import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

// Vite clears dist. Keep existing runtime loops across local rebuilds.
const saved = new Map();
try {
  for (const name of await readdir("dist/private")) {
    if (/^[a-f0-9]{32}\.json\.php$/.test(name))
      saved.set(name, await readFile("dist/private/" + name));
  }
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
let status = 1;
try {
  const result = spawnSync(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "build"],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  status = result.status ?? 1;
  if (status === 0) await import("./php-entry.mjs");
} finally {
  await mkdir("dist/private", { recursive: true });
  for (const [name, data] of saved)
    await writeFile("dist/private/" + name, data);
}
process.exitCode = status;
