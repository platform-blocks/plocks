# Area Chart

Area (filled) chart for visualizing cumulative or stacked trends.

## Metadata

- Import: `import { AreaChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, area, timeseries
- Docs: https://plocks.dev/charts/AreaChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/AreaChart

## Props

- `layout`: 'overlap' | 'stacked' | 'stackedPercentage' | 'stream' = 'overlap' — Controls how multiple series are rendered. - `overlap` leaves each area independent (default). - `stacked` cumulatively stacks values and renders using stacked layers. - `stackedPercentage` stacks each x's share of its total; the y scale runs 0–1. - `stream` is a streamgraph: the stack is centered on a moving baseline (silhouette offset). The y axis and its gridlines are hidden unless `yAxis.show` is `true`; tooltips still report each series' raw value.
- `areaOpacity`: number — Opacity used when rendering stacked layers (if not provided defaults to fillOpacity).
- `stackOrder`: 'normal' | 'reverse' — Adjust the stacking order when using stacked layouts.
- `referenceLines`: ChartReferenceLine[] — Vertical (`x`) or horizontal (`y`) guide lines drawn above the areas, in every layout. `y` is in the drawn scale: data values in `overlap`, stack totals in `stacked`, the 0–1 stack fraction in `stackedPercentage` (`0.5` is 50%), and the offset from the centerline in `stream` (`0` is the middle).
- `referenceAreas`: ChartReferenceArea[] — Shaded regions drawn below the areas; `y1`/`y2` use the same scale as `referenceLines`.
- `referenceDots`: ChartReferenceDot[] — Point markers drawn above the areas; `y` uses the same scale as `referenceLines`.
- `withBrush`: boolean — Draw a brush strip under the x axis; the plot shows only the selected range
- `brushProps`: ChartBrushConfig — Brush customization
- `brushRange`: [number, number] — Controlled visible x range. Drives the plot whether or not the built-in strip is shown, so an external `ChartBrush` (or any control) can drive it. Pair with `onBrushChange`; every range change — brush drag, keys, pan/zoom — is reported there and not applied until the prop changes.
- `onBrushChange`: (range: [number, number]) => void — Called with every new range, controlled or not

Plus the `LineChart` props (`data` `series` `lineColor` `lineThickness` `lineStyle` `showPoints` `pointSize` `pointColor` `smooth` `fill` `fillColor` `fillOpacity` `areaFillMode` `xAxis` `yAxis` `grid` `legend` `tooltip` `animation` `enableCrosshair` `enableSeriesToggle` `liveTooltip` `multiTooltip` `enablePanZoom` `zoomMode` `minZoom` `onDomainChange` `enableWheelZoom` `wheelZoomStep` `invertWheelZoom` `resetOnDoubleTap` `clampToInitialDomain` `invertPinchZoom` `disableAnimations` `decimationThreshold` `xScaleType` `yScaleType` `enableBrushZoom` `annotations`): https://plocks.dev/llms/components/LineChart.md

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Examples

### Basics

Simple random data area chart with title.

```tsx
import { AreaChart } from '@plocks/charts';

import { WEEKLY_SIGNUPS } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Weekly signups"
      subtitle="Organic vs virality"
      h={240}
      data={WEEKLY_SIGNUPS}
      xAxis={{
        show: true,
        labelFormatter: (value: number) => `Week ${value + 1}`,
      }}
      yAxis={{
        show: true,
        labelFormatter: (value: number) => `${value} users`,
      }}
      grid={{ show: true, style: 'dashed' }}
      tooltip={{ show: true }}
      enableCrosshair
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
export const WEEKLY_SIGNUPS = [
  { x: 0, y: 42 },
  { x: 1, y: 68 },
  { x: 2, y: 83 },
  { x: 3, y: 97 },
  { x: 4, y: 124 },
  { x: 5, y: 138 },
  { x: 6, y: 152 },
  { x: 7, y: 167 },
];
```

### Reference marks

Areas, lines and dots placed in data coordinates; AreaChart accepts the same reference props as LineChart.

```tsx
import { AreaChart } from '@plocks/charts';

import { ACTIVE_USERS } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Daily active users"
      h={300}
      data={ACTIVE_USERS}
      showPoints={false}
      referenceAreas={[{ x1: 5, x2: 7, color: '#8b5cf6', label: 'Launch week' }]}
      referenceLines={[{ y: 4, label: 'Goal 4M', color: '#f59e0b', dashed: true }]}
      referenceDots={[{ x: 11, y: 4.4, r: 6, color: '#8b5cf6', label: 'Record' }]}
      xAxis={{ show: true, labelFormatter: (value) => `W${Math.round(value) + 1}` }}
      yAxis={{ show: true, labelFormatter: (value) => `${value}M` }}
      grid={{ show: true }}
    />
  );
}
```

`data.ts`

```ts
const DAILY_ACTIVE = [1.8, 1.9, 2.1, 2.0, 2.3, 3.1, 3.6, 3.4, 3.5, 3.9, 4.2, 4.4];

export const ACTIVE_USERS = DAILY_ACTIVE.map((y, x) => ({ x, y }));
```

### Stacked reference marks

Reference areas, lines and dots on a stacked layout, placed against the stack totals.

```tsx
import { AreaChart } from '@plocks/charts';

import { SIGNUP_SERIES } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Signups by channel"
      h={320}
      series={SIGNUP_SERIES}
      layout="stacked"
      referenceAreas={[{ x1: 5, x2: 7, color: '#8b5cf6', label: 'Campaign' }]}
      referenceLines={[{ y: 40, label: 'Target 40k', color: '#ef4444', dashed: true }]}
      referenceDots={[{ x: 11, y: 50, r: 6, color: '#8b5cf6', label: 'Peak' }]}
      xAxis={{ show: true, labelFormatter: (value) => `W${Math.round(value) + 1}` }}
      yAxis={{ show: true, labelFormatter: (value) => `${value}k` }}
      grid={{ show: true }}
      legend={{ show: true, position: 'bottom' }}
    />
  );
}
```

`data.ts`

```ts
const CHANNELS = [
  { id: 'organic', name: 'Organic', color: '#3b82f6', values: [12, 13, 14, 14, 15, 18, 21, 22, 23, 24, 25, 26] },
  { id: 'paid', name: 'Paid', color: '#10b981', values: [6, 6, 7, 8, 8, 12, 15, 14, 13, 13, 14, 15] },
  { id: 'referral', name: 'Referral', color: '#f97316', values: [3, 3, 4, 4, 5, 6, 7, 7, 8, 8, 9, 9] },
];

export const SIGNUP_SERIES = CHANNELS.map(({ values, ...channel }) => ({
  ...channel,
  data: values.map((y, x) => ({ x, y })),
}));
```

### Streamgraph

`layout="stream"` centers the stack on a moving baseline. The y axis is hidden by default; tooltips show each series' own value.

```tsx
import { AreaChart } from '@plocks/charts';

import { LISTENING_SERIES, MONTHS } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Listening hours by genre"
      h={320}
      series={LISTENING_SERIES}
      layout="stream"
      areaOpacity={0.8}
      xAxis={{ show: true, labelFormatter: (value) => MONTHS[Math.round(value)] ?? '' }}
      legend={{ show: true, position: 'bottom' }}
      enableCrosshair
      multiTooltip
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
const GENRES = [
  { id: 'pop', name: 'Pop', values: [32, 34, 38, 41, 39, 36, 33, 35, 40, 44, 46, 43] },
  { id: 'hiphop', name: 'Hip-hop', values: [18, 22, 27, 30, 34, 38, 41, 40, 37, 35, 33, 34] },
  { id: 'rock', name: 'Rock', values: [28, 26, 24, 21, 19, 18, 16, 15, 15, 14, 13, 12] },
  { id: 'electronic', name: 'Electronic', values: [8, 10, 14, 19, 24, 22, 18, 16, 19, 23, 27, 30] },
  { id: 'jazz', name: 'Jazz', values: [6, 6, 5, 5, 6, 7, 8, 9, 8, 7, 7, 6] },
];

export const LISTENING_SERIES = GENRES.map(({ values, ...genre }) => ({
  ...genre,
  data: values.map((y, x) => ({ x, y })),
}));

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
```

### Brush

`withBrush` works in every layout; here the stacked layers follow the selected window.

```tsx
import { AreaChart } from '@plocks/charts';

import { SERIES } from './data';

export function Demo() {
  return (
    <AreaChart
      h={340}
      layout="stacked"
      series={SERIES}
      withBrush
      brushProps={{ start: 360, end: 539 }}
      xAxis={{ show: true, labelFormatter: (value) => `D${value}` }}
      yAxis={{ show: true }}
    />
  );
}
```

`data.ts`

```ts
// 18 months of daily traffic by channel.
const daily = (id: string, name: string, color: string, base: number, amp: number, phase: number) => ({
  id,
  name,
  color,
  data: Array.from({ length: 540 }, (_, day) => ({
    x: day,
    y: Math.max(0, Math.round(base + day * 0.15 + amp * Math.sin(day / 30 + phase) + amp * 0.4 * Math.sin((day / 7) * Math.PI * 2))),
  })),
});

export const SERIES = [
  daily('organic', 'Organic', '#4C6EF5', 120, 30, 0),
  daily('paid', 'Paid', '#F59F00', 70, 25, 1.1),
  daily('referral', 'Referral', '#20C997', 40, 12, 2.3),
];
```

### Inventory Levels Warehouses

```tsx
import { AreaChart } from '@plocks/charts';

import { INVENTORY_SERIES, formatMonth } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Inventory Levels by Warehouse"
      subtitle="Safety stock adjustments across the first half"
      h={420}
      series={INVENTORY_SERIES}
      smooth={false}
      grid={{ show: true, style: 'solid' }}
      legend={{ show: true, position: 'bottom', align: 'center' }}
      tooltip={{
        show: true,
        formatter: (point) => {
          const label = formatMonth(Math.round(point.x));
          return `${label} • ${point.data?.warehouse ?? 'Warehouse'}: ${Math.round(point.y)}k units`;
        },
      }}
      xAxis={{
        show: true,
        title: '2025 timeline',
        labelFormatter: (value: number) => formatMonth(Math.round(value)),
      }}
      yAxis={{
        show: true,
        title: 'Inventory on hand (thousands)',
        labelFormatter: (value: number) => `${Math.round(value)}k`,
      }}
      enableCrosshair
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const INVENTORY_SEGMENTS = [
  {
    id: 'north',
    name: 'North DC',
    values: [420, 432, 446, 438, 412, 398],
    smooth: true,
  },
  {
    id: 'central',
    name: 'Central Hub',
    values: [506, 498, 473, 452, 438, 421],
    smooth: false,
  },
  {
    id: 'south',
    name: 'South Cross-dock',
    values: [318, 332, 347, 352, 366, 371],
    smooth: true,
  },
];

export const formatMonth = (index: number) => MONTHS[index] ?? `M${index + 1}`;

export const INVENTORY_SERIES = INVENTORY_SEGMENTS.map(({ id, name, values, smooth }) => ({
  id,
  name,
  smooth,
  data: values.map((units, index) => ({
    x: index,
    y: units,
    data: { warehouse: name, month: formatMonth(index), units },
  })),
}));
```

### Mobile Device Sessions

```tsx
import { AreaChart } from '@plocks/charts';

import { PHASE_LABELS, SESSION_SERIES } from './data';

const formatPhase = (index: number) => PHASE_LABELS[index] ?? `Week ${index + 1}`;

export function Demo() {
  return (
    <AreaChart
      title="Active Sessions During Launch"
      subtitle="Layered by device platform"
      h={420}
      series={SESSION_SERIES}
      smooth
      grid={{ show: true, style: 'solid' }}
      legend={{ show: true, position: 'bottom', align: 'center' }}
      enableSeriesToggle
      tooltip={{
        show: true,
        formatter: (point) => {
          const label = formatPhase(Math.round(point.x));
          const channel = point.data?.label ?? 'Sessions';
          return `${label} • ${channel}: ${Math.round(point.y)}k`;
        },
      }}
      xAxis={{
        show: true,
        title: 'Launch timeline',
        labelFormatter: (value: number) => formatPhase(Math.round(value)),
      }}
      yAxis={{
        show: true,
        title: 'Daily sessions (thousands)',
        labelFormatter: (value: number) => `${Math.round(value)}k`,
      }}
      enableCrosshair
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
export const PHASE_LABELS = ['Pre-Launch', 'Launch Week', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

export const SESSION_SERIES = [
  {
    id: 'ios',
    name: 'iOS',
    data: [42, 78, 92, 88, 96, 101].map((value, index) => ({ x: index, y: value, data: { label: 'iOS' } })),
  },
  {
    id: 'android',
    name: 'Android',
    data: [58, 94, 103, 108, 112, 118].map((value, index) => ({ x: index, y: value, data: { label: 'Android' } })),
  },
  {
    id: 'web',
    name: 'Web',
    data: [64, 71, 69, 75, 82, 87].map((value, index) => ({ x: index, y: value, data: { label: 'Web' } })),
  },
];
```

### Renewable Energy Mix

Stacks monthly solar, wind, and hydro production to highlight how policy shifts increase clean generation share over the first half of 2025.

```tsx
import { AreaChart } from '@plocks/charts';

import { MONTH_LABELS, RENEWABLE_SERIES } from './data';

const formatMonth = (index: number) => MONTH_LABELS[index] ?? `M${index + 1}`;

export function Demo() {
  return (
    <AreaChart
      layout="stacked"
      title="Renewable Energy Generation"
      subtitle="Utility-scale output by source"
      h={420}
      series={RENEWABLE_SERIES}
      smooth
      grid={{ show: true, style: 'dashed' }}
      legend={{ show: true, position: 'bottom', align: 'center' }}
      xAxis={{
        show: true,
        title: 'Month of 2025',
        labelFormatter: (value: number) => formatMonth(Math.round(value)),
      }}
      yAxis={{
        show: true,
        title: 'Generation (GWh)',
        labelFormatter: (value: number) => `${Math.round(value)} GWh`,
      }}
      enableCrosshair
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const RENEWABLE_SERIES = [
  {
    id: 'solar',
    name: 'Solar',
    data: [32, 38, 44, 52, 57, 61].map((value, index) => ({ x: index, y: value })),
  },
  {
    id: 'wind',
    name: 'Wind',
    data: [48, 42, 50, 47, 53, 58].map((value, index) => ({ x: index, y: value })),
  },
  {
    id: 'hydro',
    name: 'Hydro',
    data: [36, 34, 31, 28, 30, 33].map((value, index) => ({ x: index, y: value })),
  },
];
```

### Streaming Minutes Campaign

**Story focus** - Tracks how a marketing push shifts audience attention across Originals, TV, film, and live sports week-by-week. - Highlights the share-based stack so teams can see when new content overtakes legacy catalog minutes. - Surfaces total minute contribution per category inside the tooltip for quick campaign readouts. **Key settings** - Uses `layout="stackedPercentage"` to normalize each week to 100% share. - Keeps dashed gridlines and a centered legend for comparative scanning. - Custom tooltip blends absolute minutes with share-of-week for richer context.

```tsx
import { AreaChart } from '@plocks/charts';

import { STREAMING_SERIES, WEEK_TOTALS, formatWeek } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Streaming Minutes During Campaign"
      subtitle="Share of viewing time by content category"
      h={420}
      series={STREAMING_SERIES}
      layout="stackedPercentage"
      stackOrder="normal"
      areaOpacity={0.6}
      smooth
      grid={{ show: true, style: 'dashed' }}
      legend={{ show: true, position: 'bottom', align: 'center' }}
      tooltip={{
        show: true,
        formatter: (point) => {
          const index = Math.round(point.x);
          const label = formatWeek(index);
          const minutes = point.data?.minutes ?? 0;
          const total = WEEK_TOTALS[index] ?? 0;
          const share = total > 0 ? (minutes / total) * 100 : 0;
          return `${label} • ${point.data?.category ?? 'Content'}: ${minutes}M min (${share.toFixed(1)}%)`;
        },
      }}
      xAxis={{
        show: true,
        title: 'Campaign cadence',
        labelFormatter: (value: number) => formatWeek(Math.round(value)),
      }}
      yAxis={{
        show: true,
        title: 'Share of weekly minutes',
        labelFormatter: (value: number) => `${Math.round(value * 100)}%`,
      }}
      enableCrosshair
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
export const CAMPAIGN_WEEKS = ['Teaser Week', 'Launch Week', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

export const CONTENT_SEGMENTS = [
  {
    id: 'originals',
    name: 'Original Series',
    values: [62, 88, 112, 131, 126, 118],
  },
  {
    id: 'licensed',
    name: 'Licensed TV',
    values: [78, 96, 108, 114, 109, 104],
  },
  {
    id: 'films',
    name: 'Films',
    values: [54, 63, 82, 91, 87, 84],
  },
  {
    id: 'sports',
    name: 'Live Sports',
    values: [18, 22, 34, 47, 52, 48],
  },
];

export const formatWeek = (index: number) => CAMPAIGN_WEEKS[index] ?? `Week ${index + 1}`;

export const STREAMING_SERIES = CONTENT_SEGMENTS.map(({ id, name, values }) => ({
  id,
  name,
  data: values.map((minutes, index) => ({
    x: index,
    y: minutes,
    data: { category: name, week: formatWeek(index), minutes },
  })),
}));

export const WEEK_TOTALS = CAMPAIGN_WEEKS.map((_, index) =>
  STREAMING_SERIES.reduce((sum, series) => sum + (series.data[index]?.y ?? 0), 0)
);
```

### Support Severity Over Time

**Story focus** - Demonstrates how stacked areas surface the composition of weekly ticket inflow by severity level. - Highlights declining critical volume while medium issues remain the majority of support demand. - Emphasizes stability gains after mid-quarter improvements. **Key settings** - Uses the AreaChart `layout="stacked"` mode to visually sum severities per week. - Enables dashed grid lines and a bottom legend for quick reference. - Applies a week-aware `xAxis.labelFormatter` that translates series indices into friendly timeline labels.

```tsx
import { AreaChart } from '@plocks/charts';

import { SEVERITY_SERIES, WEEKS } from './data';

const formatWeek = (index: number) => WEEKS[index] ?? `Week ${index + 1}`;

export function Demo() {
  return (
    <AreaChart
      title="Quarterly Support Ticket Mix"
      subtitle="Stacked by severity level"
      h={420}
      series={SEVERITY_SERIES}
      layout="stacked"
      smooth
      grid={{ show: true, style: 'dashed' }}
      legend={{ show: true, position: 'bottom', align: 'center' }}
      xAxis={{
        show: true,
        title: 'Quarter timeline',
        labelFormatter: (value: number) => formatWeek(Math.round(value)),
      }}
      yAxis={{
        show: true,
        title: 'Tickets created',
        labelFormatter: (value: number) => `${Math.round(value)}`,
      }}
      enableCrosshair
      liveTooltip
    />
  );
}
```

`data.ts`

```ts
export const WEEKS = Array.from({ length: 12 }, (_, index) => `Week ${index + 1}`);

export const SEVERITY_SERIES = [
  {
    id: 'sev1',
    name: 'Critical',
    data: [12, 10, 9, 8, 7, 9, 8, 7, 6, 6, 5, 5].map((value, index) => ({ x: index, y: value })),
  },
  {
    id: 'sev2',
    name: 'High',
    data: [28, 32, 34, 29, 26, 24, 22, 23, 21, 19, 18, 17].map((value, index) => ({ x: index, y: value })),
  },
  {
    id: 'sev3',
    name: 'Medium',
    data: [46, 48, 51, 49, 45, 43, 41, 39, 36, 34, 33, 32].map((value, index) => ({ x: index, y: value })),
  },
];
```
