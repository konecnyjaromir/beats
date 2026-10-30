import { readdir, readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const versionFile = new URL("../build-version.json", import.meta.url);
const version = JSON.parse(await readFile(versionFile, "utf8"));
const nextBuild = version.build + 1;
if (!Number.isSafeInteger(nextBuild) || nextBuild < 1) {
  throw new Error("Invalid build number in build-version.json");
}

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
    {
      stdio: "inherit",
      env: { ...process.env, BEATS_BUILD_NUMBER: String(nextBuild) },
    },
  );
  if (result.error) throw result.error;
  status = result.status ?? 1;
  if (status === 0) {
    await import("./php-entry.mjs");
    await cp("vendor", "dist/vendor", { recursive: true });
    await cp("database", "dist/database", { recursive: true });
    await cp("beats-services.example.php", "dist/beats-services.example.php");
    await writeFile(
      versionFile,
      JSON.stringify({ build: nextBuild }, null, 2) + "\n",
    );
  }
} finally {
  await mkdir("dist/private", { recursive: true });
  for (const [name, data] of saved)
    await writeFile("dist/private/" + name, data);
}
process.exitCode = status;
