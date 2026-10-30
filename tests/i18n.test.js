import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { english } from "../src/translations.js";
import { translate, language } from "../src/i18n.js";

test("English is the default and Czech preserves source text", () => {
  assert.equal(language, "en");
  assert.equal(translate("en", "Přehrát"), "Play");
  assert.equal(translate("cs", "Přehrát"), "Přehrát");
});
test("Localized messages preserve names and dynamic values", () => {
  assert.equal(
    translate("en", "Opravdu smazat „{0}“?", "Žlutý groove"),
    "Delete “Žlutý groove”?",
  );
  assert.equal(translate("cs", "Hraje takt {0}", 3), "Hraje takt 3");
  assert.equal(
    translate("en", "Řádek {0}, úder {1}: {2}", 2, 4, "soft"),
    "Row 2, hit 4: soft",
  );
});
test("Every static UI translation key has a nonempty English entry", () => {
  for (const file of [
    "main.jsx",
    "model.js",
    "audio.js",
    "FullscreenButton.jsx",
    "HomeScreen.jsx",
    "TempoInput.jsx",
    "DivisionPicker.jsx",
  ]) {
    const source = readFileSync(
      new URL("../src/" + file, import.meta.url),
      "utf8",
    );
    for (const match of source.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g)) {
      const key = JSON.parse('"' + match[1] + '"');
      assert.ok(
        english[key]?.trim(),
        `${file}: missing translation for ${key}`,
      );
    }
  }
});
