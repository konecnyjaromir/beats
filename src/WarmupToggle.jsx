import React, { useId, useRef } from "react";
import { t } from "./i18n.js";

export function WarmupToggle({ checked, disabled, onChange }) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  return (
    <>
      <label className="adapter-warmup">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-haspopup="dialog"
          onChange={(event) => {
            if (event.target.checked) dialog.current.showModal();
            else onChange(false);
          }}
        />
        {t("Zahřátí USB adaptéru")}
      </label>
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
