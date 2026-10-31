import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { generateKeyPairSync, sign, randomBytes } from "node:crypto";
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { initial } from "../src/model.js";

const php = process.env.PHP_BIN || "php";
const env = {
  ...process.env,
  BEATS_TEST_DB_HOST: process.env.BEATS_TEST_DB_HOST || "127.0.0.1",
  BEATS_TEST_DB_PORT: process.env.BEATS_TEST_DB_PORT || "13306",
  BEATS_TEST_DB_USER: process.env.BEATS_TEST_DB_USER || "root",
  BEATS_TEST_DB_PASSWORD:
    process.env.BEATS_TEST_DB_PASSWORD || "beats-test-only",
};
const database = "beats_test_" + randomBytes(6).toString("hex");
env.BEATS_TEST_DATABASE = database;
function admin(sql) {
  return execFileSync(
    php,
    [
      "-r",
      '$p=new PDO("mysql:host=".getenv("BEATS_TEST_DB_HOST").";port=".getenv("BEATS_TEST_DB_PORT"),getenv("BEATS_TEST_DB_USER"),getenv("BEATS_TEST_DB_PASSWORD"),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); $p->exec($argv[1]);',
      sql,
    ],
    { env, encoding: "utf8" },
  );
}
const temp = await mkdtemp(path.join(tmpdir(), "beats-mysql-test-"));
const root = path.join(temp, "beats");
await mkdir(root);
await cp("dist", root, { recursive: true });
const quote = (s) =>
  "'" + s.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'";
await writeFile(
  path.join(root, "beats-services.php"),
  `<?php if (!defined('BEATS_INTERNAL')) {http_response_code(404);exit;} return ['admin_email'=>'admin@example.com','mode'=>'mysql','limits'=>['max_loops'=>8,'max_bars'=>1000],'database'=>['host'=>${quote(env.BEATS_TEST_DB_HOST)},'port'=>${Number(env.BEATS_TEST_DB_PORT)},'name'=>'${database}','user'=>${quote(env.BEATS_TEST_DB_USER)},'password'=>${quote(env.BEATS_TEST_DB_PASSWORD)},'prefix'=>'tenant_'],'google'=>['client_id'=>'test.apps.googleusercontent.com','allowed_emails'=>[]]];`,
);
await writeFile(
  path.join(root, "beats-config.php"),
  "<?php if (!defined('BEATS_INTERNAL')) {http_response_code(404);exit;} return ['language'=>'en'];",
);
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
await mkdir(path.join(root, "private"), { recursive: true });
await writeFile(
  path.join(root, "private/google-keys.php"),
  "<?php http_response_code(404); exit; __halt_compiler();\n" +
    JSON.stringify({
      expires: Math.floor(Date.now() / 1000) + 3600,
      keys: { test: publicKey.export({ type: "spki", format: "pem" }) },
    }),
);
function token(nonce, sub, overrides = {}) {
  const head = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: "test" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "https://accounts.google.com",
      aud: "test.apps.googleusercontent.com",
      sub,
      nonce,
      email: sub + "@example.com",
      email_verified: true,
      name: sub,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    }),
  ).toString("base64url");
  return (
    head +
    "." +
    payload +
    "." +
    sign("RSA-SHA256", Buffer.from(head + "." + payload), privateKey).toString(
      "base64url",
    )
  );
}
const base = "http://127.0.0.1:18083/beats/";
function client() {
  let cookie = "",
    csrf = "";
  return async (endpoint, method = "GET", body, headers = {}) => {
    const response = await fetch(base + endpoint, {
      method,
      headers: {
        Cookie: cookie,
        "X-Beats-Request": "1",
        "X-Beats-CSRF": csrf,
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (data?.csrf) csrf = data.csrf;
    return { status: response.status, data, headers: response.headers };
  };
}
let server;
try {
  admin("CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4");
  server = spawn(php, ["-S", "127.0.0.1:18083", "-t", temp], {
    env,
    stdio: "ignore",
  });
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(base);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  assert.ok(ready);
  const a = client(),
    b = client();
  assert.equal(
    (await a("")).status,
    200,
    "Google mode serves login without Basic Auth",
  );
  assert.equal((await a("api/loops.php")).status, 401);
  const publicDemo = await a("api/demo.php");
  assert.equal(publicDemo.status, 200);
  assert.equal(publicDemo.data.length, 6);
  assert.equal(publicDemo.headers.get("set-cookie"), null);
  assert.ok(publicDemo.data.every((loop) => !loop.id && !loop.owner_id));
  assert.equal((await a("api/starter-loops.php")).status, 404);
  assert.equal((await a("beats-services.php")).status, 404);
  assert.equal((await a("private/google-keys.php")).status, 404);
  const config = await a("api/config.php");
  assert.match(config.data, /"max_bars":1000/);
  assert.ok(!config.data.includes(env.BEATS_TEST_DB_PASSWORD));
  const first = (await a("api/auth.php")).data;
  assert.equal(first.user, null);
  assert.equal(
    (
      await a(
        "api/auth.php",
        "POST",
        { credential: token(first.nonce, "alice") },
        { "X-Beats-CSRF": "" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await a(
        "api/auth.php",
        "POST",
        { credential: token(first.nonce, "alice") },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  for (const claims of [
    { aud: "evil.apps.googleusercontent.com" },
    { iss: "https://evil.example" },
    { exp: 1 },
    { nonce: "other" },
    { email_verified: false },
  ]) {
    assert.equal(
      (
        await a("api/auth.php", "POST", {
          credential: token(first.nonce, "alice", claims),
        })
      ).status,
      401,
    );
  }
  let signed = token(first.nonce, "alice");
  const chunks = signed.split(".");
  const sig = Buffer.from(chunks[2], "base64url");
  sig[0] ^= 255;
  chunks[2] = sig.toString("base64url");
  assert.equal(
    (await a("api/auth.php", "POST", { credential: chunks.join(".") })).status,
    401,
  );
  assert.equal(
    (await a("api/auth.php", "POST", { credential: signed })).status,
    200,
  );
  const second = (await b("api/auth.php")).data;
  assert.equal(
    (
      await b("api/auth.php", "POST", {
        credential: token(second.nonce, "bob"),
      })
    ).status,
    200,
  );
  assert.equal((await client()("api/admin.php")).status, 401);
  assert.equal((await a("api/auth.php")).data.user.isAdmin, false);
  assert.equal((await a("api/admin.php?email=admin@example.com")).status, 403);
  assert.equal(
    (
      await b("api/admin.php", "GET", undefined, {
        "X-Admin-Email": "admin@example.com",
      })
    ).status,
    403,
  );
  const administrator = client();
  const adminNonce = (await administrator("api/auth.php")).data.nonce;
  const adminLogin = await administrator("api/auth.php", "POST", {
    credential: token(adminNonce, "admin"),
  });
  assert.equal(adminLogin.data.user.isAdmin, true);
  assert.equal((await administrator("api/auth.php")).data.user.isAdmin, true);
  admin(
    `INSERT INTO \`${database}\`.tenant_users (google_sub,email,name,created_at) VALUES ('empty','empty@example.com','Empty',UTC_TIMESTAMP())`,
  );
  const overview = await administrator("api/admin.php");
  assert.equal(overview.status, 200);
  assert.equal(overview.data.total, 4);
  assert.equal(
    overview.data.users.find((u) => u.email === "alice@example.com").loop_count,
    6,
  );
  assert.equal(
    overview.data.users.find((u) => u.email === "empty@example.com").loop_count,
    0,
  );
  assert.ok(
    overview.data.users.every(
      (u) => Object.keys(u).sort().join(",") === "email,loop_count,name",
    ),
  );
  assert.equal((await administrator("api/admin.php", "POST", {})).status, 405);
  assert.equal((await administrator("api/admin.php?page=-1")).status, 400);
  assert.equal(
    (await administrator("api/admin.php?page=2")).data.users.length,
    0,
  );
  const adminSettingsPath = path.join(root, "beats-services.php");
  const adminSettings = await readFile(adminSettingsPath, "utf8");
  await writeFile(
    adminSettingsPath,
    adminSettings.replace(
      "'admin_email'=>'admin@example.com'",
      "'admin_email'=>''",
    ),
  );
  assert.equal(
    (await administrator("api/admin.php")).status,
    403,
    "Existing sessions lose admin access when configuration is disabled",
  );
  assert.equal((await administrator("api/auth.php")).data.user.isAdmin, false);
  await writeFile(adminSettingsPath, adminSettings);
  const seeds = (await a("api/loops.php")).data;
  assert.equal(seeds.length, 6, "New accounts receive six starter rhythms");
  assert.deepEqual(
    seeds.map((s) => s.name).sort(),
    [
      "Eighth Note Feel – With Syncopation",
      "Ghost Note Grooves",
      "Half-Time Shuffle",
      "Swing with feathered BD + rim click",
      "Trioly proti rovným osminám",
      "Blues Shuffle - 12 bars with turnaround",
    ].sort(),
  );
  const trio = (
    await a(
      "api/loops.php?id=" + seeds.find((s) => s.name.startsWith("Trioly")).id,
    )
  ).data;
  assert.ok(
    trio.bars[0].rows
      .find((r) => r.instrument === "ride")
      .steps.every((v) => v === 2),
  );
  const blues = (
    await a(
      "api/loops.php?id=" + seeds.find((s) => s.name.startsWith("Blues")).id,
    )
  ).data;
  assert.equal(blues.bars.length, 12);
  assert.ok(
    blues.bars[11].rows
      .find((r) => r.instrument === "tomLow")
      .steps.some(Boolean),
  );
  const bobSeeds = (await b("api/loops.php")).data;
  assert.equal(bobSeeds.length, 6);
  assert.ok(bobSeeds.every((s) => !seeds.some((a) => a.id === s.id)));
  for (const s of seeds)
    assert.equal((await a("api/loops.php?id=" + s.id, "DELETE")).status, 200);
  for (const s of bobSeeds)
    assert.equal((await b("api/loops.php?id=" + s.id, "DELETE")).status, 200);
  const settingsPath = path.join(root, "beats-services.php");
  await writeFile(
    settingsPath,
    (await readFile(settingsPath, "utf8")).replace(
      "'max_loops'=>8",
      "'max_loops'=>2",
    ),
  );
  const p = initial();
  p.name = "Private loop";
  const saved = await a("api/loops.php", "POST", p);
  assert.equal(saved.status, 201);
  const id = saved.data.id;
  assert.equal((await b("api/loops.php?id=" + id)).status, 404);
  assert.equal((await b("api/loops.php", "POST", { ...p, id })).status, 404);
  assert.equal((await b("api/loops.php?id=" + id, "DELETE")).status, 404);
  assert.deepEqual((await b("api/loops.php")).data, []);
  assert.equal(
    (await a("api/loops.php", "POST", { ...saved.data, name: "Renamed" }))
      .status,
    200,
  );
  const thousand = {
    ...p,
    bars: Array.from({ length: 1000 }, (_, i) => ({
      ...p.bars[0],
      id: "bar-" + i,
    })),
  };
  assert.equal((await a("api/loops.php", "POST", thousand)).status, 201);
  assert.equal(
    (await a("api/loops.php", "POST", p)).status,
    409,
    "Account quota is enforced",
  );
  assert.equal(
    (
      await b("api/loops.php", "POST", {
        ...thousand,
        bars: [...thousand.bars, thousand.bars[0]],
      })
    ).status,
    400,
  );
  assert.equal(
    (await b("api/loops.php", "POST", p)).status,
    201,
    "Quotas are per user",
  );
  assert.equal((await a("api/loops.php")).data.length, 2);
  assert.equal(
    (
      await a(
        "api/auth.php",
        "POST",
        { action: "logout" },
        { "X-Beats-CSRF": "" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await a("api/auth.php", "POST", { action: "logout" })).status,
    200,
  );
  assert.equal((await a("api/loops.php")).status, 401);
  const again = (await a("api/auth.php")).data;
  assert.equal(
    (
      await a("api/auth.php", "POST", {
        credential: token(again.nonce, "alice", {
          email: "renamed@example.com",
        }),
      })
    ).status,
    200,
  );
  assert.equal(
    (await a("api/loops.php")).data.length,
    2,
    "Account uses stable Google subject",
  );
  assert.equal((await a("api/loops.php?id=" + id, "DELETE")).status, 200);
  const otherSession = client();
  const otherNonce = (await otherSession("api/auth.php")).data.nonce;
  assert.equal(
    (
      await otherSession("api/auth.php", "POST", {
        credential: token(otherNonce, "alice"),
      })
    ).status,
    200,
  );
  assert.equal(
    (await a("api/loops.php")).data.length,
    1,
    "Signing in does not restore deleted examples",
  );
  assert.equal(
    (
      await a(
        "api/auth.php",
        "POST",
        { action: "delete-account", confirm: true },
        { "X-Beats-CSRF": "" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await a("api/auth.php", "POST", { action: "delete-account" })).status,
    400,
  );
  const deletedIds = (await a("api/loops.php")).data.map((p) => p.id);
  assert.equal(
    (
      await a("api/auth.php", "POST", {
        action: "delete-account",
        confirm: true,
      })
    ).status,
    200,
  );
  assert.equal((await a("api/loops.php")).status, 401);
  assert.equal(
    (await otherSession("api/loops.php")).status,
    401,
    "Old sessions lose access after deletion",
  );
  assert.equal(
    (await b("api/loops.php")).data.length,
    1,
    "Other accounts remain untouched",
  );
  const newNonce = (await a("api/auth.php")).data.nonce;
  assert.equal(
    (await a("api/auth.php", "POST", { credential: token(newNonce, "alice") }))
      .status,
    200,
  );
  assert.equal(
    (await a("api/loops.php")).data.length,
    2,
    "Fresh registration seeds within configured quota",
  );
  for (const oldId of deletedIds)
    assert.equal((await a("api/loops.php?id=" + oldId)).status, 404);
  console.log(
    "PASS: MySQL auto-setup/custom prefix, signed Google tokens, sessions/CSRF, isolation, quotas, 1000 bars and logout.",
  );
} finally {
  server?.kill();
  if (server && server.exitCode === null)
    await new Promise((r) => server.once("exit", r));
  if (!/^beats_test_[a-f0-9]{12}$/.test(database))
    throw Error("Unsafe test database name");
  admin("DROP DATABASE IF EXISTS `" + database + "`");
  await rm(temp, { recursive: true, force: true });
}
