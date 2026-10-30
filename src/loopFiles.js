import { Unzip, UnzipInflate, strFromU8, strToU8, zip } from "fflate";
import { t } from "./i18n.js";

const MAX_FILE = 16 * 1024 * 1024;
const MAX_BATCH = 64 * 1024 * 1024;
export function portableLoop(project) {
  const { id, updatedAt, owner_id, ...loop } = project;
  return loop;
}
export function loopJson(project) {
  return JSON.stringify(portableLoop(project));
}
export function loopFilename(name) {
  return (
    (name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/[. ]+$/, "")
      .slice(0, 100) || "loop") + ".json"
  );
}
function parseLoops(bytes, label, result, maxLoops) {
  if (bytes.length > MAX_FILE)
    throw Error(t("Soubor smyčky překračuje 16 MB."));
  let parsed;
  try {
    parsed = JSON.parse(strFromU8(bytes));
  } catch {
    throw Error(t("Neplatný JSON v souboru {0}.", label));
  }
  for (const loop of Array.isArray(parsed) ? parsed : [parsed]) {
    if (
      !loop ||
      typeof loop !== "object" ||
      typeof loop.name !== "string" ||
      !Array.isArray(loop.bars)
    )
      throw Error(t("Soubor {0} neobsahuje smyčku BEATS.", label));
    if (result.length >= maxLoops)
      throw Error(t("Import obsahuje příliš mnoho smyček."));
    result.push(portableLoop(loop));
  }
}
export async function readLoopFiles(files, maxLoops = 1000) {
  const result = [];
  let expanded = 0;
  let compressed = 0;
  for (const file of files) {
    compressed += file.size;
    if (compressed > MAX_BATCH)
      throw Error(
        t("Import překračuje 64 MB. Rozděl soubory do menších dávek."),
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/\.zip$/i.test(file.name)) {
      let entryCount = 0;
      let completed = 0;
      const unzip = new Unzip((entry) => {
        if (entry.name.endsWith("/") || !/\.json$/i.test(entry.name)) return;
        if (++entryCount > maxLoops)
          throw Error(t("Import obsahuje příliš mnoho smyček."));
        const parts = [];
        let size = 0;
        entry.ondata = (error, data, final) => {
          if (error) throw error;
          size += data.length;
          expanded += data.length;
          if (size > MAX_FILE || expanded > MAX_BATCH) {
            entry.terminate();
            throw Error(
              t(
                "Rozbalený import je příliš velký (16 MB na soubor, 64 MB celkem).",
              ),
            );
          }
          parts.push(data);
          if (final) {
            completed++;
            const content = new Uint8Array(size);
            let offset = 0;
            for (const part of parts) {
              content.set(part, offset);
              offset += part.length;
            }
            parseLoops(content, entry.name, result, maxLoops);
          }
        };
        entry.start();
      });
      unzip.register(UnzipInflate);
      for (let offset = 0; offset < bytes.length; offset += 16384)
        unzip.push(
          bytes.subarray(offset, offset + 16384),
          offset + 16384 >= bytes.length,
        );
      if (completed !== entryCount)
        throw Error(t("ZIP se nepodařilo rozbalit."));
    } else {
      expanded += bytes.length;
      if (expanded > MAX_BATCH)
        throw Error(
          t("Import překračuje 64 MB. Rozděl soubory do menších dávek."),
        );
      parseLoops(bytes, file.name, result, maxLoops);
    }
  }
  if (!result.length) throw Error(t("Nebyly nalezeny žádné JSON smyčky."));
  return result;
}
export async function zipLoops(projects) {
  const files = {};
  projects.forEach((project, index) => {
    files[
      String(index + 1).padStart(4, "0") + "-" + loopFilename(project.name)
    ] = strToU8(loopJson(project));
  });
  return new Promise((resolve, reject) =>
    zip(files, { level: 6 }, (error, data) =>
      error ? reject(error) : resolve(data),
    ),
  );
}
export function downloadFile(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
