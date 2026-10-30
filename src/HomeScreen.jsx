import React from "react";
import { t } from "./i18n.js";

export function HomeScreen({
  loops,
  total,
  search,
  onSearch,
  onCreate,
  onOpen,
  loading,
}) {
  return (
    <section className="home-screen">
      <div className="eyebrow">{t("BICÍ STUDIO")}</div>
      <div className="home-welcome">
        <span className="home-symbol" aria-hidden="true">
          ▥
        </span>
        <h1>{t("Začni novou smyčkou")}</h1>
        <p>
          {t(
            "Vytvoř novou smyčku, nebo si níže otevři některou z uložených. Žádná smyčka teď není otevřená.",
          )}
        </p>
        <button className="primary" disabled={loading} onClick={onCreate}>
          {t("＋ Vytvořit smyčku")}
        </button>
      </div>
      <div className="home-library-heading">
        <h2>{t("Uložené smyčky")}</h2>
        <span>
          {loops.length} / {total}
        </span>
      </div>
      <div className="library-search home-search">
        <input
          type="search"
          aria-label={t("Hledat smyčku podle názvu")}
          placeholder={t("Hledat smyčku…")}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onSearch("");
          }}
        />
        {search && (
          <button
            aria-label={t("Vymazat hledání")}
            onClick={() => onSearch("")}
          >
            ×
          </button>
        )}
      </div>
      {loading && <p role="status">{t("Načítání…")}</p>}
      {!loading && !loops.length && (
        <p className="empty">
          {total
            ? t("Žádná smyčka neodpovídá hledání.")
            : t("Zatím tu nejsou žádné uložené smyčky. Vytvoř svou první.")}
        </p>
      )}
      <div className="home-loop-list">
        {loops.map((loop) => (
          <button
            className="home-loop"
            key={loop.id}
            disabled={loading}
            onClick={() => onOpen(loop.id)}
          >
            <strong>{loop.name}</strong>
            <span>
              {loop.bpm} BPM ·{" "}
              {loop.meters?.join(" → ") ||
                `${loop.numerator}/${loop.denominator}`}{" "}
              · {loop.barCount} {loop.barCount === 1 ? t("takt") : t("taktů")}
            </span>
            <span className="home-open">{t("Otevřít smyčku")} →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
