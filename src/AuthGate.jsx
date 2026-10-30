import React, { useEffect, useRef, useState } from "react";
import { t, language } from "./i18n.js";
import { appConfig, authRequest, limits } from "./auth.js";

let googleScript;
function loadGoogle() {
  return (googleScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      googleScript = null;
      reject(Error(t("Přihlášení Google se nepodařilo načíst.")));
    };
    document.head.append(script);
  }));
}
export function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const button = useRef(null);
  const googleMode = appConfig.authMode === "google";
  useEffect(() => {
    if (!googleMode) return;
    let cancelled = false;
    setError("");
    authRequest()
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [googleMode, retry]);
  useEffect(() => {
    if (!googleMode || !session || session.user) return;
    let cancelled = false;
    loadGoogle()
      .then(() => {
        if (cancelled || !button.current) return;
        google.accounts.id.initialize({
          client_id: appConfig.googleClientId,
          nonce: session.nonce,
          auto_select: false,
          callback: async ({ credential }) => {
            if (cancelled) return;
            setBusy(true);
            setError("");
            try {
              const result = await authRequest({ credential });
              if (!cancelled) setSession(result);
            } catch (e) {
              if (!cancelled) setError(e.message);
            } finally {
              if (!cancelled) setBusy(false);
            }
          },
        });
        button.current.replaceChildren();
        google.accounts.id.renderButton(button.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          locale: language,
          width: 280,
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [googleMode, session, retry]);
  if (!googleMode) return children(null, null);
  async function logout() {
    await authRequest({ action: "logout" });
    globalThis.google?.accounts.id.disableAutoSelect();
    setSession(await authRequest());
  }
  if (session?.user) return children(session.user, logout);
  return (
    <main className="login-screen">
      <section className="login-card">
        <h1>
          BEATS<span className="brand-dot">●</span>
        </h1>
        <h2>{t("Přihlášení do studia")}</h2>
        <p>
          {t(
            "Přihlas se přes Google. Při prvním přihlášení se vytvoří účet. Tvé smyčky uvidíš jen ty.",
          )}
        </p>
        <div ref={button} className="google-signin" aria-busy={busy} />
        {(!session || busy) && !error && <p role="status">{t("Načítání…")}</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button onClick={() => setRetry((n) => n + 1)}>
              {t("Zkusit znovu")}
            </button>
          </div>
        )}
        <p className="login-limits">
          {t(
            "Limit účtu: {0} smyček, až {1} taktů na smyčku.",
            limits.maxLoops,
            limits.maxBars,
          )}
        </p>
        <a href="./privacy.html">{t("Ochrana osobních údajů")}</a>
        <p className="app-version">v{__BEATS_VERSION__}</p>
      </section>
    </main>
  );
}
