import { t } from "./i18n.js";
export const instruments = [
  { id: "kick", name: t("Kopák"), note: 36 },
  { id: "snare", name: t("Virbl"), note: 38 },
  { id: "hat", name: t("Hi-hat zavřená"), note: 42 },
  { id: "openhat", name: t("Hi-hat otevřená"), note: 46 },
  { id: "crash", name: t("Crash činel"), note: 49 },
  { id: "ride", name: t("Ride činel"), note: 51 },
  { id: "tomHigh", name: t("Tom vysoký"), note: 45 },
  { id: "tomMid", name: t("Tom střední"), note: 47 },
  { id: "tomLow", name: t("Tom hluboký"), note: 41 },
  { id: "rim", name: t("Rim / ráfek"), note: 37 },
  { id: "clap", name: t("Tlesknutí / clap"), note: 39 },
  { id: "tambourine", name: t("Tamburína"), note: 54 },
  { id: "cowbell", name: t("Kravský zvonec"), note: 56 },
  { id: "maracas", name: t("Maracas / rumba koule"), note: 64 },
  { id: "pedalHat", name: t("Hi-hat pedálem"), note: 44 },
  { id: "snareEdge", name: t("Virbl – okraj"), note: 40 },
  { id: "rideBell", name: t("Ride – zvon"), note: 53 },
  { id: "splash", name: t("Splash činel"), note: 55 },
];
export const uid = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
export const row = (instrument = "kick", division = 16) => ({
  id: uid(),
  instrument,
  steps: Array(division).fill(0),
  muted: false,
});
export const bar = (numerator = 4, denominator = 4) => ({
  id: uid(),
  numerator,
  denominator,
  rows: [row("kick"), row("snare"), row("hat")],
});
export function initial() {
  const b = bar();
  return {
    name: t("Můj první groove"),
    bpm: 100,
    numerator: 4,
    denominator: 4,
    bars: [b],
  };
}
export const barDuration = (p) =>
  ((60 / p.bpm) * p.numerator * 4) / p.denominator;
export function normalizeProject(project) {
  return {
    ...project,
    bars: project.bars.map((b) => ({
      ...b,
      numerator: b.numerator ?? project.numerator ?? 4,
      denominator: b.denominator ?? project.denominator ?? 4,
    })),
  };
}
export function timelineFor(project) {
  let total = 0;
  const bars = normalizeProject(project).bars.map((b) => {
    const duration = barDuration({ ...b, bpm: project.bpm });
    const entry = { start: total, duration };
    total += duration;
    return entry;
  });
  return { bars, total };
}
export function positionAt(timeline, elapsed) {
  const time = Math.max(0, elapsed) % timeline.total;
  let index = timeline.bars.findIndex((b) => time < b.start + b.duration);
  if (index < 0) index = timeline.bars.length - 1;
  const entry = timeline.bars[index];
  return { bar: index, progress: (time - entry.start) / entry.duration };
}
export function eventsForBar(b, duration) {
  return b.rows
    .flatMap((r) =>
      r.muted
        ? []
        : r.steps.flatMap((level, i) =>
            level
              ? [
                  {
                    instrument: r.instrument,
                    level,
                    time: (i * duration) / r.steps.length,
                  },
                ]
              : [],
          ),
    )
    .sort((a, b) => a.time - b.time);
}
