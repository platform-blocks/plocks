# Matrix Chart

A compact x/y heatmap with categorical axes: string-keyed cells colored by value, with fixed-size cells and empty slots.

## Metadata

- Import: `import { MatrixChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, matrix, heatmap, categorical
- Docs: https://plocks.dev/charts/MatrixChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/MatrixChart

## Props

- `data` (required): MatrixChartCell[] — Cells, one per x/y pair. Missing pairs render as empty cells.
- `xLabels`: string[] — Column order and labels. Defaults to the distinct `x` values in data order.
- `yLabels`: string[] — Row order and labels. Defaults to the distinct `y` values in data order.
- `withXLabels`: boolean = true — Show column labels
- `withYLabels`: boolean = true — Show row labels
- `xLabelsPosition`: 'top' | 'bottom' = 'bottom' — Which edge the column labels sit on
- `xLabelsRotation`: number = 0 — Rotation of column labels, in degrees. Negative values lean left.
- `xLabelsHeight`: number — Height reserved for column labels; measured from the labels by default
- `yLabelsWidth`: number — Width reserved for row labels; measured from the labels by default
- `fontSize`: number = 11 — Label font size
- `colors`: string[] — Colors cells interpolate between, low to high. Defaults to four shades of the theme's first accent color.
- `domain`: [number, number] — Value range mapped onto `colors`. Defaults to the data's min and max.
- `emptyColor`: string — Color of empty (`null` or missing) cells
- `cellSize`: number — Cell size in px. Defaults to whatever fits the width, between 12 and 40. When the container is narrower than the grid, cells shrink to fit, down to 12px; below that the chart keeps its width.
- `gap`: number = 2 — Gap between cells, in px
- `cellRadius`: number = 2 — Cell border radius
- `getCellProps`: (cell: MatrixChartCell) => MatrixChartCellProps | undefined — Extra SVG attributes per cell, e.g. a fill decided by thresholds
- `tooltip`: ChartTooltip<MatrixChartCell> — Tooltip configuration; `formatter` receives the hovered cell
- `legend`: MatrixChartLegend — Color legend

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Types

```ts
export interface MatrixChartCell {
  /** Column identifier */
  x: string;
  /** Row identifier */
  y: string;
  /** Value the cell is colored by; `null` marks an empty cell */
  value: number | null;
  /** Arbitrary metadata forwarded through interactions */
  data?: any;
}

export interface MatrixChartCellProps {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rx?: number;
  ry?: number;
}

export interface MatrixChartLegend {
  /** Show the color legend below the grid */
  show?: boolean;
  /** Text at the low and high ends of the swatch strip */
  labels?: [ReactNode, ReactNode];
  /** Horizontal placement under the grid */
  align?: 'start' | 'center' | 'end';
}
```

## Examples

### Basics

Each `{ x, y, value }` cell is colored by its value. Columns and rows follow the order the labels first appear in the data, and `null` marks an empty cell.

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return (
    <MatrixChart
      title="Visitors by hour"
      data={VISITORS}
      tooltip={{ formatter: ({ x, y, value }) => `${y} ${x}: ${value === null ? 'No data' : `${value} visitors`}` }}
    />
  );
}
```

`data.ts`

```ts
import type { MatrixChartCell } from '@plocks/charts';

export const HOURS = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const VISITORS: MatrixChartCell[] = [
  { x: '6 AM', y: 'Mon', value: 3 },
  { x: '8 AM', y: 'Mon', value: 14 },
  { x: '10 AM', y: 'Mon', value: 26 },
  { x: '12 PM', y: 'Mon', value: 30 },
  { x: '2 PM', y: 'Mon', value: 28 },
  { x: '4 PM', y: 'Mon', value: 22 },
  { x: '6 PM', y: 'Mon', value: 12 },
  { x: '8 PM', y: 'Mon', value: 5 },
  { x: '6 AM', y: 'Tue', value: 4 },
  { x: '8 AM', y: 'Tue', value: 16 },
  { x: '10 AM', y: 'Tue', value: 28 },
  { x: '12 PM', y: 'Tue', value: 32 },
  { x: '2 PM', y: 'Tue', value: 30 },
  { x: '4 PM', y: 'Tue', value: 24 },
  { x: '6 PM', y: 'Tue', value: 14 },
  { x: '8 PM', y: 'Tue', value: 6 },
  { x: '6 AM', y: 'Wed', value: 5 },
  { x: '8 AM', y: 'Wed', value: 18 },
  { x: '10 AM', y: 'Wed', value: 30 },
  { x: '12 PM', y: 'Wed', value: 35 },
  { x: '2 PM', y: 'Wed', value: 32 },
  { x: '4 PM', y: 'Wed', value: 26 },
  { x: '6 PM', y: 'Wed', value: 16 },
  { x: '8 PM', y: 'Wed', value: 8 },
  { x: '6 AM', y: 'Thu', value: 3 },
  { x: '8 AM', y: 'Thu', value: 15 },
  { x: '10 AM', y: 'Thu', value: 25 },
  { x: '12 PM', y: 'Thu', value: 29 },
  { x: '2 PM', y: 'Thu', value: 27 },
  { x: '4 PM', y: 'Thu', value: 21 },
  { x: '6 PM', y: 'Thu', value: 13 },
  { x: '8 PM', y: 'Thu', value: 7 },
  { x: '6 AM', y: 'Fri', value: 2 },
  { x: '8 AM', y: 'Fri', value: 12 },
  { x: '10 AM', y: 'Fri', value: 22 },
  { x: '12 PM', y: 'Fri', value: 26 },
  { x: '2 PM', y: 'Fri', value: 24 },
  { x: '4 PM', y: 'Fri', value: 18 },
  { x: '6 PM', y: 'Fri', value: 15 },
  { x: '8 PM', y: 'Fri', value: 10 },
  { x: '6 AM', y: 'Sat', value: 1 },
  { x: '8 AM', y: 'Sat', value: 4 },
  { x: '10 AM', y: 'Sat', value: 8 },
  { x: '12 PM', y: 'Sat', value: 12 },
  { x: '2 PM', y: 'Sat', value: 14 },
  { x: '4 PM', y: 'Sat', value: 10 },
  { x: '6 PM', y: 'Sat', value: 8 },
  { x: '8 PM', y: 'Sat', value: 6 },
  { x: '6 AM', y: 'Sun', value: null },
  { x: '8 AM', y: 'Sun', value: 2 },
  { x: '10 AM', y: 'Sun', value: 5 },
  { x: '12 PM', y: 'Sun', value: 9 },
  { x: '2 PM', y: 'Sun', value: 10 },
  { x: '4 PM', y: 'Sun', value: 7 },
  { x: '6 PM', y: 'Sun', value: 5 },
  { x: '8 PM', y: 'Sun', value: 3 },
];
```

### Labels

`xLabels` and `yLabels` fix the column and row order. `withXLabels` and `withYLabels` hide either axis, and `xLabelsPosition="top"` moves the column labels above the grid.

```tsx
import { MatrixChart } from '@plocks/charts';

import { DAYS, HOURS, VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} xLabels={HOURS} yLabels={DAYS} xLabelsPosition="top" />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Column label rotation

`xLabelsRotation` tilts the column labels; the band under the grid grows to fit them. Use `-90` for long labels.

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} xLabelsRotation={-45} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Colors

`colors` is the ramp cells interpolate across, low to high. The default is four shades of the theme's first accent color.

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} colors={['#FFEDD5', '#FDBA74', '#F97316', '#9A3412']} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Values domain

`domain` pins the value range mapped onto the colors, so charts with different data share one scale. By default it is the data's min and max.

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} domain={[0, 50]} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Cell size and gap

`cellSize` sets the cells in px instead of fitting them to the width, and still shrinks them on narrow screens; `gap` and `cellRadius` space and round them.

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} cellSize={30} gap={3} cellRadius={4} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Cell props

`getCellProps` returns extra SVG attributes for a cell, here a fill decided by thresholds rather than the color ramp.

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return (
    <MatrixChart
      data={VISITORS}
      getCellProps={(cell) => {
        if (cell.value === null) return undefined;
        if (cell.value >= 25) return { fill: '#1baf7a' };
        if (cell.value >= 15) return { fill: '#eda100' };
        return { fill: '#e34948' };
      }}
    />
  );
}
```

`data.ts` is the same file shown under “Basics” above.

### Legend

`legend.show` adds the color ramp below the grid, captioned with `legend.labels` (`Less` and `More` by default).

```tsx
import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} legend={{ show: true, labels: ['Quiet', 'Busy'] }} />;
}
```

`data.ts` is the same file shown under “Basics” above.
