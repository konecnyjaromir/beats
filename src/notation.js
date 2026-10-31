const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// One grid slot has an exact rational duration, including arbitrary tuplets.
export function notationTiming(n, d, steps) {
  const base = Math.max(
    1,
    Math.min(64, 2 ** Math.floor(Math.log2((d * steps) / n))),
  );
  const divisor = gcd(d * steps, n * base);
  return { base, count: (d * steps) / divisor, occupied: (n * base) / divisor };
}
