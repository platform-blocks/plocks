# Sunburst Chart

Show a hierarchy as concentric rings, with the root at the center and each node's arc sized by its value.

## Metadata

- Import: `import { SunburstChart } from '@plocks/charts';`
- Install: `npm install @plocks/charts` — a separate package from `@plocks/ui`
- Tags: chart, sunburst, hierarchy, radial, part-to-whole
- Docs: https://plocks.dev/charts/SunburstChart
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/charts/src/components/SunburstChart

## Props

- `data` (required): SunburstNode[] — Top-level branches; each one's children form the next ring out
- `innerRadius`: number = 0.2 — Radius of the center hole as a ratio (0–1) of the outer radius
- `ringGap`: number = 0 — Radial space between rings, in px
- `padAngle`: number = 0 — Angular space between neighbouring segments, in degrees
- `strokeColor`: string — Outline drawn around every segment. Defaults to the chart background.
- `strokeWidth`: number = 1 — Width of the segment outline, in px
- `maxDepth`: number — Number of rings drawn below the current root. Deeper nodes are left out.
- `withLabels`: boolean = true — Write each node's name inside its segment when it fits
- `labelColor`: string — Text color of segment labels. Defaults to black or white, whichever reads on the fill.
- `labelFontSize`: number — Font size of segment labels
- `zoomOnClick`: boolean = false — Pressing a segment with children re-roots the chart on it; pressing the center goes back up one level. Keeps a center hole of at least 15% of the radius.
- `onSegmentPress`: (node: SunburstNode, path: SunburstNode[]) => void — Called when a segment is pressed, with the node and its path from the top level
- `valueFormatter`: (value: number) => string — Formats values in the tooltip
- `legend`: ChartLegend — Legend of the top-level branches. Hidden unless `show` is true.
- `tooltip`: ChartTooltip<SunburstChartSegment> — Tooltip configuration; `formatter` receives the resolved segment
- `disableAnimation`: boolean = false — Skip the intro and zoom animations

Also accepts the shared props — chart (`w` `h` `aspectRatio` `maw` `miw` `mah` `mih` `testID` `style` `accessibilityLabel` `accessibilityHint` `accessibilityRole` `accessible` `importantForAccessibility` `animationDuration` `animationEasing` `disabled` `title` `subtitle` `useOwnInteractionProvider` `suppressPopover`), chart events (`onPress` `onDataPointPress`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`): https://plocks.dev/llms/guides/shared-props.md

## Types

```ts
export interface SunburstNode {
  /** Display name, shown in labels, the tooltip path and the legend */
  name: string;
  /**
   * Size of the node. Leaves need one; a parent without one takes the sum of its
   * children. A parent whose value exceeds that sum leaves the rest of its arc empty.
   */
  value?: number;
  /** Color override. Descendants without their own color take a tint of it. */
  color?: string;
  /** Child nodes, drawn on the next ring out */
  children?: SunburstNode[];
  /** Arbitrary metadata forwarded through interactions */
  data?: any;
}

export interface SunburstChartSegment {
  /** Stable key: the node's index path from the top level, e.g. `"0/2/1"` */
  key: string;
  /** The node's name */
  name: string;
  /** Resolved value: the node's own value, or the sum of its children */
  value: number;
  /** Resolved fill color */
  color: string;
  /** 1 for top-level branches, 2 for their children, … */
  depth: number;
  /** The node as passed in `data` */
  node: SunburstNode;
  /** The nodes from the top-level branch down to this one, inclusive */
  path: SunburstNode[];
  /** Value of the parent (the whole chart's total for a top-level branch) */
  parentValue: number;
  /** Sum of every top-level branch */
  total: number;
  /** Share of `parentValue`, 0–1 */
  shareOfParent: number;
  /** Share of `total`, 0–1 */
  shareOfTotal: number;
  /** Whether the node has children with a value */
  hasChildren: boolean;
  /** The node's `data` */
  data?: any;
}
```

## Examples

### Basics

Each ring is one level of the hierarchy and each arc is sized by its value. A parent without a `value` takes the sum of its children.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart title="Disk usage" data={DISK_USAGE} valueFormatter={(value) => `${value} GB`} maw={400} />;
}
```

`data.ts`

```ts
import type { SunburstNode } from '@plocks/charts';

export const DISK_USAGE: SunburstNode[] = [
  {
    name: 'Media',
    children: [
      {
        name: 'Photos',
        children: [
          { name: '2023', value: 24 },
          { name: '2024', value: 31 },
          { name: '2025', value: 17 },
        ],
      },
      { name: 'Videos', value: 26 },
      { name: 'Music', value: 9 },
    ],
  },
  {
    name: 'Apps',
    children: [
      { name: 'Xcode', value: 12 },
      { name: 'Photoshop', value: 4 },
      { name: 'Chrome', value: 1.5 },
      { name: 'Slack', value: 1 },
    ],
  },
  {
    name: 'Documents',
    children: [
      { name: 'Projects', value: 18 },
      { name: 'PDFs', value: 3 },
      { name: 'Sheets', value: 1 },
    ],
  },
  { name: 'System', value: 22 },
  { name: 'Downloads', value: 7 },
];
```

### Inner radius

`innerRadius` sets the center hole as a ratio of the outer radius. `0` fills the center.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} innerRadius={0} maw={400} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Max depth

`maxDepth` limits how many rings are drawn. Deeper nodes still count toward their ancestors' values.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} maxDepth={2} maw={400} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Spacing and outline

`ringGap` spaces the rings in px, `padAngle` spaces neighbouring segments in degrees, and `strokeColor` and `strokeWidth` set the outline.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} ringGap={4} padAngle={1} strokeWidth={0} maw={400} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Labels

Names are written inside segments only where they fit, along the arc or along the radius. `labelFontSize` and `labelColor` style them; `withLabels={false}` turns them off.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} labelFontSize={13} maw={400} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Colors

Each top-level branch takes a palette color and its descendants a lighter tint of it. A node's `color` overrides its own fill and the tint its children inherit.

```tsx
import { SunburstChart } from '@plocks/charts';

import { BUDGET } from './data';

export function Demo() {
  return <SunburstChart data={BUDGET} valueFormatter={(value) => `$${value}k`} maw={400} />;
}
```

`data.ts`

```ts
import type { SunburstNode } from '@plocks/charts';

export const BUDGET: SunburstNode[] = [
  {
    name: 'Engineering',
    color: '#2563eb',
    children: [
      { name: 'Platform', value: 420 },
      { name: 'Mobile', value: 310 },
      { name: 'Web', value: 280 },
    ],
  },
  {
    name: 'Sales',
    color: '#16a34a',
    children: [
      { name: 'EMEA', value: 190 },
      { name: 'Americas', value: 260 },
      { name: 'APAC', value: 120 },
    ],
  },
  {
    name: 'Marketing',
    color: '#ea580c',
    children: [
      { name: 'Brand', value: 140 },
      { name: 'Events', value: 90, color: '#a855f7' },
    ],
  },
];
```

### Zoom on click

With `zoomOnClick`, pressing a segment with children re-roots the chart on it. Press the center to go back up one level.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} zoomOnClick maw={400} />;
}
```

`data.ts` is the same file shown under “Basics” above.

### Legend

The legend is hidden by default. `legend={{ show: true }}` lists the top-level branches.

```tsx
import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} legend={{ show: true }} maw={400} />;
}
```

`data.ts` is the same file shown under “Basics” above.
