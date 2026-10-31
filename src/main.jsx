import { InstrumentPicker } from "./InstrumentPicker.jsx";
import "./compact.css";
import { AdminPanel } from "./AdminPanel.jsx";
import { ExportDialog } from "./ExportDialog.jsx";
import { TransportIcon, ActionLabel } from "./TransportIcon.jsx";
import { t, language } from "./i18n.js";
import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  initial,
  bar,
  emptyBarLike,
  reorderBars,
  row,
  uid,
  instruments,
  normalizeProject,
} from "./model";
import { DrumEngine } from "./audio";
import { TempoInput } from "./TempoInput";
import { DivisionPicker } from "./DivisionPicker";
import { WarmupToggle } from "./WarmupToggle";
import { AuthGate } from "./AuthGate";
import { LoopName } from "./LoopName";
import { limits, requestHeaders } from "./auth.js";
import { readLoopFiles, zipLoops, downloadFile } from "./loopFiles.js";
import { FullscreenButton } from "./FullscreenButton";
import { HomeScreen } from "./HomeScreen";
import { copyName } from "./copyName";
import "./style.css";
const engine = new DrumEngine();
const removeAudioUnlock = engine.installEarlyUnlock();
if (import.meta.hot) import.meta.hot.dispose(removeAudioUnlock);
document.documentElement.lang = language;
document.title = t("BEATS — bicí studio");
async function serverApi(method = "GET", body, id) {
  const res = await fetch(
    `./api/loops.php${id ? "?id=" + encodeURIComponent(id) : ""}`,
    {
      method,
      credentials: "same-origin",
      headers: requestHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  let data;
  try {
    data = await res.json();
  } catch {
    throw Error(t("PHP server není dostupný. Spusťte backend podle README."));
  }
  if (!res.ok) throw Error(data.error || t("Chyba serveru."));
  return data;
}
function App({ user, onLogout, demo }) {
  const api = demo?.request || serverApi;
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem("beats-compact") === "true";
    } catch {
      return false;
    }
  });
  const compactButton = (
    <button
      className="compact-toggle"
      type="button"
      title={t("Kompaktní zobrazení")}
      aria-label={t("Kompaktní zobrazení")}
      aria-pressed={compact}
      onClick={() => {
        setCompact(!compact);
        if (!compact) setSidebarCollapsed(true);
        try {
          localStorage.setItem("beats-compact", String(!compact));
        } catch {}
      }}
    >
      <TransportIcon name="compact" />
    </button>
  );
  const [accountPage, setAccountPage] = useState(false);
  const [adminPage, setAdminPage] = useState(false);
  const [project, setProject] = useState(() =>
      demo ? normalizeProject(demo.first) : null,
    ),
    [selected, setSelected] = useState(0),
    [playing, setPlaying] = useState(false),
    [repeat, setRepeat] = useState(true),
    [playingBar, setPlayingBar] = useState(false),
    [loading, setLoading] = useState(false),
    [position, setPosition] = useState({ bar: 0, progress: 0 }),
    [library, setLibrary] = useState([]),
    [libraryLoading, setLibraryLoading] = useState(true),
    [savedId, setSavedId] = useState(demo?.first.id || null),
    [dirty, setDirty] = useState(false),
    [message, setMessage] = useState(""),
    [volume, setVolume] = useState(75),
    [confirm, setConfirm] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return (
        localStorage.getItem("beats-sidebar-collapsed") === "true" ||
        localStorage.getItem("beats-compact") === "true"
      );
    } catch {
      return false;
    }
  });
  const [search, setSearch] = useState("");
  const importInput = useRef(null);
  const draggedBar = useRef(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [transferBusy, setTransferBusy] = useState(false);
  const [adapterWarmup, setAdapterWarmup] = useState(() => {
    try {
      return localStorage.getItem("beats-adapter-warmup-v2") === "true";
    } catch {
      return false;
    }
  });
  const searchKey = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("cs")
      .trim();
  const filteredLibrary = library.filter((item) =>
    searchKey(item.name).includes(searchKey(search)),
  );
  function toggleSidebar() {
    const collapsed = !sidebarCollapsed;
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem("beats-sidebar-collapsed", String(collapsed));
    } catch {}
  }
  const projectRef = useRef(project);
  const navigationRef = useRef(0);
  const barTabsRef = useRef(null);
  projectRef.current = project;
  const current = project?.bars[Math.min(selected, project.bars.length - 1)];
  const live = playing && position.bar === selected;
  useEffect(() => {
    if (!playing) return;
    const tabs = barTabsRef.current;
    const active = tabs?.children[position.bar];
    if (!active) return;
    const viewport = tabs.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < viewport.left) tabs.scrollLeft += item.left - viewport.left;
    else if (item.right > viewport.right)
      tabs.scrollLeft += item.right - viewport.right;
  }, [playing, position.bar]);
  useEffect(() => {
    if (demo) window.scrollTo({ top: 0, behavior: "instant" });
    refresh();
    return () => engine.stop();
  }, []);
  useEffect(() => {
    const fn = (e) => {
      if (dirty || demo?.changed) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty, demo]);
  function stop() {
    engine.stop();
    setPlaying(false);
    setPosition({ bar: 0, progress: 0 });
  }
  function home() {
    setAccountPage(false);
    setAdminPage(false);
    navigationRef.current++;
    stop();
    setProject(null);
    setSavedId(null);
    setSelected(0);
    setDirty(false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function createLoop() {
    setAccountPage(false);
    setAdminPage(false);
    navigationRef.current++;
    stop();
    setProject({ ...initial(), name: t("Nová smyčka"), bars: [bar()] });
    setSavedId(null);
    setSelected(0);
    setDirty(true);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function edit(fn) {
    stop();
    setProject((p) => (typeof fn === "function" ? fn(p) : { ...p, ...fn }));
    setDirty(true);
  }
  function editBar(fn) {
    edit((p) => ({
      ...p,
      bars: p.bars.map((b, i) => (i === selected ? fn(b) : b)),
    }));
  }
  function moveBar(sourceId, targetId, after) {
    const selectedId = project.bars[selected].id;
    const bars = reorderBars(project.bars, sourceId, targetId, after);
    if (bars.every((b, i) => b === project.bars[i])) return;
    edit({ bars });
    setSelected(bars.findIndex((b) => b.id === selectedId));
  }
  function editRow(id, fn) {
    editBar((b) => ({
      ...b,
      rows: b.rows.map((r) => (r.id === id ? fn(r) : r)),
    }));
  }
  async function refresh() {
    setLibraryLoading(true);
    try {
      setLibrary(await api());
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLibraryLoading(false);
    }
  }
  async function importLoops(files) {
    if (!files.length) return;
    setTransferBusy(true);
    setMessage("");
    let imported = 0;
    try {
      const loops = await readLoopFiles(files, limits.maxLoops);
      const currentLibrary = await api();
      if (currentLibrary.length + loops.length > limits.maxLoops)
        throw Error(
          t("Import by překročil limit {0} smyček.", limits.maxLoops),
        );
      for (const loop of loops) {
        if (loop.bars.length > limits.maxBars)
          throw Error(t("Smyčka překračuje limit {0} taktů.", limits.maxBars));
      }
      for (const loop of loops) {
        await api("POST", loop);
        imported++;
      }
      setMessage(t("Importováno {0} smyček.", imported));
    } catch (e) {
      setMessage(t("Importováno {0} smyček. {1}", imported, e.message));
    } finally {
      await refresh();
      setTransferBusy(false);
    }
  }
  async function exportAll() {
    setTransferBusy(true);
    setMessage("");
    try {
      const list = await api();
      const loops = [];
      for (const entry of list)
        loops.push(await api("GET", undefined, entry.id));
      downloadFile(await zipLoops(loops), "beats-loops.zip", "application/zip");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setTransferBusy(false);
    }
  }
  async function play(onlyBar = false) {
    if (!project) return;
    const navigation = navigationRef.current;
    if (playing) {
      stop();
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await engine.prepare();
      if (navigation !== navigationRef.current) return;
      engine.start(
        onlyBar ? { ...project, bars: [project.bars[selected]] } : project,
        (nextPosition) => {
          const bar = onlyBar ? selected : nextPosition.bar;
          setPosition({ ...nextPosition, bar });
          setSelected(bar);
        },
        {
          warmup: adapterWarmup,
          repeat: !onlyBar && repeat,
          onEnded: () => {
            setPlaying(false);
            setPosition({ bar: onlyBar ? selected : 0, progress: 0 });
          },
        },
      );
      setPlayingBar(onlyBar);
      setPlaying(true);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function preview(r) {
    const navigation = navigationRef.current;
    try {
      await engine.prepare();
      if (navigation !== navigationRef.current) return;
      engine.hit(r.instrument, 3);
    } catch (e) {
      setMessage(e.message);
    }
  }
  async function save(copy = false) {
    const navigation = navigationRef.current;
    const snapshot = project;
    setLoading(true);
    try {
      const result = await api("POST", {
        ...project,
        name: copy
          ? copyName(
              project.name,
              library.map((item) => item.name),
              t("kopie"),
            )
          : project.name,
        ...(!copy && savedId ? { id: savedId } : {}),
      });
      if (navigation === navigationRef.current) {
        setSavedId(result.id);
        setDirty(projectRef.current !== snapshot);
        if (copy) {
          setProject((currentProject) =>
            currentProject?.name === snapshot.name
              ? { ...currentProject, name: result.name }
              : currentProject,
          );
        }
        setMessage(t("Smyčka je uložená."));
      }
      await refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }
  function guard(action) {
    if (dirty)
      setConfirm({
        text: t("Opustit rozpracovanou smyčku? Neuložené změny se ztratí."),
        action,
      });
    else action();
  }
  async function load(id) {
    setAccountPage(false);
    setAdminPage(false);
    const navigation = ++navigationRef.current;
    setLoading(true);
    stop();
    try {
      const data = await api("GET", null, id);
      if (navigation !== navigationRef.current) return;
      stop();
      const { id: loadedId, updatedAt, ...p } = data;
      setProject(normalizeProject(p));
      setSavedId(loadedId);
      setSelected(0);
      setDirty(false);
      setMessage("");
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className={
        "app" +
        (compact ? " compact" : "") +
        (sidebarCollapsed ? " sidebar-collapsed" : "")
      }
    >
      <aside>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? t("Rozbalit menu") : t("Sbalit menu")}
          title={sidebarCollapsed ? t("Rozbalit menu") : t("Sbalit menu")}
        >
          {sidebarCollapsed ? "☰" : t("‹ Sbalit menu")}
        </button>
        <a
          className="brand"
          href="./"
          aria-label={t("BEATS – úvodní obrazovka")}
          onClick={(e) => {
            e.preventDefault();
            guard(home);
          }}
        >
          <span className="brand-icon">▥</span> BEATS
          <span className="brand-dot">●</span>
        </a>
        <div className="side-caption">{t("TVŮJ RYTMUS. TVŮJ PROSTOR.")}</div>
        <button className="new" onClick={() => guard(createLoop)}>
          {" "}
          {t("＋ Nová smyčka")}{" "}
        </button>
        <div className="library-heading">
          {" "}
          {t("MOJE SMYČKY")}{" "}
          <span>
            {search.trim()
              ? `${filteredLibrary.length} / ${library.length}`
              : library.length}
          </span>
        </div>
        <div className="library-search">
          <input
            type="search"
            aria-label={t("Hledat smyčku podle názvu")}
            placeholder={t("Hledat smyčku…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
          />
          {search && (
            <button
              aria-label={t("Vymazat hledání")}
              title={t("Vymazat hledání")}
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>
        <div className="library">
          {library.length === 0 ? (
            <p className="empty">
              {" "}
              {t("Tady budou tvoje uložené nápady.")} <br />{" "}
              {t("Vytvoř první rytmus.")}{" "}
            </p>
          ) : filteredLibrary.length === 0 ? (
            <p className="empty" role="status">
              {" "}
              {t("Žádná smyčka neodpovídá hledání.")}{" "}
            </p>
          ) : (
            filteredLibrary.map((item) => (
              <div
                className={
                  "library-item " + (item.id === savedId ? "chosen" : "")
                }
                key={item.id}
              >
                <button onClick={() => guard(() => load(item.id))}>
                  <strong>{item.name}</strong>
                  <small>
                    {item.bpm} BPM ·{" "}
                    {item.meters?.join(" → ") ||
                      `${item.numerator}/${item.denominator}`}{" "}
                    · {item.barCount} {t("taktů")}{" "}
                  </small>
                </button>
                <button
                  aria-label={t("Smazat ") + item.name}
                  className="delete"
                  onClick={() =>
                    setConfirm({
                      text: t("Opravdu smazat „{0}“?", item.name),
                      action: async () => {
                        try {
                          await api("DELETE", null, item.id);
                          if (savedId === item.id) {
                            setSavedId(null);
                            setDirty(true);
                          }
                          await refresh();
                        } catch (e) {
                          setMessage(e.message);
                        }
                      },
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        <div className="side-bottom">
          <div className="library-transfer">
            <input
              ref={importInput}
              type="file"
              accept=".json,.zip,application/json,application/zip"
              multiple
              hidden
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                importLoops(files);
              }}
            />
            <button
              disabled={transferBusy || loading}
              onClick={() => importInput.current.click()}
            >
              {t("Import JSON / ZIP")}
            </button>
            <button
              disabled={transferBusy || loading || !library.length}
              onClick={exportAll}
            >
              {t("Export všeho do ZIP")}
            </button>
            {transferBusy && (
              <span role="status">{t("Zpracovávám soubory…")}</span>
            )}
          </div>
          <span className="status-dot" /> {t("AKUSTICKÁ SADA")}{" "}
          <p>
            AVL Black Pearl · {instruments.length} {t("nástrojů")} <br />{" "}
            {t("Tři dynamické vrstvy")}{" "}
          </p>
        </div>
        {user?.isAdmin && !demo && (
          <button
            className="account-menu-link"
            disabled={loading || transferBusy}
            aria-current={adminPage ? "page" : undefined}
            onClick={() => {
              stop();
              setMessage("");
              setAccountPage(false);
              setAdminPage(true);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            {t("Administrační panel")}
          </button>
        )}
        {user && (
          <button
            className="account-menu-link"
            disabled={loading || transferBusy}
            onClick={() => {
              stop();
              setMessage("");
              setAccountPage(true);
              setAdminPage(false);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
            aria-current={accountPage ? "page" : undefined}
          >
            {t("Smazat účet")}
          </button>
        )}
      </aside>
      <main>
        {!user && (
          <div className="account-bar compact-only-bar">
            {compactButton}
            <FullscreenButton onError={setMessage} />
          </div>
        )}
        {demo && (
          <div className="demo-banner" role="status">
            <div>
              <strong>{t("Demo bez registrace")}</strong>
              <p>
                {t(
                  "Smyčky můžeš libovolně měnit. Zůstanou jen v této otevřené stránce; před odchodem je exportuj do JSON nebo ZIP.",
                )}
              </p>
            </div>
            <button
              disabled={loading || transferBusy}
              onClick={() =>
                setConfirm({
                  title: t("Ukončit demo"),
                  text: t(
                    "Ukončením dema se smažou všechny jeho změny. Exportované soubory ti zůstanou. Pokračovat?",
                  ),
                  action: () => {
                    stop();
                    onLogout();
                  },
                })
              }
            >
              <ActionLabel icon="logout">
                {t("Ukončit demo / přihlásit se")}
              </ActionLabel>
            </button>
          </div>
        )}
        {user && (
          <div className="account-bar">
            <span className="account-identity">
              {user.name} · {user.email}
            </span>
            {compactButton}
            <FullscreenButton onError={setMessage} />
            <button
              title={t("Odhlásit se")}
              disabled={transferBusy || loading}
              onClick={() =>
                guard(async () => {
                  try {
                    await onLogout();
                  } catch (e) {
                    setMessage(e.message);
                  }
                })
              }
            >
              <ActionLabel icon="logout">{t("Odhlásit se")}</ActionLabel>
            </button>
          </div>
        )}
        {adminPage && user?.isAdmin && (
          <AdminPanel onClose={() => setAdminPage(false)} />
        )}
        {accountPage && user && (
          <section
            className="account-delete-page"
            aria-labelledby="account-delete-title"
          >
            <div className="eyebrow">{t("SPRÁVA ÚČTU")}</div>
            <h1 id="account-delete-title">{t("Smazat účet")}</h1>
            <p className="account-email">{user.email}</p>
            <p>
              {t(
                "Smazáním účtu trvale odstraníš svůj profil v BEATS a všechny uložené smyčky. Tuto akci nelze vrátit. Tvůj Google účet zůstane zachovaný.",
              )}
            </p>
            <p>
              {t(
                "Než budeš pokračovat, můžeš si stáhnout smyčky jako ZIP. Po kliknutí na Smazat účet ještě požádáme o závěrečné potvrzení.",
              )}
            </p>
            <div className="account-delete-actions">
              <button
                disabled={loading || transferBusy}
                onClick={() => setAccountPage(false)}
              >
                {t("Zpět do studia")}
              </button>
              <button
                disabled={loading || transferBusy || !library.length}
                onClick={exportAll}
              >
                {t("Export všeho do ZIP")}
              </button>
              <button
                className="danger"
                disabled={transferBusy || loading}
                onClick={() =>
                  setConfirm({
                    title: t("Smazat účet"),
                    label: t("Trvale smazat účet"),
                    text: t(
                      "Účet {0} a všechny jeho smyčky budou trvale smazány. Zmizí i neuložené změny. Tuto akci nelze vrátit. Před smazáním si můžeš exportovat knihovnu do ZIP. Opravdu pokračovat?",
                      user.email,
                    ),
                    action: async () => {
                      stop();
                      setLoading(true);
                      try {
                        await onLogout(true);
                      } catch (e) {
                        setMessage(e.message);
                      } finally {
                        setLoading(false);
                      }
                    },
                  })
                }
              >
                {t("Smazat účet")}
              </button>
            </div>
          </section>
        )}
        {!adminPage && !accountPage && !project && (
          <HomeScreen
            loops={filteredLibrary}
            total={library.length}
            search={search}
            onSearch={setSearch}
            onCreate={createLoop}
            onOpen={load}
            loading={loading || libraryLoading}
          />
        )}
        {(accountPage || !project) && message && (
          <div className="notice" role="status">
            {message}
            <button
              aria-label={t("Zavřít oznámení")}
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}
        {!adminPage && !accountPage && project && (
          <>
            <header className="project-header">
              <div className="project-heading">
                <div className="eyebrow">
                  {" "}
                  {t("BICÍ STUDIO")} <span>/</span> {t("SEKVENCER")}{" "}
                </div>
                <LoopName
                  value={project.name}
                  onChange={(name) => edit({ name })}
                />
                <div className="subtitle">
                  <span className={"small-dot " + (dirty ? "unsaved" : "")} />
                  {dirty
                    ? t("Rozpracovaný nápad")
                    : t("Všechny změny uloženy")}{" "}
                  <span>·</span> {project.bars.length}{" "}
                  {project.bars.length === 1 ? t("takt") : t("taktů")}
                </div>
              </div>
              <div className="save-actions">
                <button
                  type="button"
                  title={t("Zavřít")}
                  onClick={() => guard(home)}
                >
                  <ActionLabel icon="close">{t("Zavřít")}</ActionLabel>
                </button>
                <ExportDialog project={project} />
                {savedId && (
                  <button
                    title={t("Uložit kopii")}
                    disabled={loading}
                    onClick={() => save(true)}
                  >
                    {" "}
                    <ActionLabel icon="copy">
                      {t("Uložit kopii")}
                    </ActionLabel>{" "}
                  </button>
                )}
                <button
                  className="primary"
                  title={t("↓ Uložit smyčku")}
                  disabled={loading || !project.name.trim()}
                  onClick={() => save()}
                >
                  {" "}
                  <ActionLabel icon="save">
                    {t("↓ Uložit smyčku")}
                  </ActionLabel>{" "}
                </button>
              </div>
            </header>
            <section className="transport">
              <div className="play-controls">
                <button
                  className={
                    "transport-button transport-play " +
                    (playing ? "active" : "")
                  }
                  aria-label={playing ? t("Zastavit") : t("Přehrát")}
                  title={playing ? t("Zastavit") : t("Přehrát")}
                  disabled={loading}
                  onClick={() => play()}
                >
                  <TransportIcon
                    name={loading ? "loading" : playing ? "stop" : "play"}
                  />
                  <span>{playing ? t("Zastavit") : t("Přehrát")}</span>
                </button>
                <button
                  type="button"
                  className="transport-button"
                  aria-label={t("Přehrát takt")}
                  title={t("Přehrát takt")}
                  disabled={loading || playing}
                  onClick={() => play(true)}
                >
                  <TransportIcon name="bar" />
                  <span>{t("Přehrát takt")}</span>
                </button>
                <button
                  type="button"
                  className="transport-button transport-toggle"
                  aria-label={t("Opakovat smyčku")}
                  title={t("Opakovat smyčku")}
                  aria-pressed={repeat}
                  disabled={loading || (playing && playingBar)}
                  onClick={() => {
                    setRepeat(!repeat);
                    engine.setRepeating(!repeat);
                  }}
                >
                  <TransportIcon name="repeat" />
                  <span>{t("Opakovat smyčku")}</span>
                  <span className="transport-state" aria-hidden="true">
                    {repeat ? "✓" : ""}
                  </span>
                </button>
                <WarmupToggle
                  checked={adapterWarmup}
                  disabled={playing || loading}
                  onChange={(enabled) => {
                    setAdapterWarmup(enabled);
                    try {
                      localStorage.setItem(
                        "beats-adapter-warmup-v2",
                        String(enabled),
                      );
                    } catch {}
                  }}
                />
              </div>
              <div className="control tempo">
                <label htmlFor="bpm">TEMPO</label>
                <div>
                  <TempoInput
                    value={project.bpm}
                    onCommit={(bpm) => edit({ bpm })}
                  />
                </div>
              </div>
              <div className="control">
                <label>
                  {t("TAKT")} {selected + 1}
                </label>
                <div className="meter">
                  <select
                    aria-label={t("Počet dob")}
                    value={current.numerator}
                    onChange={(e) =>
                      editBar((b) => ({ ...b, numerator: +e.target.value }))
                    }
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <span>/</span>
                  <select
                    aria-label={t("Hodnota doby")}
                    value={current.denominator}
                    onChange={(e) =>
                      editBar((b) => ({ ...b, denominator: +e.target.value }))
                    }
                  >
                    {[4, 8, 16].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="control volume">
                <span className="compact-volume-icon">
                  <TransportIcon name="volume" />
                </span>
                <label htmlFor="volume">
                  {" "}
                  {t("HLASITOST")} <span>{volume}%</span>
                </label>
                <input
                  aria-label={t("HLASITOST")}
                  id="volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => {
                    setVolume(+e.target.value);
                    engine.setVolume(+e.target.value / 100);
                  }}
                />
              </div>
            </section>
            {message && (
              <div className="notice" role="status">
                {message}
                <button
                  aria-label={t("Zavřít oznámení")}
                  onClick={() => setMessage("")}
                >
                  ×
                </button>
              </div>
            )}
            <section className="arrangement">
              <div className="section-label">
                {" "}
                {t("ARANŽMÁ")}{" "}
                <span>{t("Takty hrají postupně ve smyčce")}</span>
              </div>
              <div className="bar-tabs" ref={barTabsRef}>
                {project.bars.map((b, i) => (
                  <button
                    key={b.id}
                    draggable={project.bars.length > 1}
                    title={t(
                      "Přesuň takt tažením. Klávesnicí: Alt + šipka vlevo nebo vpravo.",
                    )}
                    onDragStart={(e) => {
                      stop();
                      draggedBar.current = b.id;
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", b.id);
                    }}
                    onDragOver={(e) => {
                      if (!draggedBar.current) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropTarget({
                        id: b.id,
                        after: e.clientX > rect.left + rect.width / 2,
                      });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      moveBar(
                        draggedBar.current,
                        b.id,
                        e.clientX > rect.left + rect.width / 2,
                      );
                      draggedBar.current = null;
                      setDropTarget(null);
                    }}
                    onDragEnd={() => {
                      draggedBar.current = null;
                      setDropTarget(null);
                    }}
                    onKeyDown={(e) => {
                      if (
                        !e.altKey ||
                        !["ArrowLeft", "ArrowRight"].includes(e.key)
                      )
                        return;
                      e.preventDefault();
                      const target = i + (e.key === "ArrowRight" ? 1 : -1);
                      if (project.bars[target])
                        moveBar(b.id, project.bars[target].id, target > i);
                    }}
                    className={
                      "bar-tab " +
                      (dropTarget?.id === b.id
                        ? dropTarget.after
                          ? "drop-after "
                          : "drop-before "
                        : "") +
                      (i === selected ? "selected " : "") +
                      (playing && position.bar === i ? "sounding" : "")
                    }
                    onClick={() => setSelected(i)}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <i className="bar-grip" aria-hidden="true">
                      ⠿
                    </i>{" "}
                    {!compact && (
                      <>
                        {t("Takt")} {i + 1}
                      </>
                    )}
                    <small>
                      {b.numerator}/{b.denominator} · {b.rows.length}{" "}
                      {t("řádky")}{" "}
                    </small>
                  </button>
                ))}
                <button
                  className="add-bar"
                  title={t("＋ Přidat takt")}
                  disabled={project.bars.length >= limits.maxBars}
                  onClick={() => {
                    edit((p) => ({
                      ...p,
                      bars: [
                        ...p.bars,
                        emptyBarLike(p.bars[p.bars.length - 1]),
                      ],
                    }));
                    setSelected(project.bars.length);
                  }}
                >
                  {" "}
                  <ActionLabel icon="plus">
                    {t("＋ Přidat takt")}
                  </ActionLabel>{" "}
                </button>
              </div>
            </section>
            <section className="editor">
              <div className="editor-head">
                <div>
                  <span className="eyebrow">{t("EDITOR TAKTU")}</span>
                  <h2>
                    {" "}
                    {!compact && t("Takt")}{" "}
                    {String(selected + 1).padStart(2, "0")}{" "}
                    <span>
                      {current.numerator}/{current.denominator}
                    </span>
                  </h2>
                </div>
                <div className="bar-actions">
                  <button
                    disabled={project.bars.length >= limits.maxBars}
                    onClick={() => {
                      const copied = structuredClone(current);
                      copied.id = uid();
                      copied.rows.forEach((r) => (r.id = uid()));
                      edit((p) => ({
                        ...p,
                        bars: [
                          ...p.bars.slice(0, selected + 1),
                          copied,
                          ...p.bars.slice(selected + 1),
                        ],
                      }));
                      setSelected(selected + 1);
                    }}
                  >
                    {" "}
                    <ActionLabel icon="copy">
                      {t("⧉ Duplikovat")}
                    </ActionLabel>{" "}
                  </button>
                  <button
                    title={t("Smazat takt")}
                    disabled={project.bars.length === 1}
                    onClick={() =>
                      setConfirm({
                        text: t("Smazat tento takt včetně všech úderů?"),
                        action: () => {
                          edit((p) => ({
                            ...p,
                            bars: p.bars.filter((_, i) => i !== selected),
                          }));
                          setSelected(Math.max(0, selected - 1));
                        },
                      })
                    }
                  >
                    {" "}
                    <ActionLabel icon="trash">
                      {t("Smazat takt")}
                    </ActionLabel>{" "}
                  </button>
                </div>
              </div>
              <div className="grid-scroll">
                <div
                  className="grid-content"
                  style={{
                    minWidth: compact
                      ? Math.max(
                          8,
                          ...current.rows.map((r) => r.steps.length),
                        ) *
                          28 +
                        160
                      : Math.max(
                          760,
                          ...current.rows.map((r) => r.steps.length * 24 + 340),
                        ),
                  }}
                >
                  <div className="grid-labels">
                    <span>{t("NÁSTROJ")}</span>
                    <span>{t("DĚLENÍ")}</span>
                    <div className="beat-ruler">
                      {Array.from({ length: current.numerator }, (_, i) => (
                        <span key={i}>{i + 1}</span>
                      ))}
                    </div>
                    <span />
                  </div>
                  {current.rows.map((r, ri) => (
                    <div
                      className={"drum-row " + (r.muted ? "muted" : "")}
                      key={r.id}
                    >
                      <div className="instrument">
                        <button
                          className="audition"
                          title={t("Poslechnout nástroj")}
                          aria-label={t("Poslechnout ") + r.instrument}
                          onClick={() => preview(r)}
                        >
                          ◉
                        </button>
                        <InstrumentPicker
                          compact={compact}
                          value={r.instrument}
                          row={ri + 1}
                          onChange={(instrument) =>
                            editRow(r.id, (x) => ({ ...x, instrument }))
                          }
                        />
                      </div>
                      <DivisionPicker
                        row={ri + 1}
                        value={r.steps.length}
                        onCommit={(n) => {
                          editRow(r.id, (x) => ({
                            ...x,
                            steps: Array.from(
                              { length: n },
                              (_, i) => x.steps[i] || 0,
                            ),
                          }));
                        }}
                      />
                      <div
                        className="steps"
                        style={{
                          gridTemplateColumns: `repeat(${r.steps.length},minmax(0,1fr))`,
                        }}
                      >
                        {r.steps.map((v, i) => (
                          <button
                            key={i}
                            title={t(
                              "Úder {0}: {1}",
                              i + 1,
                              [
                                t("vypnutý"),
                                t("jemný"),
                                t("střední"),
                                t("silný"),
                              ][v],
                            )}
                            aria-label={t(
                              "Řádek {0}, úder {1}: {2}",
                              ri + 1,
                              i + 1,
                              [
                                t("vypnutý"),
                                t("jemný"),
                                t("střední"),
                                t("silný"),
                              ][v],
                            )}
                            aria-pressed={!!v}
                            className={`step level-${v} ${live && Math.floor(position.progress * r.steps.length) === i ? "current" : ""}`}
                            onClick={() =>
                              editRow(r.id, (x) => ({
                                ...x,
                                steps: x.steps.map((s, j) =>
                                  j === i ? (s + 1) % 4 : s,
                                ),
                              }))
                            }
                          >
                            {v > 0 && <span>{"•".repeat(v)}</span>}
                          </button>
                        ))}
                        {live && (
                          <div
                            className="playhead"
                            style={{ left: `${position.progress * 100}%` }}
                          />
                        )}
                      </div>
                      <div className="row-actions">
                        <button
                          aria-label={t("Ztlumit řádek {0}", ri + 1)}
                          aria-pressed={r.muted}
                          className={r.muted ? "on" : ""}
                          onClick={() =>
                            editRow(r.id, (x) => ({ ...x, muted: !x.muted }))
                          }
                        >
                          <TransportIcon name="mute" />
                        </button>
                        <button
                          aria-label={t("Odstranit řádek {0}", ri + 1)}
                          disabled={current.rows.length === 1}
                          onClick={() =>
                            editBar((b) => ({
                              ...b,
                              rows: b.rows.filter((x) => x.id !== r.id),
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="add-row"
                title={t("＋ Přidat nástroj")}
                disabled={current.rows.length >= 32}
                onClick={() =>
                  editBar((b) => ({ ...b, rows: [...b.rows, row("kick")] }))
                }
              >
                {" "}
                <ActionLabel icon="plus">
                  {t("＋ Přidat nástroj")}
                </ActionLabel>{" "}
                <span>{t("Vlastní dělení, vlastní rytmus")}</span>
              </button>
              <div className="editor-footer">
                <span>{t("Kliknutím měníš sílu úderu")}</span>
                <div className="legend">
                  <span>
                    <i className="level-0" /> {t("Vypnuto")}{" "}
                  </span>
                  <span>
                    <i className="level-1" /> {t("Jemně")}{" "}
                  </span>
                  <span>
                    <i className="level-2" /> {t("Středně")}{" "}
                  </span>
                  <span>
                    <i className="level-3" /> {t("Silně")}{" "}
                  </span>
                </div>
              </div>
            </section>
            <div className="hint">
              <span>↳</span>
              <p>
                <strong>{t("Každý řádek má svůj rytmus.")}</strong>{" "}
                {t(
                  "Dělení určuje počet stejných dílů celého taktu. Zkus 16 pro šestnáctiny ve 4/4 nebo 3 pro velkou triolu. Změna rytmu zastaví přehrávání.",
                )}{" "}
              </p>
            </div>
          </>
        )}
        <footer>
          <a href="./samples/ATTRIBUTION.md" target="_blank" rel="noreferrer">
            AVL Drumkits · Glen MacArthur · CC BY-SA 3.0
          </a>{" "}
          {t("BEATS / Malé studio pro velké nápady.")}{" "}
          <span>{t("Vytvoř. Opakuj. Najdi groove.")}</span>
          <span className="app-version">v{__BEATS_VERSION__}</span>
        </footer>
      </main>
      {confirm && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={t("Potvrzení")}
          >
            <h2>{confirm.title || t("Ještě jeden úder…")}</h2>
            <p>{confirm.text}</p>
            <div>
              <button autoFocus onClick={() => setConfirm(null)}>
                {" "}
                {t("Zrušit")}{" "}
              </button>
              <button
                className="primary"
                onClick={() => {
                  confirm.action();
                  setConfirm(null);
                }}
              >
                {" "}
                {confirm.label || t("Potvrdit")}{" "}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <AuthGate>
    {(user, onLogout, demo) => (
      <App
        key={demo ? "demo" : "account"}
        user={user}
        onLogout={onLogout}
        demo={demo}
      />
    )}
  </AuthGate>,
);
