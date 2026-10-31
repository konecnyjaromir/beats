import { test } from "node:test";
import assert from "node:assert/strict";
import { trainingCycles } from "../src/training.js";

const project = {
  bpm: 90,
  bars: [
    { numerator: 3, denominator: 4, rows: [] },
    { numerator: 7, denominator: 8, rows: [] },
  ],
};
test("Training includes the final tempo without overshooting, in either direction", () => {
  for (const [start, end, expected] of [
    [100, 107, [100, 105, 107]],
    [107, 100, [107, 102, 100]],
    [100, 100, [100]],
  ]) {
    const plan = trainingCycles(project, { start, end, step: 5, repeats: 2 });
    assert.deepEqual(
      plan.cycles.map((c) => c.bpm),
      expected.flatMap((b) => [b, b]),
    );
    let total = 0;
    for (const cycle of plan.cycles) {
      assert.equal(cycle.at, total);
      assert.ok(Math.abs(cycle.timeline.total - (6.5 * 60) / cycle.bpm) < 1e-8);
      total += cycle.timeline.total;
    }
    assert.equal(plan.total, total);
    assert.equal(project.bpm, 90);
  }
});
