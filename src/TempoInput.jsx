import React, { useEffect, useState } from "react";

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
  );
}
