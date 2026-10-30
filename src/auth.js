export const appConfig = globalThis.__BEATS_CONFIG__ ?? {};
export const limits = {
  maxLoops: appConfig.limits?.max_loops ?? 1000,
  maxBars: appConfig.limits?.max_bars ?? 1000,
};
let csrf = "";
export const requestHeaders = () => ({
  "Content-Type": "application/json",
  "X-Beats-Request": "1",
  ...(csrf ? { "X-Beats-CSRF": csrf } : {}),
});
export async function authRequest(body) {
  const response = await fetch("./api/auth.php", {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: requestHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error);
  if (data.csrf) csrf = data.csrf;
  return data;
}
