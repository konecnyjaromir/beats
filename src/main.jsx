import { t, language } from "./i18n.js";
import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { initial, bar, row, uid, instruments, normalizeProject } from "./model";
import { DrumEngine } from "./audio";
import { TempoInput } from "./TempoInput";
import { DivisionPicker } from "./DivisionPicker";
import { FullscreenButton } from "./FullscreenButton";
import { HomeScreen } from "./HomeScreen";
import { copyName } from "./copyName";
import "./style.css";
const engine = new DrumEngine();
const removeAudioUnlock = engine.installEarlyUnlock();
if (import.meta.hot) import.meta.hot.dispose(removeAudioUnlock);
document.documentElement.lang = language;
document.title = t("BEATS — bicí studio");
async function api(method = "GET", body, id) {
  const res = await fetch(
    `./api/loops.php${id ? "?id=" + encodeURIComponent(id) : ""}`,
    {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Beats-Request": "1" },
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
function App() {
  const [project, setProject] = useState(null),
    [selected, setSelected] = useState(0),
    [playing, setPlaying] = useState(false),
    [loading, setLoading] = useState(false),
    [position, setPosition] = useState({ bar: 0, progress: 0 }),
    [library, setLibrary] = useState([]),
    [libraryLoading, setLibraryLoading] = useState(true),
    [savedId, setSavedId] = useState(null),
    [dirty, setDirty] = useState(false),
    [message, setMessage] = useState(""),
    [volume, setVolume] = useState(75),
    [confirm, setConfirm] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("beats-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [search, setSearch] = useState("");
  const [adapterWarmup, setAdapterWarmup] = useState(() => {
    try {
      return localStorage.getItem("beats-adapter-warmup") === "true";
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
    refresh();
    return () => engine.stop();
  }, []);
  useEffect(() => {
    const fn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  function stop() {
    engine.stop();
    setPlaying(false);
    setPosition({ bar: 0, progress: 0 });
  }
  function home() {
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
  async function play() {
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
        project,
        (nextPosition) => {
          setPosition(nextPosition);
          setSelected(nextPosition.bar);
        },
        { warmup: adapterWarmup },
      );
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
    <div className={"app" + (sidebarCollapsed ? " sidebar-collapsed" : "")}>
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
          <span className="status-dot" /> {t("AKUSTICKÁ SADA")}{" "}
          <p>
            AVL Black Pearl · {instruments.length} {t("nástrojů")} <br />{" "}
            {t("Tři dynamické vrstvy")}{" "}
          </p>
        </div>
      </aside>
      <main>
        {!project && (
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
        {!project && message && (
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
        {project && (
          <>
            <header>
              <div>
                <div className="eyebrow">
                  {" "}
                  {t("BICÍ STUDIO")} <span>/</span> {t("SEKVENCER")}{" "}
                </div>
                <input
                  className="title"
                  aria-label={t("Název smyčky")}
                  maxLength={80}
                  value={project.name}
                  onChange={(e) => edit({ name: e.target.value })}
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
                <button type="button" onClick={() => guard(home)}>
                  {t("Zavřít")}
                </button>
                <FullscreenButton onError={setMessage} />
                {savedId && (
                  <button disabled={loading} onClick={() => save(true)}>
                    {" "}
                    {t("Uložit kopii")}{" "}
                  </button>
                )}
                <button
                  className="primary"
                  disabled={loading || !project.name.trim()}
                  onClick={() => save()}
                >
                  {" "}
                  {t("↓ Uložit smyčku")}{" "}
                </button>
              </div>
            </header>
            <section className="transport">
              <div className="play-controls">
                <button
                  className={"play " + (playing ? "active" : "")}
                  disabled={loading}
                  onClick={play}
                >
                  {loading ? "…" : playing ? "■" : "▶"}{" "}
                  <span>{playing ? t("Zastavit") : t("Přehrát")}</span>
                </button>
                <label className="adapter-warmup">
                  <input
                    type="checkbox"
                    checked={adapterWarmup}
                    disabled={playing || loading}
                    aria-describedby={
                      adapterWarmup ? "adapter-warmup-help" : undefined
                    }
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setAdapterWarmup(enabled);
                      try {
                        localStorage.setItem(
                          "beats-adapter-warmup",
                          String(enabled),
                        );
                      } catch {}
                    }}
                  />
                  {t("Zahřátí USB adaptéru")}
                </label>
                {adapterWarmup && (
                  <p id="adapter-warmup-help" className="adapter-warmup-help">
                    {t(
                      "Warm-up: před přehráváním přidá 1,5 sekundy pro probuzení zvukového adaptéru. Zapni, pokud ve sluchátkách přes adaptér chybí první úder. Opakování smyčky je bez prodlevy.",
                    )}
                  </p>
                )}
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
                    {[3, 4, 5, 6, 7, 8].map((n) => (
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
              <div className="loop-indicator">
                ↻{" "}
                <span>
                  {" "}
                  {t("CELÁ SMYČKA")}{" "}
                  <small>
                    {playing
                      ? t("Hraje takt {0}", position.bar + 1)
                      : t("Připraveno k přehrání")}
                  </small>
                </span>
              </div>
              <div className="control volume">
                <label htmlFor="volume">
                  {" "}
                  {t("HLASITOST")} <span>{volume}%</span>
                </label>
                <input
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
                    className={
                      "bar-tab " +
                      (i === selected ? "selected " : "") +
                      (playing && position.bar === i ? "sounding" : "")
                    }
                    onClick={() => setSelected(i)}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span> {t("Takt")}{" "}
                    {i + 1}
                    <small>
                      {b.numerator}/{b.denominator} · {b.rows.length}{" "}
                      {t("řádky")}{" "}
                    </small>
                  </button>
                ))}
                <button
                  className="add-bar"
                  disabled={project.bars.length >= 64}
                  onClick={() => {
                    edit((p) => ({
                      ...p,
                      bars: [
                        ...p.bars,
                        bar(current.numerator, current.denominator),
                      ],
                    }));
                    setSelected(project.bars.length);
                  }}
                >
                  {" "}
                  {t("＋ Přidat takt")}{" "}
                </button>
              </div>
            </section>
            <section className="editor">
              <div className="editor-head">
                <div>
                  <span className="eyebrow">{t("EDITOR TAKTU")}</span>
                  <h2>
                    {" "}
                    {t("Takt")} {String(selected + 1).padStart(2, "0")}{" "}
                    <span>
                      {current.numerator}/{current.denominator}
                    </span>
                  </h2>
                </div>
                <div className="bar-actions">
                  <button
                    disabled={project.bars.length >= 64}
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
                    {t("⧉ Duplikovat")}{" "}
                  </button>
                  <button
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
                    {t("Smazat takt")}{" "}
                  </button>
                </div>
              </div>
              <div className="grid-scroll">
                <div
                  className="grid-content"
                  style={{
                    minWidth: Math.max(
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
                        <select
                          aria-label={t("Nástroj řádku {0}", ri + 1)}
                          value={r.instrument}
                          onChange={(e) =>
                            editRow(r.id, (x) => ({
                              ...x,
                              instrument: e.target.value,
                            }))
                          }
                        >
                          {instruments.map((i) => (
                            <option value={i.id} key={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
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
                          M
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
                disabled={current.rows.length >= 32}
                onClick={() =>
                  editBar((b) => ({ ...b, rows: [...b.rows, row("kick")] }))
                }
              >
                {" "}
                {t("＋ Přidat nástroj")}{" "}
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
            <h2>{t("Ještě jeden úder…")}</h2>
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
                {t("Potvrdit")}{" "}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
