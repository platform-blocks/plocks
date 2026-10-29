// Calendar-day helpers. Every date here is a local calendar day: keys are parsed
// by hand (never `new Date('YYYY-MM-DD')`, which is UTC midnight and lands on
// the previous day west of Greenwich), and day arithmetic goes through
// `new Date(y, m, d + n)` so DST transitions can't add or drop a day.

const KEY = /^(\d{4})-(\d{2})-(\d{2})/;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** 'YYYY-MM-DD' for a local date. */
export const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Local midnight of a 'YYYY-MM-DD' key (anything after the day is ignored), or `null`. */
export const parseDateKey = (key: string): Date | null => {
  const match = KEY.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  // Rejects '2025-02-30' rather than rolling it into March.
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
};

/** Local midnight of the calendar day a string or `Date` names, or `null`. */
export const toCalendarDay = (value: string | Date | undefined | null): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  return parseDateKey(value);
};

export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Whole calendar days from `a` to `b`, immune to DST-length days. */
export const daysBetween = (a: Date, b: Date) =>
  Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);

/** Row of a day within its week column. */
export const weekdayRow = (date: Date, firstDayOfWeek: 0 | 1) => (date.getDay() - firstDayOfWeek + 7) % 7;
