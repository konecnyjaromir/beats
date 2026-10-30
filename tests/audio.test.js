import { test } from "node:test";
import assert from "node:assert/strict";
import { DrumEngine } from "../src/audio.js";

test("Playback waits for audio startup without dropping the first hit or adding gaps to repeats", (t) => {
  let schedule;
  let draw;
  t.mock.method(globalThis, "setInterval", (callback) => {
    schedule = callback;
    return 1;
  });
  t.mock.method(globalThis, "clearInterval", () => {});
  const previousFrame = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => {
    draw = callback;
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {};
  t.after(() => {
    if (previousFrame) globalThis.requestAnimationFrame = previousFrame;
    else delete globalThis.requestAnimationFrame;
    if (previousCancel) globalThis.cancelAnimationFrame = previousCancel;
    else delete globalThis.cancelAnimationFrame;
  });

  const engine = new DrumEngine();
  engine.ctx = { currentTime: 10 };
  const hits = [];
  const positions = [];
  engine.hit = (...args) => hits.push(args);
  const project = {
    bpm: 120,
    bars: [
      {
        numerator: 4,
        denominator: 4,
        rows: [{ instrument: "kick", steps: [3] }],
      },
    ],
  };
  engine.start(project, (position) => positions.push(position));
  assert.equal(hits.length, 0);
  assert.deepEqual(positions.at(-1), { bar: 0, progress: 0 });
  engine.ctx.currentTime = 10.2;
  schedule();
  assert.deepEqual(hits, [["kick", 3, 10.3]]);
  engine.ctx.currentTime = 10.8;
  draw();
  assert.deepEqual(positions.at(-1), { bar: 0, progress: 0.25 });
  engine.ctx.currentTime = 12.2;
  schedule();
  assert.deepEqual(hits[1], ["kick", 3, 12.3]);
  engine.stop();
  engine.start(project, () => {});
  engine.stop();
  engine.ctx.currentTime = 12.5;
  schedule();
  assert.equal(hits.length, 2, "Stopping during startup cancels the first hit");
});
