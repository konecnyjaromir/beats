import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";

const serverPackage = process.argv.includes("--server");
const files = {};
async function addTree(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const target = destination + "/" + entry.name;
    if (entry.isDirectory())
      await addTree(path.join(source, entry.name), target);
    else if (entry.isFile())
      files[target] = new Uint8Array(
        await readFile(path.join(source, entry.name)),
      );
  }
}
for (const name of [
  "api",
  "assets",
  "samples",
  "licenses",
  "vendor",
  "database",
]) {
  await addTree(path.join("dist", name), name);
}
for (const name of [
  "index.php",
  "beats-config.php",
  "beats-services.example.php",
  "privacy.html",
  ".htaccess",
  ...(serverPackage ? ["beats-services.php"] : []),
]) {
  files[name] = new Uint8Array(await readFile(path.join("dist", name)));
}
if (serverPackage) {
  // Include only the empty storage guards, never existing user loops or caches.
  for (const name of [".htaccess", "index.php"])
    files["private/" + name] = new Uint8Array(
      await readFile(path.join("public/private", name)),
    );
  files["DEPLOYMENT.md"] = new Uint8Array(await readFile("DEPLOYMENT.md"));
}
const output = serverPackage ? "beats-server.zip" : "beats-update.zip";
// Explicit forward-slash entry names work with both Linux hosting and Windows.
await writeFile(output, zipSync(files, { level: 6 }));
console.log(
  serverPackage
    ? "Created beats-server.zip (contains private service credentials; do not publish)."
    : "Created beats-update.zip (no credentials or user data).",
);
