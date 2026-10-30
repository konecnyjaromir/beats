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
    createBuffer: (channels, length, sampleRate) => {
      const data = new Float32Array(length);
      return { channels, length, sampleRate, getChannelData: () => data };
    },
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
  const warmupRim = {};
  engine.buffers.set("rim-1", warmupRim);
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
  engine.keepOutputOpen();
  const keepAlive = engine.keepAlive;
  const samples = keepAlive.buffer.getChannelData(0);
  assert.ok(
    samples.some((sample) => sample !== 0),
    "USB keepalive is not digital silence",
  );
  assert.ok(
    samples.every((sample) => Math.abs(sample) <= 0.000010001),
    "Keepalive amplitude stays below -100 dBFS peak",
  );
  engine.keepOutputOpen();
  assert.equal(
    engine.keepAlive,
    keepAlive,
    "Only one persistent silent source",
  );
  engine.stop();
  assert.equal(
    keepAlive.stopped,
    undefined,
    "Stopping the loop keeps output ready",
  );
  engine.releaseOutput();
  assert.equal(keepAlive.stopped, true);
  assert.equal(engine.keepAlive, null);
  engine.start(project, (position) => positions.push(position), {
    warmup: true,
  });
  assert.equal(
    sources.at(-1).startedAt,
    14.5,
    "Optional USB warm-up delays the first hit by 500 ms",
  );
  assert.equal(
    sources.at(-2).buffer,
    warmupRim,
    "Warm-up plays the soft rim sample before the loop",
  );
  assert.equal(sources.at(-2).startedAt, 14.01);
  engine.ctx.currentTime = 14.2;
  draw();
  assert.deepEqual(positions.at(-1), { bar: 0, progress: 0 });
  engine.ctx.currentTime = 15;
  draw();
  assert.deepEqual(positions.at(-1), { bar: 0, progress: 0.25 });
  engine.ctx.currentTime = 16.4;
  schedule();
  assert.equal(
    sources.at(-1).startedAt,
    16.5,
    "Warm-up does not delay loop repeats",
  );
  engine.stop();
  engine.start(project, () => {}, { warmup: true });
  const pending = sources.at(-1);
  engine.stop();
  assert.equal(
    pending.stopped,
    true,
    "Stop cancels a hit scheduled after warm-up",
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
  assert.equal(engine.ctx.sources.length, 2);
  assert.equal(engine.ctx.sources[0].loop, true);
  const source = engine.ctx.sources[1];
  assert.equal(source.startedAt, 0);
  assert.equal(source.buffer.length, 2880, "Only 60 ms of silent audio");
  resumed();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ready, false, "Resume alone does not prove audio is rendering");
  source.onended();
  await prepared;
  assert.equal(ready, true);
  assert.equal(engine.sources.size, 0, "Finished warmup sources are released");
  engine.releaseOutput();
});

test("First page interaction prepares audio; hiding releases it and a new gesture retries", async () => {
  const engine = new DrumEngine();
  const page = new EventTarget();
  page.hidden = false;
  let preparations = 0;
  engine.prepare = async () => {
    preparations++;
    engine.ctx = { state: "running" };
    engine.keepAlive = { stop() {}, disconnect() {} };
  };
  const remove = engine.installEarlyUnlock(page);
  page.dispatchEvent(new Event("touchend"));
  assert.equal(preparations, 1, "Unlock begins synchronously in the gesture");
  page.dispatchEvent(new Event("click"));
  await new Promise((resolve) => setImmediate(resolve));
  page.dispatchEvent(new Event("click"));
  assert.equal(
    preparations,
    1,
    "Ready audio is reused without more startup work",
  );
  page.hidden = true;
  page.dispatchEvent(new Event("visibilitychange"));
  assert.equal(engine.keepAlive, null);
  page.hidden = false;
  page.dispatchEvent(new Event("click"));
  assert.equal(preparations, 2);
  await new Promise((resolve) => setImmediate(resolve));
  remove();
  page.dispatchEvent(new Event("click"));
  assert.equal(preparations, 2);
});
