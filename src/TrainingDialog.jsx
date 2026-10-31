import React, { useId, useRef, useState } from "react";
import { t } from "./i18n.js";
import { TransportIcon } from "./TransportIcon.jsx";

export function TrainingDialog({ value, onChange, disabled }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [draft, setDraft] = useState(value);
  const fields = [
    ["start", t("Počáteční tempo"), 30, 300, " BPM"],
    ["end", t("Koncové tempo"), 30, 300, " BPM"],
    ["repeats", t("Opakování na jedno tempo"), 1, 5, ""],
    ["step", t("Krok tempa"), 1, 10, " BPM"],
  ];
  return (
    <>
      <button
        type="button"
        className="training-toggle"
        disabled={disabled}
        aria-label={t("Trénování")}
        title={t("Trénování")}
        aria-pressed={value.enabled}
        aria-haspopup="dialog"
        onClick={() => {
          setDraft(value);
          dialog.current.showModal();
        }}
      >
        <TransportIcon name="training" />
      </button>
      <dialog
        ref={dialog}
        className="division-dialog training-dialog"
        aria-labelledby={titleId}
      >
        <form
          method="dialog"
          onSubmit={() => onChange({ ...draft, enabled: true })}
        >
          <h3 id={titleId}>{t("Trénování")}</h3>
          <p>
            {t(
              "Tempo se mění po přehrání celé smyčky. Na koncovém tempu hraje dál, dokud přehrávání nezastavíš.",
            )}
          </p>
          {fields.map(([key, label, min, max, unit]) => (
            <label className="training-field" key={key}>
              <span>
                {label}
                <output>
                  {draft[key]}
                  {unit}
                </output>
              </span>
              <input
                type="range"
                className="tempo-slider"
                min={min}
                max={max}
                step={1}
                value={draft[key]}
                aria-label={label}
                aria-valuetext={`${draft[key]}${unit}`}
                style={{
                  "--tempo-progress": `${((draft[key] - min) / (max - min)) * 100}%`,
                }}
                onChange={(event) =>
                  setDraft({ ...draft, [key]: Number(event.target.value) })
                }
              />
              <span className="division-limits">
                <span>{min}</span>
                <span>{max}</span>
              </span>
            </label>
          ))}
          <div className="division-buttons training-buttons">
            {value.enabled && (
              <button
                type="button"
                onClick={() => {
                  onChange({ ...value, enabled: false });
                  dialog.current.close();
                }}
              >
                {t("Vypnout trénování")}
              </button>
            )}
            <button type="button" onClick={() => dialog.current.close()}>
              {t("Zrušit")}
            </button>
            <button type="submit">{t("Zapnout trénování")}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
