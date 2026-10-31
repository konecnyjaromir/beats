import React from "react";

export function TransportIcon({ name }) {
  const paths = {
    training: <path d="M3 19h5v-5h5V9h5V4h3M15 4h6v6" />,
    compact: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    save: (
      <>
        <path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M15 8V3H3v12h5" />
      </>
    ),
    export: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    fullscreen: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    logout: <path d="M10 3H3v18h7m-2-9h13m-5-5 5 5-5 5" />,
    plus: <path d="M12 4v16M4 12h16" />,
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
      </>
    ),
    mute: <path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6" />,
    volume: (
      <path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    ),
    play: <path d="m9 5 11 7-11 7Z" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    bar: (
      <>
        <path d="M4 5v14M20 5v14m-11-12 7 5-7 5Z" />
      </>
    ),
    repeat: (
      <>
        <path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3" />
      </>
    ),
    warmup: (
      <>
        <path d="m13 2-3 8h7l-6 12 1-9H6Z" />
      </>
    ),
    loading: <path d="M20 12a8 8 0 1 1-8-8" />,
  };
  return (
    <svg
      className="transport-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function ActionLabel({ icon, children }) {
  return (
    <>
      <span className="action-icon">
        <TransportIcon name={icon} />
      </span>
      <span className="action-label">{children}</span>
    </>
  );
}
