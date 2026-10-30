import { english } from "./translations.js";

export function translate(language, key, ...values) {
  const text = language === "cs" ? key : (english[key] ?? key);
  return text.replace(/\{(\d+)\}/g, (_, index) =>
    String(values[Number(index)] ?? ""),
  );
}
export const language =
  globalThis.__BEATS_CONFIG__?.language === "cs" ? "cs" : "en";
export const t = (key, ...values) => translate(language, key, ...values);
