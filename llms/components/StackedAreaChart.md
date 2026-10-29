# Stacked Area Chart

Area chart with multiple series stacked to show cumulative contributions.

## Metadata

- Import: `import { StackedAreaChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, area, stacked
- Docs: https://plocks.dev/charts/StackedAreaChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/StackedAreaChart

## Props

- `series` (required): LineChartSeries[] — Data series to stack
- `stackOrder`: 'normal' | 'reverse' = 'normal' — Order layers are stacked in
- `smooth`: boolean = true — Smooth (curved) area tops
- `opacity`: number = 0.55 — Base opacity for the stacked layers
- `stackMode`: 'absolute' | 'percentage' | 'stream' = 'absolute' — How the layers are stacked. - `absolute` stacks raw values from zero (default). - `percentage` normalizes each x to its share of the total; the y scale runs 0–1 (the values the y-axis `labelFormatter` receives). - `stream` is a streamgraph: each x's stack is centered on y = 0 (silhouette offset). The y axis and its gridlines are hidden unless `yAxis.show` is `true`; tooltips still report each series' raw value.
- `referenceLines`: ChartReferenceLine[] — Vertical (`x`) or horizontal (`y`) guide lines drawn above the layers. `y` is in the drawn stack scale: the stack total in `absolute`, the 0–1 stack fraction in `percentage` (`0.5` is 50%), and the offset from the centerline in `stream` (`0` is the middle of the stream).
- `referenceAreas`: ChartReferenceArea[] — Shaded regions drawn below the layers; `y1`/`y2` use the same scale as `referenceLines`.
- `referenceDots`: ChartReferenceDot[] — Point markers drawn above the layers; `y` uses the same scale as `referenceLines`.
- `withBrush`: boolean = false — Draw a brush strip under the x axis; the plot shows only the selected range
- `brushProps`: ChartBrushConfig — Brush customization
- `brushRange`: [number, number] — Controlled visible x range. Drives the plot whether or not the built-in strip is shown, so an external `ChartBrush` (or any control) can drive it. Pair with `onBrushChange`; every range change — brush drag, keys, pan/zoom — is reported there and not applied until the prop changes.
- `onBrushChange`: (range: [number, number]) => void — Called with every new range, controlled or not

Plus the `LineChart` props (`lineColor` `lineThickness` `lineStyle` `showPoints` `pointSize` `pointColor` `fillColor` `fillOpacity` `areaFillMode` `xAxis` `yAxis` `grid` `legend` `tooltip` `animation` `enableCrosshair` `enableSeriesToggle` `liveTooltip` `multiTooltip` `enablePanZoom` `zoomMode` `minZoom` `onDomainChange` `enableWheelZoom` `wheelZoomStep` `invertWheelZoom` `resetOnDoubleTap` `clampToInitialDomain` `invertPinchZoom` `disableAnimations` `decimationThreshold` `xScaleType` `yScaleType` `enableBrushZoom` `annotations`): https://plocks.dev/llms/components/LineChart.md

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Examples

### Basics

Area chart with multiple series stacked to show cumulative contributions.

```tsx
import { StackedAreaChart } from '@plocks/charts';

import { SERIES } from './data';

export function Demo() {
  return (
    <StackedAreaChart
      title="Active users by surface"
      subtitle="Monthly totals"
      h={340}
      series={SERIES}
      stackOrder="normal"
      opacity={0.65}
      xAxis={{ show: true, title: 'Month', labelFormatter: (value) => `M${value}` }}
      yAxis={{
        show: true,
        title: 'Active users (thousands)',
        labelFormatter: (value) => `${value}`,
      }}
      grid={{ show: true }}
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
export const SERIES = [
  {
    id: 'mobile',
    name: 'Mobile',
    data: [
      { x: 1, y: 22 },
      { x: 2, y: 26 },
      { x: 3, y: 28 },
      { x: 4, y: 32 },
      { x: 5, y: 36 },
      { x: 6, y: 38 },
      { x: 7, y: 42 },
      { x: 8, y: 44 },
      { x: 9, y: 47 },
      { x: 10, y: 50 },
      { x: 11, y: 52 },
      { x: 12, y: 55 },
    ],
  },
  {
    id: 'web',
    name: 'Web',
    data: [
      { x: 1, y: 18 },
      { x: 2, y: 20 },
      { x: 3, y: 22 },
      { x: 4, y: 25 },
      { x: 5, y: 26 },
      { x: 6, y: 27 },
      { x: 7, y: 28 },
      { x: 8, y: 30 },
      { x: 9, y: 32 },
      { x: 10, y: 33 },
      { x: 11, y: 34 },
      { x: 12, y: 35 },
    ],
  },
  {
    id: 'api',
    name: 'API',
    data: [
      { x: 1, y: 12 },
      { x: 2, y: 14 },
      { x: 3, y: 15 },
      { x: 4, y: 16 },
      { x: 5, y: 18 },
      { x: 6, y: 19 },
      { x: 7, y: 21 },
      { x: 8, y: 22 },
      { x: 9, y: 23 },
      { x: 10, y: 24 },
      { x: 11, y: 25 },
      { x: 12, y: 27 },
    ],
  },
];
```
