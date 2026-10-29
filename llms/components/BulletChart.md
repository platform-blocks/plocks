# Bullet Chart

Compare a measure against a target and qualitative ranges in a compact bar, after Stephen Few's bullet graph.

## Metadata

- Import: `import { BulletChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, bullet, target, kpi, progress
- Docs: https://plocks.dev/charts/BulletChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/BulletChart

## Props

- `value`: number — The measure the bar shows. Required unless `data` is given.
- `target`: number — Comparative measure, drawn as a marker across the bar
- `ranges`: BulletChartRange[] — Qualitative bands as cumulative upper bounds, lowest first. With `data`, these apply to every row that has no `ranges` of its own.
- `label`: string — Name shown beside the bar: on the leading side when horizontal, above when vertical
- `description`: string — Secondary line under `label`
- `data`: BulletChartItem[] — Several bullets on one shared scale, one row (or column, when vertical) each. Replaces `value`, `label` and `description`; `target` and `ranges` act as defaults for rows that omit them.
- `min`: number — Start of the scale
- `max`: number — End of the scale. Defaults to the largest value, target or range, rounded up to a tick.
- `orientation`: 'horizontal' | 'vertical' = 'horizontal' — Direction the bar grows
- `valueFormatter`: (value: number) => string — Formats axis ticks, tooltip values and the accessible label. Defaults to the theme's number format.
- `color`: string — Bar color; defaults to the first color of the theme's accent palette
- `targetColor`: string — Target marker color; defaults to the theme's primary text color
- `barThickness`: number = 0.33 — Bar thickness as a fraction of the band's thickness (0–1)
- `withAxis`: boolean = true — Draw the value axis
- `ticks`: number — Approximate number of axis ticks
- `tooltip`: ChartTooltip<BulletChartDatum> — Tooltip configuration; `formatter` receives the hovered mark
- `disableAnimation`: boolean = false — Draw the bar at its final length at once

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Types

```ts
export interface BulletChartRange {
  /** Upper bound of the band, in data units */
  value: number;
  /** Band color; defaults to a shade of the theme's neutral, darkest for the lowest band */
  color?: string;
  /** Name of the band ("Poor", "Good"), used in the tooltip and accessible label */
  label?: string;
}

export interface BulletChartItem {
  /** Name shown beside the bar */
  label?: string;
  /** Secondary line shown under the label (units, period) */
  description?: string;
  /** The measure the bar shows */
  value: number;
  /** Comparative measure, drawn as a marker across the bar */
  target?: number;
  /** Qualitative bands; falls back to the chart's `ranges` */
  ranges?: BulletChartRange[];
  /** Bar color; falls back to the chart's `color` */
  color?: string;
  /** Target marker color; falls back to the chart's `targetColor` */
  targetColor?: string;
}

export interface BulletChartDatum {
  /** Which part of the bullet the mark is */
  kind: 'value' | 'target' | 'range';
  /** Row of the bullet in `data` (0 for a single bullet) */
  index: number;
  /** Display name of the mark */
  label: string;
  /** The value, the target, or a range's upper bound */
  value: number;
  /** A range's lower bound */
  from?: number;
  /** Resolved color of the mark */
  color: string;
  /** The bullet the mark belongs to */
  item: BulletChartItem;
}
```

## Examples

### Basics

The bar shows the value, the marker shows the target, and the shaded bands behind them show the qualitative ranges.

```tsx
import { BulletChart } from '@plocks/charts';

import { REVENUE_RANGES } from './data';

export function Demo() {
  return <BulletChart label="Revenue" description="USD, Q3" value={230000} target={250000} ranges={REVENUE_RANGES} maw={520} />;
}
```

`data.ts`

```ts
import type { BulletChartRange } from '@plocks/charts';

export const REVENUE_RANGES: BulletChartRange[] = [
  { value: 150000, label: 'Poor' },
  { value: 225000, label: 'Average' },
  { value: 300000, label: 'Good' },
];
```

### Range colors

Give each range its own `color` and `label`; the label appears in the tooltip and the accessible description.

```tsx
import { BulletChart } from '@plocks/charts';

import { SATISFACTION_RANGES } from './data';

export function Demo() {
  return (
    <BulletChart
      label="Satisfaction"
      description="Score out of 100"
      value={72}
      target={85}
      ranges={SATISFACTION_RANGES}
      color="#334155"
      maw={520}
    />
  );
}
```

`data.ts`

```ts
import type { BulletChartRange } from '@plocks/charts';

export const SATISFACTION_RANGES: BulletChartRange[] = [
  { value: 60, label: 'Unhappy', color: '#f8c4c4' },
  { value: 80, label: 'Neutral', color: '#fde7b0' },
  { value: 100, label: 'Happy', color: '#c6ecd0' },
];
```

### Vertical

`orientation="vertical"` grows the bar upward, with the label above it and the axis on the left.

```tsx
import { BulletChart } from '@plocks/charts';

export function Demo() {
  return (
    <BulletChart
      orientation="vertical"
      label="Profit"
      description="%"
      value={22}
      target={26}
      ranges={[{ value: 20 }, { value: 25 }, { value: 30 }]}
      h={280}
    />
  );
}
```

### Value formatter

`valueFormatter` formats the axis ticks, the tooltip and the accessible label.

```tsx
import { BulletChart } from '@plocks/charts';

export function Demo() {
  return (
    <BulletChart
      value={230000}
      target={150000}
      ranges={[{ value: 100000 }, { value: 200000 }, { value: 300000 }]}
      valueFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
      maw={520}
    />
  );
}
```

### Multiple bullets

Pass `data` to draw several bullets on one shared scale; `target` and `ranges` on the chart apply to rows that omit them.

```tsx
import { BulletChart } from '@plocks/charts';

import { KPIS } from './data';

export function Demo() {
  return <BulletChart data={KPIS} ranges={[{ value: 60 }, { value: 90 }, { value: 120 }]} maw={560} />;
}
```

`data.ts`

```ts
import type { BulletChartItem } from '@plocks/charts';

export const KPIS: BulletChartItem[] = [
  { label: 'Revenue', description: '% of plan', value: 92, target: 100 },
  { label: 'Margin', description: '% of plan', value: 78, target: 90 },
  { label: 'New customers', description: '% of plan', value: 104, target: 100 },
  { label: 'Retention', description: '% of plan', value: 61, target: 85 },
];
```
