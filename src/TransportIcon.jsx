import React from "react";

export function TransportIcon({ name }) {
  const paths = {
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
