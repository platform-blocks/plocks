export const START = '2025-01-01';
export const END = '2025-06-30';

// Seeded so the calendar (and its screenshots) is identical on every render.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function contributions(): Record<string, number> {
  const random = mulberry32(2025);
  const out: Record<string, number> = {};
  for (let day = new Date(2025, 0, 1); day.getFullYear() === 2025; day = new Date(2025, day.getMonth(), day.getDate() + 1)) {
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const roll = random();
    if (roll < (weekend ? 0.6 : 0.2)) continue;
    const value = Math.round(random() * (weekend ? 4 : 12) + (day.getMonth() >= 8 ? 3 : 0));
    if (value > 0) out[`${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`] = value;
  }
  return out;
}

export const CONTRIBUTIONS = contributions();
