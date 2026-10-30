import { test } from "node:test";
import assert from "node:assert/strict";
import { DrumEngine } from "../src/audio.js";

function audioContext() {
  const sources = [];
  return {
    sources,
    currentTime: 10,
    sampleRate: 48000,
    destination: {},
    resume: async () => {},
    createBuffer: (channels, length, sampleRate) => ({
      channels,
      length,
      sampleRate,
    }),
    createGain: () => ({
      gain: { value: 1, setValueAtTime() {} },
      connect() {},
      disconnect() {},
    }),
    createBufferSource() {
      const source = {
        connect() {},
        disconnect() {},
        start(time) {
          this.startedAt = time ?? 0;
        },
        stop() {
          this.stopped = true;
        },
      };
      sources.push(source);
      return source;
    },
  };
}

test("Playback schedules the first hit immediately, with gapless repeats and cancellable startup", (t) => {
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
  engine.ctx = audioContext();
  engine.master = engine.ctx.createGain();
  const kick = {};
  engine.buffers.set("kick-3", kick);
  const positions = [];
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
  const sources = engine.ctx.sources;
  assert.equal(sources.length, 1);
  assert.equal(sources[0].buffer, kick);
  assert.equal(
    sources[0].startedAt,
    10.08,
    "First hit queued immediately with only a short scheduling margin",
  );
  assert.deepEqual(positions.at(-1), { bar: 0, progress: 0 });
  engine.ctx.currentTime = 10.58;
  schedule();
  draw();
  assert.equal(
    sources.length,
    1,
    "Delayed scheduler does not duplicate the first hit",
  );
  assert.deepEqual(positions.at(-1), { bar: 0, progress: 0.25 });
  engine.ctx.currentTime = 12;
  schedule();
  assert.equal(
    sources[1].startedAt,
    12.08,
    "Repeat has no extra startup delay",
  );
  engine.stop();
  assert.ok(sources.every((source) => source.stopped));
  engine.start(project, () => {});
  engine.stop();
  const count = sources.length;
  engine.ctx.currentTime = 14;
  schedule();
  assert.equal(sources.length, count);
  assert.ok(
    sources.every((source) => source.stopped),
    "Stop cancels future audible sources",
  );
});

test("Preparation starts silent audio in the gesture and waits for rendering, not merely resume", async () => {
  const engine = new DrumEngine();
  engine.ctx = audioContext();
  engine.master = engine.ctx.createGain();
  engine.loading = Promise.resolve();
  let resumed;
  engine.ctx.resume = () =>
    new Promise((resolve) => {
      resumed = resolve;
    });
  const prepared = engine.prepare();
  let ready = false;
  prepared.then(() => {
    ready = true;
  });
  assert.equal(engine.ctx.sources.length, 1);
  const source = engine.ctx.sources[0];
  assert.equal(source.startedAt, 0);
  assert.equal(source.buffer.length, 2880, "Only 60 ms of silent audio");
  resumed();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ready, false, "Resume alone does not prove audio is rendering");
  source.onended();
  await prepared;
  assert.equal(ready, true);
  assert.equal(engine.sources.size, 0, "Finished warmup sources are released");
});
