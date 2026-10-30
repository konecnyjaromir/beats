import { uid, normalizeProject } from "./model.js";
import { t } from "./i18n.js";

// Each demo has its own in-memory library. No writes are sent to the backend.
export function createDemo(examples) {
  let changed = false;
  const loops = new Map(
    examples.map((p) => {
      const id = uid();
      return [
        id,
        { ...structuredClone(p), id, updatedAt: new Date().toISOString() },
      ];
    }),
  );
  const first =
    [...loops.values()].find((p) => p.name.startsWith("Trioly")) ||
    [...loops.values()][0];
  return {
    get changed() {
      return changed;
    },
    first: structuredClone(first),
    async request(method = "GET", body, id) {
      if (method === "GET") {
        if (id) {
          if (!loops.has(id)) throw Error(t("Smyčka nebyla nalezena."));
          return structuredClone(loops.get(id));
        }
        return [...loops.values()].map((p) => ({
          id: p.id,
          name: p.name,
          bpm: p.bpm,
          numerator: p.numerator,
          denominator: p.denominator,
          barCount: p.bars.length,
          updatedAt: p.updatedAt,
          meters: [
            ...new Set(
              p.bars.map(
                (b) =>
                  `${b.numerator ?? p.numerator}/${b.denominator ?? p.denominator}`,
              ),
            ),
          ],
        }));
      }
      if (method === "DELETE") {
        loops.delete(id);
        changed = true;
        return { ok: true };
      }
      const nextId = body.id || uid();
      const p = {
        ...normalizeProject(structuredClone(body)),
        id: nextId,
        updatedAt: new Date().toISOString(),
      };
      loops.set(nextId, p);
      changed = true;
      return structuredClone(p);
    },
  };
}
