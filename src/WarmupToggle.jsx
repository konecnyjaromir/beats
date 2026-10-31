import React, { useId, useRef } from "react";
import { t } from "./i18n.js";
import { TransportIcon } from "./TransportIcon.jsx";

export function WarmupToggle({ checked, disabled, onChange }) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  return (
    <>
      <button
        type="button"
        className="transport-button transport-toggle"
        aria-pressed={checked}
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => {
          if (!checked) dialog.current.showModal();
          else onChange(false);
        }}
      >
        <TransportIcon name="warmup" />
        <span>{t("Zahřátí USB adaptéru")}</span>
        <span className="transport-state" aria-hidden="true">
          {checked ? "✓" : ""}
        </span>
      </button>
      <dialog
        ref={dialog}
        className="division-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form method="dialog" onSubmit={() => onChange(true)}>
          <h3 id={titleId}>{t("Zahřátí USB adaptéru")}</h3>
          <p id={descriptionId}>
            {t(
              "Warm-up přehraje slabý úder do ráfku pro probuzení zvukového adaptéru. Za 500 ms začne smyčka. Zapni, pokud ve sluchátkách přes adaptér chybí první úder. Opakování smyčky je bez zahřívacího úderu a prodlevy.",
            )}
          </p>
          <div className="division-buttons">
            <button
              type="button"
              autoFocus
              onClick={() => dialog.current.close()}
            >
              {t("Storno")}
            </button>
            <button type="submit">OK</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
