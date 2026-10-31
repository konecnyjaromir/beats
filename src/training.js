import { timelineFor } from "./model.js";

// Each entry is one complete loop; rounding the final step never overshoots.
export function trainingCycles(project, { start, end, repeats, step }) {
  const cycles = [];
  let at = 0;
  for (
    let bpm = start;
    ;
    bpm += Math.sign(end - start) * Math.min(step, Math.abs(end - bpm))
  ) {
    const timeline = timelineFor({ ...project, bpm });
    for (let repetition = 1; repetition <= repeats; repetition++) {
      cycles.push({ bpm, repetition, at, timeline });
      at += timeline.total;
    }
    if (bpm === end) break;
  }
  return { cycles, total: at };
}
