# Calendar Heatmap

A GitHub-style calendar heatmap: one cell per day, weeks as columns and weekdays as rows, colored by the value keyed to each `YYYY-MM-DD` date.

## Metadata

- Import: `import { CalendarHeatmapChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, heatmap, calendar, contributions, activity
- Docs: https://plocks.dev/charts/CalendarHeatmapChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/CalendarHeatmapChart

## Props

- `data` (required): Record<string, number> | CalendarHeatmapChartEntry[] — Values keyed by calendar day, `{ '2025-03-10': 4 }`. Keys are read as local calendar dates, never as UTC instants. An array of `{ date, value }` is also accepted. Days with no entry, or a value of `0`, are drawn in `emptyColor`.
- `startDate`: string | Date — First day shown. Defaults to 364 days before `endDate`.
- `endDate`: string | Date — Last day shown. Defaults to today.
- `firstDayOfWeek`: 0 | 1 = 1 — First day of each week column: `0` Sunday, `1` Monday
- `rectSize`: number = 10 — Size of a day cell in px. When the container is narrower than the calendar, cells shrink to fit, down to 3px; below that the chart keeps its width.
- `gap`: number = 1 — Space between cells, in px
- `rectRadius`: number = 2 — Corner radius of a cell
- `colors`: string[] — Colors days are bucketed into, low to high. Defaults to four shades of the theme's first accent color.
- `domain`: [number, number] — Value range spread across `colors`. Defaults to the data's min and max.
- `emptyColor`: string — Color of days with no value, and of outside days
- `withMonthLabels`: boolean = true — Show month names along the calendar
- `monthLabels`: string[] = DEFAULT_MONTH_LABELS — Month names, January first
- `monthLabelsPosition`: 'top' | 'bottom' = 'top' — Which edge the month names sit on
- `withWeekdayLabels`: boolean = false — Show weekday names to the left of the rows
- `weekdayLabels`: string[] = DEFAULT_WEEKDAY_LABELS — Weekday names, Sunday first (indexed like `Date.getDay()`), whatever `firstDayOfWeek` is. When rows are too short for every name, every other row is labelled.
- `weekdaysLabelsWidth`: number — Width reserved for weekday names; measured from the names by default
- `monthsLabelsHeight`: number — Height reserved for month names
- `fontSize`: number = 11 — Label font size
- `withOutsideDates`: boolean = true — Draw the days of the first and last week that fall outside the range as empty cells. `false` leaves those slots blank.
- `splitMonths`: boolean = false — Start every month in a new column, with an empty column between months
- `getRectProps`: (date: string, value: number | null) => CalendarHeatmapChartRectProps | undefined — Extra SVG attributes per day, e.g. a fill decided by thresholds
- `tooltip`: ChartTooltip<CalendarHeatmapChartDay> — Tooltip configuration; `formatter` receives the hovered `{ date, value }`
- `legend`: CalendarHeatmapChartLegend — Color legend

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Types

```ts
export interface CalendarHeatmapChartEntry {
  /** Calendar day, as 'YYYY-MM-DD' or a `Date` (its local year, month and day are used) */
  date: string | Date;
  /** Value for that day. Entries sharing a day are summed. */
  value: number;
}

export interface CalendarHeatmapChartRectProps {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rx?: number;
  ry?: number;
}

export interface CalendarHeatmapChartDay {
  /** Calendar day as 'YYYY-MM-DD' */
  date: string;
  /** The day's value, or `null` when `data` has no entry for it */
  value: number | null;
}

export interface CalendarHeatmapChartLegend {
  /** Show the color legend below the calendar */
  show?: boolean;
  /** Text at the low and high ends of the swatch strip. Defaults to `Less` and `More`. */
  labels?: [ReactNode, ReactNode];
  /** Horizontal placement under the calendar. Defaults to `end`, like GitHub. */
  align?: 'start' | 'center' | 'end';
}
```

## Examples

### Basics

Pass `data` keyed by `YYYY-MM-DD` and a date range. Columns are weeks, rows are weekdays, and days without a value are drawn empty.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart title="Contributions" data={CONTRIBUTIONS} startDate={START} endDate={END} />;
}
```

`data.ts`

```ts
export const START = '2025-01-01';
export const END = '2025-12-31';

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
```

### Month labels

Month names sit above the calendar by default. `monthLabelsPosition="bottom"` moves them below, and `monthLabels` renames them.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} monthLabelsPosition="bottom" />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Weekday labels

`withWeekdayLabels` names the rows. `firstDayOfWeek={0}` starts each week on Sunday; when rows are short, every other row is labelled.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} withWeekdayLabels firstDayOfWeek={0} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Colors

`colors` sets the levels days are bucketed into, low to high. The default is four shades of the theme's first accent color.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} colors={['#9be9a8', '#40c463', '#30a14e', '#216e39']} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Split months

`splitMonths` starts every month in its own column, with an empty column between months.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} splitMonths />;
}
```

`data.ts`

```ts
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
```

### Outside dates

`withOutsideDates={false}` leaves the days of the first and last week that fall outside the range blank.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate="2025-03-12" endDate="2025-08-20" withOutsideDates={false} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Cell size

`rectSize`, `gap` and `rectRadius` size the day cells. In a narrower box, cells shrink to fit.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate="2025-07-01" endDate={END} rectSize={16} gap={3} rectRadius={4} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Cell props

`getRectProps(date, value)` returns extra SVG attributes for a day, here outlining the busiest days.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} getRectProps={(date, value) => (value !== null && value >= 12 ? { stroke: '#e34948', strokeWidth: 1 } : undefined)} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Tooltip

`tooltip.formatter` receives the hovered `{ date, value }`. The default shows the localized date and the value.

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} tooltip={{ formatter: ({ date, value }) => `${value ?? 0} contributions on ${date}` }} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Legend

`legend.show` adds the empty color and the levels below the calendar, captioned with `legend.labels` (`Less` and `More` by default).

```tsx
import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} legend={{ show: true, labels: ['Fewer', 'More'] }} />;
}
```

`data.ts` is the same file shown under “Basics” above.
