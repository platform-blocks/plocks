# Chart Brush

A range selector for cartesian charts: a miniature of the data with a draggable window. Line, Area, Bar and Combo charts draw one under their x axis with `withBrush`; render `ChartBrush` yourself and pass its range to a chart's `brushRange` to place it anywhere.

## Metadata

- Import: `import { ChartBrush } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, brush, range, zoom, selector
- Docs: https://plocks.dev/charts/ChartBrush
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/ChartBrush

## Props

- `domain`: [number, number] — Full extent the brush spans. Defaults to the x extent of `series` (or `[0, 1]`).
- `value`: [number, number] — Controlled selected range
- `defaultValue`: [number, number] — Initial selected range when uncontrolled. Defaults to the whole `domain`.
- `onChange`: (range: [number, number]) => void — Called with every new range — on each drag sample and each key press
- `onChangeEnd`: (range: [number, number]) => void — Called once a drag ends or after a keyboard step
- `series`: ChartBrushSeries[] — Series drawn in the miniature preview
- `previewType`: 'line' | 'area' | 'bar' = 'area' — Default preview drawing for series without a `type`. Default `'area'`.
- `normalizeSeries`: boolean = false — Scale every preview series to its own y extent instead of a shared one (dual-axis data)
- `band`: boolean = false — Treat the domain as category indices: values are whole indices, both ends inclusive, and each index owns an equal band of the strip.
- `w`: number — Strip width in px. Omit to fill the available width.
- `h`: number — Strip height in px. Default 40.
- `step`: number — Keyboard step (Shift+Arrow and PageUp/PageDown move ten steps). Default: 1 with `band`, else 1% of the domain.
- `snap`: boolean — Round dragged values to multiples of `step` from the domain start. Always on with `band`.
- `minSpan`: number — Smallest selectable span. Default: one `step` (a single category with `band`).
- `travellerWidth`: number = 8 — Width of the two drag handles in px. Default 8.
- `fill`: string — Fill of the selected window, drawn as given (pass a translucent color). Default: the first palette color at 12% opacity.
- `stroke`: string — Color of the window outline and handles. Default: the theme's secondary text color.
- `formatValue`: (value: number) => string — Formats a value for the handles' `aria-valuetext`
- `startLabel`: string = 'Range start' — Accessible name of the start handle. Default "Range start".
- `endLabel`: string = 'Range end' — Accessible name of the end handle. Default "Range end".
- `disabled`: boolean = false — Ignore pointer and keyboard input
- `testID`: string — Test ID of the strip; the handles get `-start` / `-end` and the window `-window` suffixes
- `style`: any — Style of the outer View

## Types

```ts
export interface ChartBrushSeries {
  /** Identifier (matched by `brushProps.series` on the charts) */
  id?: string | number;
  /** Display name (also matched by `brushProps.series`) */
  name?: string;
  /** Stroke / fill color; falls back to the theme palette */
  color?: string;
  /** Points to draw, in the same x units as the brush `domain` */
  data: Array<{ x: number; y: number }>;
  /** How this series is drawn; defaults to the brush's `previewType` */
  type?: 'line' | 'area' | 'bar';
}
```

## Examples

### Composed brush

A standalone `ChartBrush` driving a chart's controlled `brushRange`.

```tsx
import { useState } from 'react';
import { ChartBrush, LineChart } from '@plocks/charts';

import { SERIES } from './data';

export function Demo() {
  const [range, setRange] = useState<[number, number]>([60, 100]);

  return (
    <>
      <LineChart
        h={260}
        series={SERIES}
        showPoints={false}
        brushRange={range}
        onBrushChange={setRange}
        xAxis={{ show: true, labelFormatter: (value) => `Day ${value}` }}
        yAxis={{ show: true }}
        grid={{ show: true, style: 'dashed' }}
      />
      <ChartBrush
        h={48}
        series={SERIES}
        value={range}
        onChange={setRange}
        step={1}
        formatValue={(value) => `Day ${Math.round(value)}`}
      />
    </>
  );
}
```

`data.ts`

```ts
// 120 days of a deterministic daily metric with a weekly rhythm and a slow climb.
export const SERIES = [
  {
    id: 'visits',
    name: 'Visits',
    color: '#4C6EF5',
    data: Array.from({ length: 120 }, (_, day) => ({
      x: day,
      y: Math.round(800 + day * 4 + 140 * Math.sin((day / 7) * Math.PI * 2) + 60 * Math.sin(day / 11)),
    })),
  },
];
```
