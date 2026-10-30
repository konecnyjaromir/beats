import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import {
  portableLoop,
  loopJson,
  loopFilename,
  readLoopFiles,
  zipLoops,
} from "../src/loopFiles.js";
import { initial } from "../src/model.js";

const file = (name, data) => {
  const bytes = typeof data === "string" ? strToU8(data) : data;
  return {
    name,
    size: bytes.length,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
};
test("JSON and ZIP preserve the original loop format and remove persisted ownership/IDs", async () => {
  const p = {
    ...initial(),
    name: "Žlutý groove",
    id: "a".repeat(32),
    updatedAt: "2026-01-01",
    owner_id: 42,
  };
  const portable = portableLoop(p);
  assert.equal(portable.id, undefined);
  assert.equal(portable.owner_id, undefined);
  assert.deepEqual(JSON.parse(loopJson(p)), portable);
  const legacy = { ...portable };
  delete legacy.bars[0].numerator;
  delete legacy.bars[0].denominator;
  assert.deepEqual(
    await readLoopFiles([file("loop.json", JSON.stringify(legacy))]),
    [legacy],
  );
  const zip = await zipLoops([p, p]);
  assert.deepEqual(await readLoopFiles([file("loops.zip", zip)]), [
    portableLoop(p),
    portableLoop(p),
  ]);
  assert.deepEqual(
    await readLoopFiles([
      file("one.json", loopJson(p)),
      file("two.json", loopJson(p)),
    ]),
    [portableLoop(p), portableLoop(p)],
  );
  assert.ok(!/[\\/]/.test(loopFilename("../../test")));
});
test("Import rejects malformed files, too many loops, and oversized expansion", async () => {
  await assert.rejects(readLoopFiles([file("bad.json", "{")]), /JSON/);
  await assert.rejects(readLoopFiles([file("bad.json", "{}")]), /BEATS/);
  const p = initial();
  await assert.rejects(
    readLoopFiles([file("many.json", JSON.stringify([p, p]))], 1),
  );
  await assert.rejects(
    readLoopFiles([
      file("empty.zip", zipSync({ "readme.txt": strToU8("hello") })),
    ]),
  );
  const bomb = zipSync({ "large.json": new Uint8Array(17 * 1024 * 1024) });
  await assert.rejects(readLoopFiles([file("large.zip", bomb)]), /16 MB/);
});
