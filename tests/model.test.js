import { test } from "node:test";
import assert from "node:assert/strict";
import {
  barDuration,
  eventsForBar,
  normalizeProject,
  timelineFor,
  positionAt,
} from "../src/model.js";
test("Legacy loops inherit the global meter without changing hits", () => {
  const old = {
    bpm: 120,
    numerator: 7,
    denominator: 8,
    bars: [
      { rows: [{ steps: [1, 0, 3] }] },
      { numerator: 3, denominator: 4, rows: [] },
    ],
  };
  const migrated = normalizeProject(old);
  assert.equal(migrated.bars[0].numerator, 7);
  assert.equal(migrated.bars[0].denominator, 8);
  assert.equal(migrated.bars[1].numerator, 3);
  assert.deepEqual(migrated.bars[0].rows, old.bars[0].rows);
  assert.equal(old.bars[0].numerator, undefined);
});
test("Mixed meters have correct durations, transitions and loop boundaries", () => {
  const timeline = timelineFor({
    bpm: 120,
    bars: [
      { numerator: 4, denominator: 4 },
      { numerator: 3, denominator: 4 },
      { numerator: 7, denominator: 8 },
    ],
  });
  assert.deepEqual(timeline, {
    bars: [
      { start: 0, duration: 2 },
      { start: 2, duration: 1.5 },
      { start: 3.5, duration: 1.75 },
    ],
    total: 5.25,
  });
  assert.deepEqual(positionAt(timeline, 2), { bar: 1, progress: 0 });
  assert.deepEqual(positionAt(timeline, 2.75), { bar: 1, progress: 0.5 });
  assert.deepEqual(positionAt(timeline, 3.5), { bar: 2, progress: 0 });
  assert.deepEqual(positionAt(timeline, 5.25), { bar: 0, progress: 0 });
  assert.deepEqual(positionAt(timeline, 7.25), { bar: 1, progress: 0 });
});
test("Bar duration respects quarter-note BPM and the meter denominator", () => {
  assert.equal(barDuration({ bpm: 120, numerator: 4, denominator: 4 }), 2);
  assert.equal(barDuration({ bpm: 120, numerator: 7, denominator: 8 }), 1.75);
  assert.equal(barDuration({ bpm: 60, numerator: 3, denominator: 16 }), 0.75);
});
test("Triplets and sixteenth notes share the same bar; muted rows stay silent", () => {
  const events = eventsForBar(
    {
      rows: [
        { instrument: "kick", steps: [1, 2, 3] },
        { instrument: "snare", steps: Array(16).fill(3) },
        { instrument: "hat", steps: [3], muted: true },
      ],
    },
    2,
  );
  assert.equal(events.length, 19);
  assert.deepEqual(
    events.filter((e) => e.instrument === "kick").map((e) => e.time),
    [0, 2 / 3, 4 / 3],
  );
  assert.equal(events.at(-1).time, 1.875);
});
