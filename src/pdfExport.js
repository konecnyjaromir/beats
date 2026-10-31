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
  Annotation,
} from "vexflow";
import { jsPDF } from "jspdf";
import "svg2pdf.js";
import { instruments } from "./model.js";
import { notationTiming, notationVoices, drumNotation } from "./notation.js";
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
      const groups = notationVoices(bar.rows);
      host.replaceChildren();
      const voices = [],
        notations = [];
      let above = 0,
        below = 0;
      const lanes = { 1: 0, "-1": 0 };
      // A wholly silent bar still gets a visible rest voice.
      if (!groups.length) groups.push({ stem: 1, steps: [[]] });
      for (const group of groups) {
        const lane = lanes[group.stem]++;
        const timing = notationTiming(n, d, group.steps.length);
        const notes = group.steps.map((hits) => {
          const note = new StaveNote({
            keys: hits.length
              ? hits.map((hit) => hit.key)
              : [group.stem === 1 ? "g/5" : "d/4"],
            duration: String(timing.base) + (hits.length ? "" : "r"),
            clef: "percussion",
            stem_direction: group.stem,
          });
          note.setStemLength(35 + lane * 28);
          hits.forEach((hit, keyIndex) => {
            if (hit.level === 1) {
              note.addModifier(new Parenthesis(1), keyIndex);
              note.addModifier(new Parenthesis(2), keyIndex);
            }
            if (hit.open)
              note.addModifier(
                new Articulation("a@a").setPosition(3),
                keyIndex,
              );
            if (hit.edge || hit.bell)
              note.addModifier(
                new Annotation(hit.edge ? "E" : "B")
                  .setFont("Arial", 9)
                  .setVerticalJustification(1),
                keyIndex,
              );
          });
          if (hits.some((hit) => hit.level === 3))
            note.addModifier(
              new Articulation("a>").setPosition(group.stem === 1 ? 3 : 4),
              0,
            );
          return note;
        });
        const tuplets = [];
        if (timing.count !== timing.occupied) {
          const offset = group.stem === 1 ? above++ : below++;
          for (let i = 0; i < notes.length; i += timing.count)
            tuplets.push(
              new Tuplet(notes.slice(i, i + timing.count), {
                num_notes: timing.count,
                notes_occupied: timing.occupied,
                ratioed: timing.occupied !== 2,
                bracketed: true,
                location: group.stem,
                y_offset: group.stem * -offset * 20,
              }),
            );
        }
        voices.push(
          new Voice({ num_beats: n, beat_value: d })
            .setMode(Voice.Mode.SOFT)
            .addTickables(notes),
        );
        notations.push({ notes, tuplets, stem: group.stem });
      }
      const formatter = new Formatter().joinVoices(voices);
      const width = Math.max(
        1100,
        formatter.preCalculateMinTotalWidth(voices) + 220,
      );
      const svgHeight = 260 + Math.max(above, below) * 22;
      const renderer = new Renderer(host, Renderer.Backends.SVG);
      renderer.resize(width, svgHeight);
      const context = renderer.getContext();
      const stave = new Stave(10, 80 + above * 18, width - 20)
        .addClef("percussion")
        .addTimeSignature(`${n}/${d}`)
        .setContext(context)
        .draw();
      formatter.format(voices, width - 190);
      voices.forEach((voice, i) => {
        const beams = Beam.generateBeams(notations[i].notes, {
          stem_direction: notations[i].stem,
        });
        voice.draw(context, stave);
        beams.forEach((beam) => beam.setContext(context).draw());
        notations[i].tuplets.forEach((tuplet) =>
          tuplet.setContext(context).draw(),
        );
      });
      const height = (svgHeight * 740) / width;
      if (y + height + 24 > 550) newPage();
      pdf.setFontSize(10);
      pdf.text(`${t("Takt")} ${index + 1} · ${n}/${d}`, 36, y);
      y += 6;
      await pdf.svg(host.querySelector("svg"), {
        x: 36,
        y,
        width: 740,
        height,
      });
      y += height + 18;
      progress(index + 1, project.bars.length);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    newPage();
    pdf.setFontSize(12);
    pdf.text(t("Legenda nástrojů"), 36, y);
    y += 20;
    const used = instruments.filter((inst) =>
      project.bars.some((bar) =>
        bar.rows.some(
          (row) =>
            !row.muted && row.instrument === inst.id && row.steps.some(Boolean),
        ),
      ),
    );
    for (let first = 0; first < used.length; first += 6) {
      const group = used.slice(first, first + 6);
      if (y + 130 > 550) newPage();
      host.replaceChildren();
      const renderer = new Renderer(host, Renderer.Backends.SVG);
      renderer.resize(1100, 150);
      const context = renderer.getContext();
      for (let i = 0; i < group.length; i++) {
        const symbol = drumNotation[group[i].id];
        const stave = new Stave(i * 180, 30, 160)
          .addClef("percussion")
          .setContext(context)
          .draw();
        const note = new StaveNote({
          keys: [symbol.key],
          duration: "4",
          clef: "percussion",
          stem_direction: symbol.stem,
        });
        if (symbol.open)
          note.addModifier(new Articulation("a@a").setPosition(3), 0);
        if (symbol.edge || symbol.bell)
          note.addModifier(
            new Annotation(symbol.edge ? "E" : "B")
              .setFont("Arial", 9)
              .setVerticalJustification(1),
            0,
          );
        Formatter.FormatAndDraw(context, stave, [note]);
        pdf.setFontSize(8);
        pdf.text(
          pdf.splitTextToSize(group[i].name, 110),
          36 + (i * 180 * 740) / 1100,
          y + 108,
        );
      }
      await pdf.svg(host.querySelector("svg"), {
        x: 36,
        y,
        width: 740,
        height: (150 * 740) / 1100,
      });
      y += 140;
    }
    return pdf.output("arraybuffer");
  } finally {
    host.remove();
  }
}
