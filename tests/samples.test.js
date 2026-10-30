import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { instruments } from "../src/model.js";

test("AVL's non-GM map assigns actual toms and maracas", () => {
  const notes = Object.fromEntries(instruments.map((i) => [i.id, i.note]));
  assert.equal(notes.tomHigh, 45); // Pearl 12-inch tom
  assert.equal(notes.tomMid, 47); // Pearl 13-inch tom, explicitly sourced from 5pc kit
  assert.equal(notes.tomLow, 41); // Floor tom
  assert.equal(notes.maracas, 64);
  assert.ok(!instruments.some((i) => i.note === 48 || i.note === 61)); // Swish hi-hat / roto tom
});

test("Every sample matches its licensed, pinned source manifest", () => {
  const root = new URL("../public/samples/", import.meta.url);
  const manifest = JSON.parse(
    readFileSync(new URL("manifest.json", root), "utf8"),
  );
  assert.equal(manifest.files.length, instruments.length * 3);
  for (const instrument of instruments)
    for (const velocity of [1, 3, 5]) {
      const name = `${instrument.note}_v${velocity}.wav`;
      const item = manifest.files.find((file) => file.file === name);
      assert.ok(item, `Missing provenance for ${name}`);
      const data = readFileSync(new URL(name, root));
      assert.equal(
        createHash("sha256").update(data).digest("hex"),
        item.sha256,
      );
    }
  for (const name of [
    "AVL-Drumkits-License.pdf",
    "CC-BY-SA-3.0.txt",
    "ATTRIBUTION.md",
  ])
    assert.ok(readFileSync(new URL(name, root)).length > 100);
});
