import React, { useLayoutEffect, useRef } from "react";
import { t } from "./i18n.js";

export function LoopName({ value, onChange }) {
  const ref = useRef(null);
  const resize = () => {
    const field = ref.current;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  };
  useLayoutEffect(resize, [value]);
  useLayoutEffect(() => {
    let width = -1;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== width) {
        width = entry.contentRect.width;
        resize();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <textarea
      ref={ref}
      className="title"
      rows={1}
      maxLength={80}
      aria-label={t("Název smyčky")}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[\r\n]+/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
