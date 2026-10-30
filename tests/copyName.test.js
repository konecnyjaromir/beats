import { test } from "node:test";
import assert from "node:assert/strict";
import { copyName } from "../src/copyName.js";

test("Copies get localized, numbered names without stacking suffixes", () => {
  assert.equal(copyName("Groove", [], "kopie"), "Groove (kopie)");
  assert.equal(
    copyName("Groove (copy)", ["Groove (copy)", "Groove (copy 2)"], "copy"),
    "Groove (copy 3)",
  );
  assert.equal(
    copyName("Groove (kopie)", ["GROOVE (COPY)"], "copy"),
    "Groove (copy 2)",
  );
});
test("Long names leave room for the suffix and keep the title length limit", () => {
  const original = "x".repeat(80);
  const first = copyName(original, [], "kopie");
  const second = copyName(original, [first], "kopie");
  assert.equal(first.length, 80);
  assert.equal(second.length, 80);
  assert.ok(second.endsWith(" (kopie 2)"));
});
