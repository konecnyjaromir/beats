import React, { useEffect, useId, useRef, useState } from "react";
import { t } from "./i18n.js";

const clamp = (number) => Math.max(30, Math.min(300, Math.round(number)));

function TempoStep({ direction, value, onCommit }) {
  const timer = useRef(null);
  const latest = useRef({ value, onCommit });
  latest.current = { value, onCommit };

  function stop() {
    clearTimeout(timer.current);
    timer.current = null;
  }

  function step() {
    const current = latest.current;
    const next = clamp(current.value + direction);
    if (next !== current.value) {
      latest.current = { ...current, value: next };
      current.onCommit(next);
    }
  }

  function start() {
    stop();
    step();
    timer.current = setTimeout(function repeat() {
      step();
      timer.current = setTimeout(repeat, 80);
    }, 400);
  }

  useEffect(() => {
    window.addEventListener("blur", stop);
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      stop();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  return (
    <button
      type="button"
      className="tempo-step"
      aria-label={direction < 0 ? t("Snížit tempo") : t("Zvýšit tempo")}
      aria-disabled={direction < 0 ? value <= 30 : value >= 300}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onBlur={stop}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          if (!event.repeat) start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          stop();
        }
      }}
      onClick={(event) => {
        if (event.detail === 0) step();
      }}
    >
      {direction < 0 ? "−" : "+"}
    </button>
  );
}

export function TempoInput({ value, onCommit, children }) {
  const [draft, setDraft] = useState(String(value));
  const taps = useRef([]);
  function tapTempo() {
    const now = performance.now();
    const times = taps.current;
    if (times.length && now - times.at(-1) > 2500) times.length = 0;
    times.push(now);
    if (times.length > 5) times.shift();
    if (times.length < 2) return;
    const bpm = clamp((60000 * (times.length - 1)) / (now - times[0]));
    if (bpm !== value) onCommit(bpm);
  }
  const dialog = useRef(null);
  const titleId = useId();
  const inputId = useId();
  const sliderValue =
    draft.trim() && Number.isFinite(Number(draft))
      ? clamp(Number(draft))
      : value;

  return (
    <>
      <div className="tempo-input">
        <button
          type="button"
          className="tempo-tap"
          title={t("Vyťukej tempo")}
          aria-label={t("TAP – vyťukej tempo")}
          onBlur={() => { taps.current = []; }}
          onKeyDown={(event) => {
            if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault();
          }}
          onClick={tapTempo}
        >
          TAP
        </button>
        <TempoStep direction={-1} value={value} onCommit={onCommit} />
        <button
          id="bpm"
          type="button"
          className="tempo-trigger"
          aria-label={t("Tempo {0} BPM. Změnit tempo", value)}
          aria-haspopup="dialog"
          onClick={() => {
            setDraft(String(value));
            dialog.current.showModal();
          }}
        >
          {value} <span>BPM</span>
        </button>
        <TempoStep direction={1} value={value} onCommit={onCommit} />
        {children}
      </div>
      <dialog
        ref={dialog}
        className="division-dialog tempo-dialog"
        aria-labelledby={titleId}
      >
        <form
          method="dialog"
          onSubmit={() => {
            if (sliderValue !== value) onCommit(sliderValue);
          }}
        >
          <h3 id={titleId}>{t("Nastavení tempa")}</h3>
          <p>{t("Zvol tempo od 30 do 300 BPM.")}</p>
          <label className="tempo-dialog-value" htmlFor={inputId}>
            <input
              autoFocus
              id={inputId}
              type="number"
              inputMode="numeric"
              min={30}
              max={300}
              step={1}
              required
              value={draft}
              aria-label={t("Tempo v BPM")}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => setDraft(String(sliderValue))}
            />
            BPM
          </label>
          <input
            className="tempo-slider division-slider"
            type="range"
            min={30}
            max={300}
            step={1}
            value={sliderValue}
            aria-label={t("Tempo v BPM")}
            aria-valuetext={`${sliderValue} BPM`}
            style={{
              "--tempo-progress": `${((sliderValue - 30) / 270) * 100}%`,
            }}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="division-limits">
            <span>30 BPM</span>
            <span>300 BPM</span>
          </div>
          <div className="division-buttons">
            <button type="button" onClick={() => dialog.current.close()}>
              {t("Zrušit")}
            </button>
            <button type="submit">{t("Použít tempo")}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
