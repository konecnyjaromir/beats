import React, { useEffect, useState } from "react";
import { t } from "./i18n.js";

export function TempoInput({ value, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const number = Number(draft);
    if (!draft.trim() || !Number.isFinite(number)) {
      setDraft(String(value));
      return;
    }
    const next = Math.max(30, Math.min(300, Math.round(number)));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return (
    <div className="tempo-input">
      <div className="tempo-value">
        <input
          id="bpm"
          type="number"
          inputMode="numeric"
          min={30}
          max={300}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setDraft(String(value));
            }
          }}
        />
        <span>BPM</span>
      </div>
      <input
        className="tempo-slider"
        type="range"
        min={30}
        max={300}
        step={1}
        value={value}
        aria-label={t("Tempo v BPM")}
        aria-valuetext={`${value} BPM`}
        style={{ "--tempo-progress": `${((value - 30) / 270) * 100}%` }}
        onChange={(event) => {
          const next = Number(event.target.value);
          setDraft(String(next));
          if (next !== value) onCommit(next);
        }}
      />
    </div>
  );
}
