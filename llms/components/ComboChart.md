# Combo Chart

Combines multiple chart types (e.g., bars and line) for richer comparison.

## Metadata

- Import: `import { ComboChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, combo, mixed
- Docs: https://plocks.dev/charts/ComboChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/ComboChart

## Props

- `layers` (required): ComboChartLayer[] — Ordered set of layers to render in the combo chart
- `enableCrosshair`: boolean = true — Enable crosshair indicator across layers
- `multiTooltip`: boolean = true — Enable multi-series tooltip aggregation
- `liveTooltip`: boolean = true — Follow pointer live with tooltip
- `xDomain`: [number, number] — Explicit override for the shared x-domain
- `yDomain`: [number, number] — Explicit override for the primary y-domain
- `yDomainRight`: [number, number] — Explicit override for the secondary y-domain
- `xAxis`: ChartAxis — Axis configuration for the shared x-axis
- `yAxis`: ChartAxis — Axis configuration for the primary y-axis
- `yAxisRight`: ChartAxis — Axis configuration for the secondary y-axis
- `grid`: ChartGrid — Grid line configuration
- `legend`: ChartLegend — Legend display options
- `referenceLines`: ChartReferenceLine[] — Vertical (`x`) or horizontal (`y`) guide lines drawn above the series
- `referenceAreas`: ChartReferenceArea[] — Shaded rectangular regions drawn below the series
- `referenceDots`: ChartReferenceDot[] — Point markers drawn above the series
- `withBrush`: boolean = false — Draw a brush strip under the x axis; the plot shows only the selected range
- `brushProps`: ChartBrushConfig — Brush customization
- `brushRange`: [number, number] — Controlled visible x range. Drives the plot whether or not the built-in strip is shown, so an external `ChartBrush` (or any control) can drive it. Pair with `onBrushChange`; every range change — brush drag, keys, pan/zoom — is reported there and not applied until the prop changes.
- `onBrushChange`: (range: [number, number]) => void — Called with every new range, controlled or not

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Examples

### Basics

Combines multiple chart types (e.g., bars and line) for richer comparison.

```tsx
import { ComboChart } from '@plocks/charts';

import { LAYERS } from './data';

export function Demo() {
	return (
		<ComboChart
			title="Revenue vs. active users"
			subtitle="First half of FY25"
			h={340}
			layers={LAYERS}
			enableCrosshair
			multiTooltip
			liveTooltip
			xAxis={{
				show: true,
				title: 'Month',
				labelFormatter: (value) => `M${value}`,
			}}
			yAxis={{
				show: true,
				title: 'Revenue (USD thousands)',
				labelFormatter: (value) => `$${value}`,
			}}
			yAxisRight={{
				show: true,
				title: 'Active users (thousands)',
				labelFormatter: (value) => `${value}k`,
			}}
			yDomain={[0, 650]}
			yDomainRight={[80, 200]}
			grid={{ show: true, style: 'dashed' }}
			legend={{ show: true, position: 'bottom' }}
		/>
	);
}
```

`data.ts`

```ts
export const LAYERS = [
	{
		type: 'bar' as const,
		id: 'revenue',
		name: 'Monthly revenue',
		data: [
			{ x: 1, y: 420 },
			{ x: 2, y: 455 },
			{ x: 3, y: 508 },
			{ x: 4, y: 480 },
			{ x: 5, y: 532 },
			{ x: 6, y: 575 },
		],
		opacity: 0.85,
	},
	{
		type: 'line' as const,
		id: 'active-users',
		name: 'Active users',
		targetAxis: 'right' as const,
		data: [
			{ x: 1, y: 110 },
			{ x: 2, y: 134 },
			{ x: 3, y: 149 },
			{ x: 4, y: 158 },
			{ x: 5, y: 166 },
			{ x: 6, y: 172 },
		],
		thickness: 3,
		showPoints: true,
		pointSize: 6,
	},
];
```

### Reference marks

Reference areas below the layers, lines and dots above them; `y` reads against the primary (left) axis.

```tsx
import { ComboChart } from '@plocks/charts';

import { LAYERS } from './data';

export function Demo() {
  return (
    <ComboChart
      title="Monthly orders"
      h={320}
      layers={LAYERS}
      yDomain={[0, 700]}
      referenceAreas={[{ x1: 4.5, x2: 6.5, color: '#10b981', label: 'Promo' }]}
      referenceLines={[{ y: 500, label: 'Target 500', color: '#f59e0b', dashed: true }]}
      referenceDots={[{ x: 12, y: 640, r: 6, color: '#10b981', label: 'Record' }]}
      xAxis={{ show: true, labelFormatter: (value) => `M${value}` }}
      yAxis={{ show: true }}
      legend={{ show: true, position: 'bottom' }}
    />
  );
}
```

`data.ts`

```ts
const ORDERS = [320, 340, 365, 410, 520, 560, 480, 455, 470, 510, 590, 640];

const movingAverage = (values: number[], window: number) =>
  values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return Math.round(slice.reduce((sum, value) => sum + value, 0) / slice.length);
  });

export const LAYERS = [
  {
    type: 'bar' as const,
    id: 'orders',
    name: 'Orders',
    data: ORDERS.map((y, index) => ({ x: index + 1, y })),
  },
  {
    type: 'line' as const,
    id: 'average',
    name: '3-month average',
    showPoints: false,
    data: movingAverage(ORDERS, 3).map((y, index) => ({ x: index + 1, y })),
  },
];
```

### Brush

The brush preview draws each layer the way the chart does; bars and lines follow the window together.

```tsx
import { ComboChart } from '@plocks/charts';

import { LAYERS } from './data';

export function Demo() {
  return (
    <ComboChart
      h={340}
      layers={LAYERS}
      withBrush
      brushProps={{ start: 37, end: 60 }}
      xAxis={{ show: true, labelFormatter: (value) => `M${value}` }}
      yAxis={{ show: true }}
    />
  );
}
```

`data.ts`

```ts
// Five years of monthly orders with a 6-month moving average.
const ORDERS = Array.from({ length: 60 }, (_, month) =>
  Math.round(300 + month * 6 + 70 * Math.sin((month / 12) * Math.PI * 2) + 25 * Math.sin(month * 2.1)),
);

const movingAverage = (values: number[], window: number) =>
  values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return Math.round(slice.reduce((sum, value) => sum + value, 0) / slice.length);
  });

export const LAYERS = [
  {
    type: 'bar' as const,
    id: 'orders',
    name: 'Orders',
    data: ORDERS.map((y, index) => ({ x: index + 1, y })),
  },
  {
    type: 'line' as const,
    id: 'average',
    name: '6-month average',
    data: movingAverage(ORDERS, 6).map((y, index) => ({ x: index + 1, y })),
  },
];
```
