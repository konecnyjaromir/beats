import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Tuplet,
  Beam,
  Parenthesis,
  Articulation,
} from "vexflow";
import { jsPDF } from "jspdf";
import "svg2pdf.js";
import { instruments } from "./model.js";
import { notationTiming } from "./notation.js";
import { t } from "./i18n.js";

export async function pdfBytes(project, progress = () => {}) {
  const response = await fetch(
    new URL("fonts/NotoSans-Regular.ttf", document.baseURI),
  );
  if (!response.ok) throw Error(t("Nepodařilo se načíst písmo pro PDF."));
  const font = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let i = 0; i < font.length; i += 8192)
    binary += String.fromCharCode(...font.subarray(i, i + 8192));
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  pdf.addFileToVFS("NotoSans.ttf", btoa(binary));
  pdf.addFont("NotoSans.ttf", "NotoSans", "normal");
  pdf.setFont("NotoSans");
  pdf.setProperties({ title: project.name, creator: "BEATS" });
  let y = 0,
    page = 0;
  function newPage() {
    if (page++) pdf.addPage();
    pdf.setFontSize(16);
    const title = pdf.splitTextToSize(project.name, 740);
    pdf.text(title, 36, 34);
    y = 42 + title.length * 19;
    pdf.setFontSize(9);
    pdf.text(
      `${project.bpm} BPM · ${t("Čtvrťová nota")} · ${t("( ) slabý úder · > silný úder · ztlumené řádky vynechány")}`,
      36,
      y,
    );
    y += 26;
    pdf.text(`BEATS · ${page}`, 750, 575);
  }
  newPage();
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;background:white";
  document.body.append(host);
  try {
    for (let index = 0; index < project.bars.length; index++) {
      const bar = project.bars[index],
        n = bar.numerator ?? project.numerator,
        d = bar.denominator ?? project.denominator;
      const rows = bar.rows.filter((r) => !r.muted);
      if (!rows.length) {
        if (y > 490) newPage();
        pdf.text(
          `${t("Takt")} ${index + 1} · ${n}/${d} · ${t("Ticho")}`,
          36,
          y,
        );
        y += 35;
      }
      for (let first = 0; first < rows.length; first += 4) {
        const group = rows.slice(first, first + 4);
        if (y + group.length * 102 + 30 > 550) newPage();
        pdf.setFontSize(10);
        pdf.text(
          `${t("Takt")} ${index + 1} · ${n}/${d}${first ? " · " + t("pokračování") : ""}`,
          36,
          y,
        );
        y += 8;
        host.replaceChildren();
        const voices = [],
          notations = [];
        for (const row of group) {
          const timing = notationTiming(n, d, row.steps.length);
          const notes = row.steps.map((level) => {
            const cross = /hat|ride|crash|splash|Hat|Bell/.test(row.instrument);
            const note = new StaveNote({
              keys: [level ? (cross ? "b/4/x2" : "b/4") : "b/4"],
              duration: String(timing.base) + (level ? "" : "r"),
              clef: "percussion",
            });
            if (level === 1) Parenthesis.buildAndAttach([note]);
            if (level === 3)
              note.addModifier(new Articulation("a>").setPosition(3), 0);
            return note;
          });
          const tuplets = [];
          if (timing.count !== timing.occupied)
            for (let i = 0; i < notes.length; i += timing.count)
              tuplets.push(
                new Tuplet(notes.slice(i, i + timing.count), {
                  num_notes: timing.count,
                  notes_occupied: timing.occupied,
                  ratioed: timing.occupied !== 2,
                  bracketed: true,
                }),
              );
          const voice = new Voice({ num_beats: n, beat_value: d })
            .setMode(Voice.Mode.SOFT)
            .addTickables(notes);
          voices.push(voice);
          notations.push({ notes, tuplets });
        }
        const formatter = new Formatter();
        voices.forEach((v) => formatter.joinVoices([v]));
        const width = Math.max(
          1100,
          formatter.preCalculateMinTotalWidth(voices) + 180,
        );
        const renderer = new Renderer(host, Renderer.Backends.SVG);
        renderer.resize(width, group.length * 150);
        const context = renderer.getContext();
        const staves = group.map((row, i) =>
          new Stave(10, i * 150 + 25, width - 20, { num_lines: 5 })
            .addClef("percussion")
            .setContext(context)
            .draw(),
        );
        formatter.format(voices, width - 140);
        voices.forEach((voice, i) => {
          const beams = Beam.generateBeams(notations[i].notes);
          voice.draw(context, staves[i]);
          beams.forEach((b) => b.setContext(context).draw());
          notations[i].tuplets.forEach((tuplet) =>
            tuplet.setContext(context).draw(),
          );
        });
        const svg = host.querySelector("svg");
        const scale = 740 / width,
          height = group.length * 150 * scale;
        group.forEach((row, i) => {
          pdf.setFontSize(9);
          pdf.text(
            instruments.find((inst) => inst.id === row.instrument)?.name ??
              row.instrument,
            36,
            y + i * 150 * scale + 7,
          );
        });
        await pdf.svg(svg, { x: 36, y: y + 8, width: 740, height });
        y += height + 25;
      }
      progress(index + 1, project.bars.length);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return pdf.output("arraybuffer");
  } finally {
    host.remove();
  }
}
