import React, { useId, useRef } from "react";
import { instruments } from "./model.js";
import { t } from "./i18n.js";

export function DrumIcon({ instrument }) {
  const cymbal = [
    "hat",
    "openhat",
    "pedalHat",
    "crash",
    "ride",
    "rideBell",
    "splash",
  ].includes(instrument);
  const tag = {
    hat: "×",
    openhat: "○",
    pedalHat: "P",
    crash: "C",
    ride: "R",
    rideBell: "B",
    splash: "S",
    tomHigh: "H",
    tomMid: "M",
    tomLow: "L",
    snare: "S",
    snareEdge: "E",
    rim: "R",
  }[instrument];
  return (
    <svg
      className="drum-icon"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {cymbal ? (
        <>
          <path d="M3 11q13-10 26 0-13 5-26 0ZM16 6v22m-7 2 7-5 7 5" />
          {instrument === "hat" && <path d="M3 15q13 5 26 0" />}
          {instrument === "openhat" && <path d="M3 20q13 5 26 0" />}
        </>
      ) : instrument === "kick" ? (
        <>
          <circle cx="15" cy="15" r="11" />
          <circle cx="15" cy="15" r="7" />
          <path d="m6 24-3 5m21-5 3 5m-12-9v9h5" />
        </>
      ) : instrument === "cowbell" ? (
        <path d="m11 4-7 23h24L21 4Zm-7 23q12-6 24 0M13 4V2h6v2" />
      ) : instrument === "maracas" ? (
        <>
          <ellipse cx="10" cy="9" rx="6" ry="8" transform="rotate(-25 10 9)" />
          <path d="m13 15 7 14m2-14-5 14" />
          <ellipse cx="23" cy="9" rx="5" ry="7" transform="rotate(25 23 9)" />
        </>
      ) : instrument === "tambourine" ? (
        <>
          <circle cx="16" cy="16" r="12" />
          <circle cx="16" cy="16" r="8" />
          {[4, 16, 28].map((x, i) => (
            <circle key={x} cx={x} cy={i === 1 ? 4 : 16} r="2" />
          ))}
        </>
      ) : instrument === "clap" ? (
        <>
          <path d="m5 19 8 10h7l7-12-3-2-5 7 2-13-3-1-3 12-1-15h-3l1 16-5-9-3 1Z" />
        </>
      ) : (
        <>
          <ellipse cx="16" cy="9" rx="12" ry="5" />
          <path d="M4 9v13c0 7 24 7 24 0V9M8 13v10m16-10v10" />
        </>
      )}
      {tag && (
        <>
          <rect
            x="20"
            y="18"
            width="12"
            height="14"
            rx="3"
            fill="#202328"
            stroke="none"
          />
          <text
            x="26"
            y="29"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="11"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            {tag}
          </text>
        </>
      )}
    </svg>
  );
}

export function InstrumentPicker({ value, row, compact, onChange }) {
  const dialog = useRef(null),
    title = useId();
  const selected = instruments.find((i) => i.id === value);
  return (
    <>
      <button
        className="instrument-picker"
        type="button"
        title={selected?.name}
        aria-label={t("Nástroj řádku {0}: {1}", row, selected?.name)}
        aria-haspopup="dialog"
        onClick={() => dialog.current.showModal()}
      >
        <DrumIcon instrument={value} />
        {!compact && <span>{selected?.name}</span>}
        <span className="instrument-chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      <dialog
        ref={dialog}
        className={`division-dialog instrument-dialog ${compact ? "instrument-dialog-compact" : ""}`}
        aria-labelledby={title}
      >
        <div className="instrument-dialog-heading">
          <h3 id={title}>{t("Nástroj řádku {0}", row)}</h3>
          <button
            type="button"
            aria-label={t("Zavřít")}
            onClick={() => dialog.current.close()}
          >
            ×
          </button>
        </div>
        <div className="instrument-options">
          {instruments.map((i) => (
            <button
              type="button"
              key={i.id}
              title={i.name}
              aria-label={i.name}
              aria-pressed={i.id === value}
              onClick={() => {
                onChange(i.id);
                dialog.current.close();
              }}
            >
              <DrumIcon instrument={i.id} />
              {!compact && <span>{i.name}</span>}
            </button>
          ))}
        </div>
      </dialog>
    </>
  );
}
