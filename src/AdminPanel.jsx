import React, { useEffect, useState } from "react";
import { t } from "./i18n.js";
import { requestHeaders } from "./auth.js";
import "./admin.css";

export function AdminPanel({ onClose }) {
  const [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    fetch(`./api/admin.php?page=${page}`, {
      credentials: "same-origin",
      headers: requestHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw Error(body.error);
        return body;
      })
      .then((body) => {
        if (!controller.signal.aborted) setData(body);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e.message || t("Seznam uživatelů se nepodařilo načíst."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, retry]);
  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">BEATS / ADMIN</span>
          <h1 id="admin-title">{t("Administrační panel")}</h1>
        </div>
        <button onClick={onClose}>{t("Zpět do studia")}</button>
      </div>
      <p>{t("Uživatelé a počet jejich uložených smyček.")}</p>
      {loading && <p role="status">{t("Načítání…")}</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry((n) => n + 1)}>
            {t("Zkusit znovu")}
          </button>
        </div>
      )}
      {data && (
        <>
          <p>{t("Celkem uživatelů: {0}", data.total)}</p>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("Jméno")}</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">{t("Počet smyček")}</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user, i) => (
                  <tr key={i}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.loop_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.users.length && <p>{t("Žádní uživatelé.")}</p>}
          {data.total > data.pageSize && (
            <div className="admin-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("Předchozí")}
              </button>
              <span>
                {page} / {Math.ceil(data.total / data.pageSize)}
              </span>
              <button
                disabled={page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("Další")}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
