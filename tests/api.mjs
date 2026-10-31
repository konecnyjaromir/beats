import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtemp,
  rm,
  mkdir,
  cp,
  writeFile,
  readdir,
  readFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { initial, instruments, row } from "../src/model.js";

const php = process.env.PHP_BIN || "php";
const temp = await mkdtemp(path.join(tmpdir(), "beats-basic-test-"));
const root = path.join(temp, "web");
await mkdir(path.join(root, "beats"), { recursive: true });
await cp("dist", path.join(root, "beats"), { recursive: true });
await writeFile(
  path.join(root, "beats/beats-services.php"),
  "<?php if (!defined('BEATS_INTERNAL')) { http_response_code(404); exit; } return ['mode'=>'json'];",
);
for (const name of await readdir(path.join(root, "beats/private"))) {
  if (/^[a-f0-9]{32}\.json\.php$/.test(name))
    await rm(path.join(root, "beats/private", name));
}
// Test-only credentials. Never modify the supplied production hashes.
const hash = execFileSync(
  php,
  ["-r", "echo password_hash('test-only-password', PASSWORD_DEFAULT);"],
  { encoding: "utf8" },
);
await writeFile(
  path.join(root, "beats/beats-auth.php"),
  `<?php if (!defined('BEATS_INTERNAL')) { http_response_code(404); exit; } return ['users'=>['jarek'=>'${hash}','stepanka'=>'${hash}']];`,
);
const server = spawn(php, ["-S", "127.0.0.1:18081", "-t", root], {
  env: {
    ...process.env,
  },
  stdio: "ignore",
});
let spawnError;
server.on("error", (e) => (spawnError = e));
const base = "http://127.0.0.1:18081/beats/";
const credentials = (user) =>
  "Basic " + Buffer.from(user + ":test-only-password").toString("base64");
let authorization = credentials("jarek");
async function req(method = "GET", body, id = "", headers = {}) {
  return fetch(base + "api/loops.php" + (id ? "?id=" + id : ""), {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Beats-Request": "1",
      Authorization: authorization,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (spawnError) throw spawnError;
    try {
      await fetch(base);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  assert.ok(ready);
  const settingsPath = path.join(root, "beats/beats-config.php");
  const authHeaders = { Authorization: authorization };
  await rm(settingsPath);
  let settingsResponse = await fetch(base + "api/config.php", {
    headers: authHeaders,
  });
  assert.match(await settingsResponse.text(), /"language":"en"/);
  assert.equal((await req("POST", { ...initial(), bpm: 0 })).status, 400);
  assert.equal(
    (await (await req("POST", { ...initial(), bpm: 0 })).json()).error,
    "Invalid tempo.",
  );
  await writeFile(
    settingsPath,
    "<?php if (!defined('BEATS_INTERNAL')) { http_response_code(404); exit; } return ['language'=>'cs'];",
  );
  settingsResponse = await fetch(base + "api/config.php", {
    headers: authHeaders,
  });
  const publicSettings = await settingsResponse.text();
  assert.match(publicSettings, /"language":"cs"/);
  assert.ok(
    !publicSettings.includes("users") && !publicSettings.includes("password"),
  );
  assert.equal(
    (await (await req("POST", { ...initial(), bpm: 0 })).json()).error,
    "Neplatné tempo.",
  );
  assert.equal((await fetch(base + "beats-config.php")).status, 404);
  assert.equal((await fetch(base + "api/config.php")).status, 401);
  const configResponse = await fetch(base + "beats-auth.php");
  assert.equal(configResponse.status, 404);
  assert.equal(await configResponse.text(), "");
  const anon = await fetch(base);
  assert.equal(anon.status, 401);
  assert.match(anon.headers.get("www-authenticate"), /^Basic realm="BEATS"/);
  const page = await fetch(base, { headers: { Authorization: authorization } });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /id="root"/);
  assert.equal(
    (await fetch(base + "index.html")).status,
    401,
    "No unguarded HTML entry",
  );
  assert.equal(
    (await req("GET", undefined, "", { Authorization: "" })).status,
    401,
  );
  assert.equal(
    (await req("POST", initial(), "", { Authorization: "" })).status,
    401,
  );
  assert.equal(
    (await req("DELETE", undefined, "a".repeat(32), { Authorization: "" }))
      .status,
    401,
  );
  assert.equal(
    (
      await req("GET", undefined, "", {
        Authorization: "Basic " + Buffer.from("jarek:wrong").toString("base64"),
      })
    ).status,
    401,
  );
  assert.equal(
    (await req("GET", undefined, "", { Authorization: credentials("unknown") }))
      .status,
    401,
  );
  assert.equal(
    (await req("POST", initial(), "", { "X-Beats-Request": "" })).status,
    403,
  );
  authorization = credentials("stepanka");
  assert.equal((await req()).status, 200);
  authorization = credentials("jarek");
  assert.deepEqual(await (await req()).json(), []);
  let p = initial();
  p.bars[0].rows = instruments.map((i) => ({
    ...row(i.id, 3),
    steps: [1, 2, 3],
  }));
  let response = await req("POST", p);
  assert.equal(response.status, 201);
  p = await response.json();
  const stored = await readFile(
    path.join(root, "beats/private", p.id + ".json.php"),
    "utf8",
  );
  assert.ok(
    stored.startsWith(
      "<?php http_response_code(404); exit; __halt_compiler();\n",
    ),
  );
  assert.deepEqual(
    JSON.parse(stored.slice(stored.indexOf("\n") + 1)).bars,
    p.bars,
  );
  for (const headers of [{}, { Authorization: authorization }]) {
    const direct = await fetch(base + "private/" + p.id + ".json.php", {
      headers,
    });
    assert.equal(direct.status, 404);
    assert.equal(await direct.text(), "");
  }
  assert.deepEqual(
    (await (await req("GET", undefined, p.id)).json()).bars,
    p.bars,
  );
  p.name = "Test změny";
  p.bpm = 137;
  p.bars.push({
    ...structuredClone(p.bars[0]),
    id: "mixed-bar",
    numerator: 7,
    denominator: 8,
  });
  assert.equal((await req("POST", p)).status, 200);
  assert.deepEqual(
    (await (await req("GET", undefined, p.id)).json()).bars,
    p.bars,
  );
  const list = await (await req()).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].bpm, 137);
  assert.deepEqual(list[0].meters, ["4/4", "7/8"]);
  for (let numerator = 1; numerator <= 24; numerator++) {
    const meter = structuredClone(p);
    meter.bars[1].numerator = numerator;
    assert.equal((await req("POST", meter)).status, 200);
    assert.equal(
      (await (await req("GET", undefined, p.id)).json()).bars[1].numerator,
      numerator,
    );
  }
  for (const numerator of [0, 25, 1.5, "4"]) {
    const meter = structuredClone(p);
    meter.bars[1].numerator = numerator;
    assert.equal((await req("POST", meter)).status, 400);
  }
  const invalid = structuredClone(p);
  invalid.bars[1].denominator = 3;
  assert.equal((await req("POST", invalid)).status, 400);
  assert.equal((await req("POST", { ...p, bpm: 0 })).status, 400);
  assert.equal((await req("POST", { ...p, bars: [] })).status, 400);
  assert.equal((await req("GET", undefined, "../x")).status, 400);
  assert.equal(
    (await req("POST", p, "", { Origin: "https://example.com" })).status,
    403,
  );
  assert.equal((await req("DELETE", undefined, p.id)).status, 200);
  assert.equal((await req("GET", undefined, p.id)).status, 404);
  assert.deepEqual(await (await req()).json(), []);
  // Existing files must load with the old global signature without rewriting them.
  const legacy = {
    ...initial(),
    id: "b".repeat(32),
    numerator: 5,
    denominator: 8,
    updatedAt: "2026-01-01T00:00:00Z",
  };
  delete legacy.bars[0].numerator;
  delete legacy.bars[0].denominator;
  const legacyFile = path.join(root, "beats/private", legacy.id + ".json.php");
  const legacyBytes =
    "<?php http_response_code(404); exit; __halt_compiler();\n" +
    JSON.stringify(legacy);
  await writeFile(legacyFile, legacyBytes);
  const loaded = await (await req("GET", undefined, legacy.id)).json();
  assert.equal(loaded.bars[0].numerator, 5);
  assert.equal(loaded.bars[0].denominator, 8);
  assert.deepEqual(loaded.bars[0].rows, legacy.bars[0].rows);
  assert.deepEqual((await (await req()).json())[0].meters, ["5/8"]);
  assert.equal(await readFile(legacyFile, "utf8"), legacyBytes);
  assert.equal(
    (await req("POST", legacy)).status,
    200,
    "Old-format clients remain accepted",
  );
  assert.equal(
    (await (await req("GET", undefined, legacy.id)).json()).bars[0].numerator,
    5,
  );
  console.log(
    "PASS: /beats Basic Auth challenge, protected entry, both users, wrong credentials, protected CRUD, CSRF and validation.",
  );
} finally {
  server.kill();
  if (server.exitCode === null)
    await new Promise((r) => server.once("exit", r));
  await rm(temp, { recursive: true, force: true });
}
