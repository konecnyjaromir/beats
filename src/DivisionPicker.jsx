import React, { useId, useRef, useState } from "react";
import { t } from "./i18n.js";

export function DivisionPicker({ value, row, onCommit }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [draft, setDraft] = useState(value);

  return (
    <>
      <button
        type="button"
        className="division"
        aria-label={t("Dělení řádku {0}: {1}. Změnit dělení", row, value)}
        aria-haspopup="dialog"
        onClick={() => {
          setDraft(value);
          dialog.current.showModal();
        }}
      >
        {value} <span aria-hidden="true">▾</span>
      </button>
      <dialog
        ref={dialog}
        className="division-dialog"
        aria-labelledby={titleId}
      >
        <form
          method="dialog"
          onSubmit={() => {
            if (draft !== value) onCommit(draft);
          }}
        >
          <h3 id={titleId}>{t("Dělení řádku {0}", row)}</h3>
          <p>{t("Počet stejných dílů celého taktu (1–64).")}</p>
          <output className="division-value">{draft}</output>
          <input
            autoFocus
            className="tempo-slider division-slider"
            type="range"
            min={1}
            max={64}
            step={1}
            value={draft}
            aria-label={t("Dělení řádku {0}", row)}
            style={{ "--tempo-progress": `${((draft - 1) / 63) * 100}%` }}
            onChange={(event) => setDraft(Number(event.target.value))}
          />
          <div className="division-limits">
            <span>1</span>
            <span>64</span>
          </div>
          <div className="division-buttons">
            <button type="button" onClick={() => dialog.current.close()}>
              {t("Zrušit")}
            </button>
            <button type="submit">{t("Použít dělení")}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
