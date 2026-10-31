import { ActionLabel } from "./TransportIcon.jsx";
import React, { useRef, useState, useId } from "react";
import { t } from "./i18n.js";
import { downloadFile, loopJson, loopFilename } from "./loopFiles.js";
import "./export.css";

export function ExportDialog({ project }) {
  const dialog = useRef(null),
    title = useId();
  const [format, setFormat] = useState("json"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState("");
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setProgress("");
    try {
      const snapshot = structuredClone(project),
        name = loopFilename(snapshot.name).replace(/\.json$/, "");
      if (format === "json")
        downloadFile(loopJson(snapshot), name + ".json", "application/json");
      if (format === "midi") {
        const { midiBytes } = await import("./midiExport.js");
        downloadFile(midiBytes(snapshot), name + ".mid", "audio/midi");
      }
      if (format === "pdf") {
        const { pdfBytes } = await import("./pdfExport.js");
        downloadFile(
          await pdfBytes(snapshot, (n, total) =>
            setProgress(`${n} / ${total}`),
          ),
          name + ".pdf",
          "application/pdf",
        );
      }
      dialog.current.close();
    } catch (err) {
      console.error(err);
      setError(t("Export se nepodařil. Zkus to znovu."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        title={t("Export")}
        onClick={() => {
          setError("");
          dialog.current.showModal();
        }}
      >
        <ActionLabel icon="export">{t("Export")}</ActionLabel>
      </button>
      <dialog
        className="division-dialog export-dialog"
        ref={dialog}
        aria-labelledby={title}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <form onSubmit={save}>
          <h3 id={title}>{t("Export smyčky")}</h3>
          <p>{project.name}</p>
          <fieldset disabled={busy}>
            <legend>{t("Formát souboru")}</legend>
            {[
              [
                "json",
                "JSON",
                t("Původní formát pro zálohu a opětovný import do BEATS."),
              ],
              [
                "midi",
                "MIDI",
                t(
                  "Pro hudební programy. General MIDI bicí, tempo a síla úderů.",
                ),
              ],
              [
                "pdf",
                "PDF",
                t(
                  "Bubenický zápis ve společné osnově včetně triol a dalších dělení.",
                ),
              ],
            ].map(([value, label, description]) => (
              <label className="export-option" key={value}>
                <input
                  type="radio"
                  name="export-format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="export-note">
            {t(
              "MIDI a PDF vynechávají ztlumené řádky. JSON uchová vše. MIDI neobsahuje zvukové samply.",
            )}
          </p>
          {error && <p role="alert">{error}</p>}
          <div role="status">
            {busy && `${t("Připravuji export…")} ${progress}`}
          </div>
          <div className="division-buttons">
            <button
              type="button"
              disabled={busy}
              onClick={() => dialog.current.close()}
            >
              {t("Zrušit")}
            </button>
            <button className="primary" disabled={busy} type="submit">
              {t("Stáhnout")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
