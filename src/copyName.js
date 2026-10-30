export function copyName(name, existingNames, suffix) {
  const base = name.trim().replace(/\s+\((?:kopie|copy)(?: \d+)?\)$/i, "");
  const used = new Set(
    existingNames.map((value) => value.trim().toLowerCase()),
  );
  for (let number = 1; ; number++) {
    const ending = ` (${suffix}${number === 1 ? "" : ` ${number}`})`;
    const candidate = base.slice(0, 80 - ending.length).trimEnd() + ending;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}
