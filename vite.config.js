import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);
const { build } = JSON.parse(
  readFileSync(new URL("./build-version.json", import.meta.url), "utf8"),
);
export default defineConfig({
  define: {
    __BEATS_VERSION__: JSON.stringify(
      `${version}+${process.env.BEATS_BUILD_NUMBER ?? build}`,
    ),
  },
  base: "./",
  server: {
    proxy: { "/api": "http://127.0.0.1:8080" },
    watch: { ignored: ["**/.runtime/**", "**/storage/**"] },
  },
});
