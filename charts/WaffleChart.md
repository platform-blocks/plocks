# Waffle Chart

Show parts of a whole as a grid of colored cells, with each segment taking cells in proportion to its value.

## Metadata

- Import: `import { WaffleChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, waffle, part-to-whole
- Docs: https://plocks.dev/charts/WaffleChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/WaffleChart

## Props

- `data` (required): WaffleChartCell[] — Segments to display
- `total`: number — The whole the values are measured against. Defaults to the sum of all values, which fills the grid; a larger total leaves the rest of the grid empty, for progress toward a goal. A total smaller than the sum is ignored.
- `rows`: number = 10 — Number of grid rows
- `columns`: number = 10 — Number of grid columns
- `gap`: number = 4 — Distance between cells, in px
- `cellRadius`: number = 2 — Border radius of each cell
- `fillDirection`: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top' = 'bottom-to-top' — Order in which cells are filled
- `emptyColor`: string — Color of unallocated cells
- `legend`: ChartLegend — Legend configuration. Shown below the grid by default; pass `{ show: false }` to hide it.
- `tooltip`: ChartTooltip<WaffleChartSegment> — Tooltip configuration; `formatter` receives the segment with its cell `count` and `percentage`
- `disableAnimation`: boolean = false — Skip the cell fill-in animation

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Types

```ts
export interface WaffleChartCell {
  /** Display name, shown in the legend and tooltip */
  name: string;
  /** Share of the whole. Cells are allocated in proportion to it. */
  value: number;
  /** Color override; defaults to the theme's accent palette */
  color?: string;
  /** Arbitrary metadata forwarded through interactions */
  data?: any;
}

export interface WaffleChartSegment extends WaffleChartCell {
  /** Resolved color */
  color: string;
  /** Number of grid cells allocated to the segment */
  count: number;
  /** Share of `total` (0–1) */
  percentage: number;
}
```

## Examples

### Basics

Each segment gets cells in proportion to its value; together they fill a 10 by 10 grid.

```tsx
import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart title="Browser share" data={BROWSER_SHARE} maw={360} />;
}
```

`data.ts`

```ts
import type { WaffleChartCell } from '@plocks/charts';

export const BROWSER_SHARE: WaffleChartCell[] = [
  { name: 'Chrome', value: 65 },
  { name: 'Safari', value: 19 },
  { name: 'Firefox', value: 10 },
  { name: 'Other', value: 6 },
];
```

### Total

`total` sets the whole the values are measured against. A total larger than their sum leaves the remaining cells empty.

```tsx
import { WaffleChart } from '@plocks/charts';

export function Demo() {
  return (
    <WaffleChart
      title="Migration progress"
      data={[
        { name: 'Migrated', value: 412 },
        { name: 'In review', value: 96 },
      ]}
      total={800}
      maw={360}
    />
  );
}
```

`data.ts` is the same file shown under “Basics” above.

### Tooltip

Hovering or pressing a cell shows its segment. `tooltip.formatter` receives the segment with its `count` of cells and `percentage`.

```tsx
import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return (
    <WaffleChart
      data={BROWSER_SHARE}
      tooltip={{ formatter: (segment) => `${segment.name}: ${segment.value}% (${segment.count} cells)` }}
      maw={360}
    />
  );
}
```

`data.ts` is the same file shown under “Basics” above.

### Legend

The legend sits below the grid by default. `legend.position` moves it to `top`, `left` or `right`; `legend={{ show: false }}` hides it.

```tsx
import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart data={BROWSER_SHARE} legend={{ position: 'right' }} maw={480} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Grid size and gap

`rows` and `columns` shape the grid, `gap` spaces the cells and `cellRadius` rounds them. Cells size themselves to the width available.

```tsx
import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart data={BROWSER_SHARE} rows={5} columns={20} gap={2} cellRadius={6} maw={480} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Fill direction

`fillDirection` sets the order cells are filled: `bottom-to-top` (the default) and `top-to-bottom` fill column by column, `left-to-right` and `right-to-left` row by row.

```tsx
import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart data={BROWSER_SHARE} fillDirection="left-to-right" maw={360} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Empty cells color

`emptyColor` paints the cells no segment claims.

```tsx
import { WaffleChart } from '@plocks/charts';

export function Demo() {
  return (
    <WaffleChart
      data={[{ name: 'Completed', value: 68, color: '#1baf7a' }]}
      total={100}
      emptyColor="#E2E8F0"
      maw={360}
    />
  );
}
```
