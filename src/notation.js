const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const drumNotation = {
  kick: { key: "f/4", stem: -1 },
  snare: { key: "c/5", stem: -1 },
  hat: { key: "g/5/x2", stem: 1 },
  openhat: { key: "g/5/x2", stem: 1, open: true },
  crash: { key: "a/5/x2", stem: 1 },
  ride: { key: "f/5/x2", stem: 1 },
  tomHigh: { key: "e/5", stem: -1 },
  tomMid: { key: "d/5", stem: -1 },
  tomLow: { key: "a/4", stem: -1 },
  rim: { key: "c/5/x2", stem: -1 },
  clap: { key: "b/4/x2", stem: -1 },
  tambourine: { key: "e/5/x2", stem: 1 },
  cowbell: { key: "d/5/x2", stem: 1 },
  maracas: { key: "g/4/x2", stem: -1 },
  pedalHat: { key: "d/4/x2", stem: -1 },
  snareEdge: { key: "c/5", stem: -1, edge: true },
  rideBell: { key: "f/5/x2", stem: 1, bell: true },
  splash: { key: "b/5/x2", stem: 1 },
};

// Rows on the same rhythmic grid and with the same stem direction become chords.
export function notationVoices(rows) {
  const groups = new Map();
  for (const row of rows.filter((r) => !r.muted && r.steps.some(Boolean))) {
    const symbol = drumNotation[row.instrument];
    const key = `${row.steps.length}:${symbol.stem}`;
    if (!groups.has(key))
      groups.set(key, {
        stem: symbol.stem,
        steps: Array.from({ length: row.steps.length }, () => []),
      });
    row.steps.forEach((level, index) => {
      if (!level) return;
      const hits = groups.get(key).steps[index];
      const existing = hits.find((hit) => hit.instrument === row.instrument);
      if (existing) existing.level = Math.max(existing.level, level);
      else hits.push({ instrument: row.instrument, level, ...symbol });
    });
  }
  return [...groups.values()];
}
// One grid slot has an exact rational duration, including arbitrary tuplets.
export function notationTiming(n, d, steps) {
  const base = Math.max(
    1,
    Math.min(64, 2 ** Math.floor(Math.log2((d * steps) / n))),
  );
  const divisor = gcd(d * steps, n * base);
  return { base, count: (d * steps) / divisor, occupied: (n * base) / divisor };
}
