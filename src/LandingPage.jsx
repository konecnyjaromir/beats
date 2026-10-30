import React, { useRef } from "react";
import { t, language } from "./i18n.js";
import { limits } from "./auth.js";
import "./landing.css";

export function LandingPage({ children }) {
  const preview = useRef(null);
  const screenshot = `./images/studio-${language}.png`;
  return (
    <div className="landing">
      <header className="landing-header">
        <a className="landing-logo" href="#top" aria-label="BEATS">
          <span className="landing-logo-mark" aria-hidden="true">
            ▥
          </span>
          BEATS<span className="landing-logo-dot">.</span>
        </a>
        <nav aria-label={t("Úvodní stránka")}>
          <a className="landing-tour-link" href="#how-it-works">
            {t("Jak to funguje")}
          </a>
          <a className="landing-nav-cta" href="#start">
            {t("Otevřít studio")} <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main className="landing-main" id="top">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-copy">
            <div className="landing-kicker">
              <span />
              {t("BICÍ STUDIO V PROHLÍŽEČI")}
            </div>
            <h1 id="landing-title">
              {t("Tvůj rytmus.")}
              <br />
              <em>{t("Tvoje pravidla.")}</em>
            </h1>
            <p className="landing-intro">
              {t(
                "Od jednoduchého beatu po vlastní aranžmá. Poskládej bicí smyčku, dolaď každý úder a hraj pořád dokola.",
              )}
            </p>
            <div className="landing-signin" id="start">
              {children}
              <p className="landing-signin-note">
                {t(
                  "Stačí Google účet. Tvoje smyčky zůstanou ve tvé vlastní knihovně.",
                )}
              </p>
            </div>
            <div className="landing-reassurance">
              <span aria-hidden="true">✓</span>
              {t("Bez instalace. Přímo v prohlížeči.")}
            </div>
          </div>

          <figure className="landing-preview">
            <div className="landing-preview-top">
              <span>
                <i />
                BEATS / {t("TVŮJ PROSTOR PRO RYTMUS")}
              </span>
              <span className="landing-preview-dots" aria-hidden="true">
                •••
              </span>
            </div>
            <button
              className="landing-screenshot"
              onClick={() => preview.current.showModal()}
              aria-label={t("Zvětšit screenshot studia")}
            >
              <img
                src={screenshot}
                alt={t(
                  "Editor BEATS se čtyřmi takty, kopákem, virblem, hi-hat a ráfkem. Zelená políčka znázorňují údery různé síly.",
                )}
                fetchPriority="high"
              />
              <span className="landing-zoom">
                <span aria-hidden="true">⤢</span>
                {t("Prohlédnout zblízka")}
              </span>
            </button>
            <figcaption>
              <span>
                {t("Skutečný editor. Ukázková smyčka Pocket groove.")}
              </span>
              <span aria-hidden="true">96 BPM · 4/4</span>
            </figcaption>
          </figure>
        </section>

        <section className="landing-highlights" aria-label={t("Co studio umí")}>
          <div>
            <strong>18</strong>
            <span>{t("bicích a perkusí")}</span>
          </div>
          <div>
            <strong>3</strong>
            <span>{t("síly každého úderu")}</span>
          </div>
          <div>
            <strong>30–300</strong>
            <span>{t("BPM pro tvoje tempo")}</span>
          </div>
          <div>
            <strong>JSON / ZIP</strong>
            <span>{t("tvoje smyčky s tebou")}</span>
          </div>
        </section>

        <section
          className="landing-workflow"
          id="how-it-works"
          aria-labelledby="workflow-title"
        >
          <div className="landing-section-heading">
            <span className="landing-kicker">{t("Z NÁPADU DO SMYČKY")}</span>
            <h2 id="workflow-title">{t("Klikni. Poslouchej. Dolaď.")}</h2>
            <p>
              {t(
                "Přehledná mřížka místo složitého nastavování. Každý řádek je nástroj, každé políčko místo pro úder.",
              )}
            </p>
          </div>
          <div className="landing-features">
            <article>
              <span className="landing-feature-number">01 / {t("RYTMUS")}</span>
              <div className="landing-mini-grid" aria-hidden="true">
                {[3, 0, 1, 0, 3, 0, 2, 0, 0, 0, 3, 1, 0, 0, 3, 0].map(
                  (level, i) => (
                    <i key={i} className={`demo-level-${level}`} />
                  ),
                )}
              </div>
              <h3>{t("Naklikej svůj groove")}</h3>
              <p>
                {t(
                  "Vyber nástroje a rozmísti údery. Jemné ghost notes, běžné údery i silné akcenty mají vlastní zvukové samply.",
                )}
              </p>
            </article>
            <article>
              <span className="landing-feature-number">
                02 / {t("ARANŽMÁ")}
              </span>
              <div className="landing-mini-bars" aria-hidden="true">
                <span>
                  01 <b>4/4</b>
                </span>
                <span>
                  02 <b>7/8</b>
                </span>
                <span>
                  03 <b>4/4</b>
                </span>
                <span>＋</span>
              </div>
              <h3>{t("Dej každému taktu prostor")}</h3>
              <p>
                {t(
                  "Přidávej a duplikuj takty. Měň jejich taktové označení i dělení jednotlivých řádků a sleduj rytmus při přehrávání.",
                )}
              </p>
            </article>
            <article>
              <span className="landing-feature-number">
                03 / {t("KNIHOVNA")}
              </span>
              <div className="landing-mini-files" aria-hidden="true">
                <span>↳ groove.json</span>
                <span>↓ loops.zip</span>
              </div>
              <h3>{t("Vrať se ke svým nápadům")}</h3>
              <p>
                {t(
                  "Ulož si vlastní knihovnu. Exportuj jednu smyčku nebo všechny najednou a kdykoliv je importuj zpět.",
                )}
              </p>
            </article>
          </div>
        </section>

        <section className="landing-bottom-cta">
          <div>
            <h2>{t("Další groove je na tobě.")}</h2>
            <p>
              {t(
                "Pro tvoje nápady: {0} smyček a až {1} taktů v každé.",
                limits.maxLoops,
                limits.maxBars,
              )}
            </p>
          </div>
          <a href="#start">
            {t("Začít tvořit")} <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <span>BEATS · {t("Malé studio pro velké nápady.")}</span>
        <div>
          <a href="./privacy.html">{t("Ochrana osobních údajů")}</a>
          <span>v{__BEATS_VERSION__}</span>
        </div>
      </footer>
      <dialog
        className="landing-preview-dialog"
        ref={preview}
        aria-label={t("Náhled editoru BEATS")}
      >
        <form method="dialog">
          <span>{t("Náhled editoru BEATS")}</span>
          <button autoFocus>{t("Zavřít")} ×</button>
        </form>
        <img
          src={screenshot}
          alt={t("Screenshot editoru BEATS s ukázkovou smyčkou")}
        />
      </dialog>
    </div>
  );
}
