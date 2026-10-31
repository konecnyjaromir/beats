// General MIDI percussion numbers, independent of our sample library indices.
export const gmDrums = {
  kick: 36,
  snare: 38,
  hat: 42,
  openhat: 46,
  crash: 49,
  ride: 51,
  tomHigh: 50,
  tomMid: 47,
  tomLow: 41,
  rim: 37,
  clap: 39,
  tambourine: 54,
  cowbell: 56,
  maracas: 70,
  pedalHat: 44,
  snareEdge: 40,
  rideBell: 53,
  splash: 55,
};
const ppq = 960;
const text = (value) => [...new TextEncoder().encode(value)];
const int = (n, bytes) =>
  Array.from({ length: bytes }, (_, i) => (n >>> ((bytes - i - 1) * 8)) & 255);
function vlq(n) {
  const bytes = [n & 127];
  while ((n = Math.floor(n / 128))) bytes.unshift((n & 127) | 128);
  return bytes;
}
function track(events, end) {
  const data = [];
  let previous = 0;
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  for (const event of events) {
    data.push(...vlq(event.tick - previous), ...event.bytes);
    previous = event.tick;
  }
  data.push(...vlq(Math.max(0, end - previous)), 255, 47, 0);
  return [...text("MTrk"), ...int(data.length, 4), ...data];
}
export function midiBytes(project) {
  const tempo = Math.round(60000000 / project.bpm);
  const conductor = [
    { tick: 0, order: 0, bytes: [255, 81, 3, ...int(tempo, 3)] },
  ];
  const hits = new Map();
  let start = 0,
    signature = "";
  for (const bar of project.bars) {
    const n = bar.numerator ?? project.numerator,
      d = bar.denominator ?? project.denominator;
    const duration = (ppq * n * 4) / d;
    if (`${n}/${d}` !== signature) {
      conductor.push({
        tick: start,
        order: 1,
        bytes: [255, 88, 4, n, Math.log2(d), 24, 8],
      });
      signature = `${n}/${d}`;
    }
    for (const row of bar.rows.filter((r) => !r.muted))
      row.steps.forEach((level, index) => {
        if (!level) return;
        const pitch = gmDrums[row.instrument];
        if (pitch === undefined) throw Error("Unknown percussion instrument");
        const tick = start + Math.round((index * duration) / row.steps.length),
          key = `${tick}:${pitch}`;
        const hit = {
          tick,
          pitch,
          velocity: [0, 40, 85, 120][level],
          duration: Math.max(
            1,
            Math.min(120, Math.round(duration / row.steps.length / 2)),
          ),
        };
        if (!hits.has(key) || hits.get(key).velocity < hit.velocity)
          hits.set(key, hit);
      });
    start += duration;
  }
  const sorted = [...hits.values()].sort((a, b) => a.tick - b.tick),
    events = [];
  const next = new Map();
  for (let i = sorted.length - 1; i >= 0; i--) {
    const h = sorted[i],
      end = Math.min(h.tick + h.duration, next.get(h.pitch) ?? Infinity);
    events.push(
      { tick: h.tick, order: 1, bytes: [153, h.pitch, h.velocity] },
      { tick: end, order: 0, bytes: [137, h.pitch, 0] },
    );
    next.set(h.pitch, h.tick);
  }
  const tracks = [track(conductor, start), track(events, start)];
  const header = [...text("MThd"), 0, 0, 0, 6, 0, 1, 0, 2, ...int(ppq, 2)];
  // Avoid spreading large tracks onto the JavaScript call stack.
  const result = new Uint8Array(
    header.length + tracks.reduce((s, t) => s + t.length, 0),
  );
  result.set(header);
  let offset = header.length;
  for (const bytes of tracks) {
    result.set(bytes, offset);
    offset += bytes.length;
  }
  return result;
}
