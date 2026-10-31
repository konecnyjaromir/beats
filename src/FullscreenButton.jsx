import { ActionLabel } from "./TransportIcon.jsx";
import { t } from "./i18n.js";
import React, { useEffect, useState } from "react";

const fullscreenElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement;

export function FullscreenButton({ onError }) {
  const [active, setActive] = useState(() => Boolean(fullscreenElement()));
  const [busy, setBusy] = useState(false);
  const supported = Boolean(
    (document.documentElement.requestFullscreen &&
      document.fullscreenEnabled) ||
    (document.documentElement.webkitRequestFullscreen &&
      document.webkitFullscreenEnabled),
  );

  useEffect(() => {
    const sync = () => setActive(Boolean(fullscreenElement()));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit.call(document);
      } else {
        const root = document.documentElement;
        const enter = root.requestFullscreen || root.webkitRequestFullscreen;
        await enter.call(root);
      }
      setActive(Boolean(fullscreenElement()));
    } catch {
      onError(t("Prohlížeč nepovolil změnu režimu celé obrazovky."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!supported || busy}
      aria-pressed={active}
      title={
        !supported
          ? t("Tento prohlížeč nepodporuje celou obrazovku.")
          : active
            ? t("Ukončit celou obrazovku (Esc)")
            : t("Na celou obrazovku")
      }
    >
      <ActionLabel icon="fullscreen">
        {active ? t("⛶ Zpět do okna") : t("⛶ Na celou obrazovku")}
      </ActionLabel>
    </button>
  );
}
