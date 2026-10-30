import { mkdir, mkdtemp, cp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

// An update must never contain user loops or authentication credentials.
const staging = await mkdtemp(path.join(tmpdir(), "beats-update-"));
try {
  for (const name of [
    "index.php",
    "beats-config.php",
    "api",
    "assets",
    "samples",
  ]) {
    await cp(path.resolve("dist", name), path.join(staging, name), {
      recursive: true,
    });
  }
  const output = path.resolve("beats-update.zip");
  await rm(output, { force: true });
  let result;
  if (process.platform === "win32") {
    // Pass paths as environment variables, never interpolate them into shell code.
    result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory($env:BEATS_PACKAGE_SOURCE,$env:BEATS_PACKAGE_TARGET)",
      ],
      {
        env: {
          ...process.env,
          BEATS_PACKAGE_SOURCE: staging,
          BEATS_PACKAGE_TARGET: output,
        },
        stdio: "inherit",
      },
    );
  } else {
    result = spawnSync("zip", ["-qr", output, "."], {
      cwd: staging,
      stdio: "inherit",
    });
  }
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw Error("Could not create update archive. Install zip on Linux/macOS.");
  console.log("Created beats-update.zip (no credentials or user data).");
} finally {
  await rm(staging, { recursive: true, force: true });
}
