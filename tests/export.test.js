import { test } from "node:test";
import assert from "node:assert/strict";
import { midiBytes, gmDrums } from "../src/midiExport.js";
import { notationTiming, notationVoices } from "../src/notation.js";
test("Shared staff merges matching grids into chords without losing independent rhythms", () => {
  const voices = notationVoices([
    { instrument: "kick", steps: [3, 0, 0, 0] },
    { instrument: "snare", steps: [1, 0, 2, 0] },
    { instrument: "ride", steps: [2, 2, 2] },
    { instrument: "hat", steps: [2, 2, 2, 2] },
    { instrument: "crash", steps: [3], muted: true },
    { instrument: "tomHigh", steps: [0, 0] },
  ]);
  assert.deepEqual(
    voices.map((v) => v.steps.length),
    [4, 3, 4],
  );
  assert.deepEqual(
    voices[0].steps[0].map((h) => [h.instrument, h.level]),
    [
      ["kick", 3],
      ["snare", 1],
    ],
  );
});

function parse(bytes) {
  const view = new DataView(bytes.buffer);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "MThd");
  assert.equal(view.getUint16(8), 1);
  assert.equal(view.getUint16(12), 960);
  let p = 14;
  const tracks = [];
  const variable = () => {
    let n = 0,
      b;
    do {
      b = bytes[p++];
      n = n * 128 + (b & 127);
    } while (b & 128);
    return n;
  };
  while (p < bytes.length) {
    assert.equal(new TextDecoder().decode(bytes.slice(p, p + 4)), "MTrk");
    const end = p + 8 + view.getUint32(p + 4);
    p += 8;
    let tick = 0;
    const events = [];
    while (p < end) {
      tick += variable();
      const type = bytes[p++];
      if (type === 255) {
        const meta = bytes[p++],
          length = variable();
        events.push({
          tick,
          type,
          meta,
          data: [...bytes.slice(p, p + length)],
        });
        p += length;
      } else {
        events.push({ tick, type, data: [bytes[p++], bytes[p++]] });
      }
    }
    assert.equal(p, end);
    tracks.push(events);
  }
  return tracks;
}
test("MIDI preserves triplets, dynamics, GM instruments, changing meter and silent tail", () => {
  const project = {
    bpm: 120,
    numerator: 4,
    denominator: 4,
    bars: [
      {
        rows: [
          { instrument: "ride", steps: [1, 2, 3] },
          { instrument: "tomHigh", steps: [2, 0, 0, 0] },
          { instrument: "maracas", steps: [3], muted: true },
        ],
      },
      {
        numerator: 7,
        denominator: 8,
        rows: [{ instrument: "maracas", steps: [2] }],
      },
      { numerator: 1, denominator: 16, rows: [] },
    ],
  };
  const [conductor, drums] = parse(midiBytes(project));
  assert.deepEqual(conductor.find((e) => e.meta === 81).data, [7, 161, 32]);
  assert.deepEqual(
    conductor
      .filter((e) => e.meta === 88)
      .map((e) => [e.tick, ...e.data.slice(0, 2)]),
    [
      [0, 4, 2],
      [3840, 7, 3],
      [7200, 1, 4],
    ],
  );
  assert.deepEqual(
    drums
      .filter((e) => e.type === 153 && e.data[0] === 51)
      .map((e) => [e.tick, e.data[1]]),
    [
      [0, 40],
      [1280, 85],
      [2560, 120],
    ],
  );
  assert.equal(
    drums.filter((e) => e.type === 153 && e.data[0] === 70).length,
    1,
  );
  assert.ok(drums.some((e) => e.type === 153 && e.data[0] === 50));
  assert.equal(drums.at(-1).tick, 7440);
  assert.equal(conductor.at(-1).tick, 7440);
  assert.equal(Object.keys(gmDrums).length, 18);
});
test("MIDI merges duplicate simultaneous notes and supports large exports", () => {
  const bar = {
    rows: [
      { instrument: "kick", steps: [1] },
      { instrument: "kick", steps: [3] },
    ],
  };
  const tracks = parse(
    midiBytes({
      bpm: 80,
      numerator: 24,
      denominator: 4,
      bars: Array(1000).fill(bar),
    }),
  );
  assert.equal(tracks[1].filter((e) => e.type === 153).length, 1000);
  assert.equal(tracks[1].find((e) => e.type === 153).data[1], 120);
  assert.equal(tracks[1].at(-1).tick, 23040000);
});
test("Notation durations sum to the full bar for every supported meter and division", () => {
  for (let n = 1; n <= 24; n++)
    for (const d of [4, 8, 16])
      for (let steps = 1; steps <= 64; steps++) {
        const { base, count, occupied } = notationTiming(n, d, steps);
        assert.ok(
          Math.abs(((steps / base) * occupied) / count - n / d) < 1e-10,
          `${n}/${d}, ${steps}`,
        );
      }
  assert.deepEqual(notationTiming(4, 4, 12), {
    base: 8,
    count: 3,
    occupied: 2,
  });
});
