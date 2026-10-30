import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../src/demo.js";
import { initial } from "../src/model.js";

test("Demo edits, copies and deletes stay isolated from examples and other sessions", async () => {
  const example = { ...initial(), name: "Trioly test" };
  const demo = createDemo([example]);
  const another = createDemo([example]);
  const first = demo.first;
  first.name = "Changed";
  assert.equal((await demo.request("GET", null, first.id)).name, "Trioly test");
  await demo.request("POST", first);
  assert.equal((await demo.request("GET", null, first.id)).name, "Changed");
  const { id, ...copy } = first;
  const saved = await demo.request("POST", copy);
  assert.notEqual(saved.id, id);
  assert.equal((await demo.request()).length, 2);
  await demo.request("DELETE", null, id);
  await assert.rejects(demo.request("GET", null, id));
  assert.equal((await another.request()).length, 1);
  assert.equal(another.first.name, "Trioly test");
  assert.equal(example.name, "Trioly test");
});
