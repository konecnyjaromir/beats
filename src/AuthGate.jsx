import React, { useEffect, useRef, useState } from "react";
import { t, language } from "./i18n.js";
import { appConfig, authRequest } from "./auth.js";
import { LandingPage } from "./LandingPage";
import { createDemo } from "./demo.js";

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
  const [demo, setDemo] = useState(null);
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
    if (!googleMode || !session || session.user || demo) return;
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
  }, [googleMode, session, retry, demo]);
  if (demo) return children(null, () => setDemo(null), demo);
  if (!googleMode) return children(null, null);
  async function logout(deleteAccount = false) {
    await authRequest(
      deleteAccount
        ? { action: "delete-account", confirm: true }
        : { action: "logout" },
    );
    globalThis.google?.accounts.id.disableAutoSelect();
    setSession(await authRequest());
  }
  if (session?.user) return children(session.user, logout);
  return (
    <LandingPage>
      <div ref={button} className="google-signin" aria-busy={busy} />
      <button
        className="landing-demo"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("./api/demo.php");
            if (!response.ok) throw Error(t("Demo se nepodařilo načíst."));
            setDemo(createDemo(await response.json()));
          } catch {
            setError(t("Demo se nepodařilo načíst."));
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("Vyzkoušet bez registrace")}
      </button>
      {(!session || busy) && !error && <p role="status">{t("Načítání…")}</p>}
      {error && (
        <div className="landing-login-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry((n) => n + 1)}>
            {t("Zkusit znovu")}
          </button>
        </div>
      )}
    </LandingPage>
  );
}
