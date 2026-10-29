import type { BaseChartProps, ChartInteractionCallbacks, ChartLegend, ChartTooltip } from '../../types/base';

/** One node of the hierarchy. */
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

/** A node as resolved by the chart, passed to tooltips and interactions. */
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

export interface SunburstChartProps extends BaseChartProps, ChartInteractionCallbacks<SunburstChartSegment> {
  /** Top-level branches; each one's children form the next ring out */
  data: SunburstNode[];
  /** Radius of the center hole as a ratio (0–1) of the outer radius */
  innerRadius?: number;
  /** Radial space between rings, in px */
  ringGap?: number;
  /** Angular space between neighbouring segments, in degrees */
  padAngle?: number;
  /** Outline drawn around every segment. Defaults to the chart background. */
  strokeColor?: string;
  /** Width of the segment outline, in px */
  strokeWidth?: number;
  /** Number of rings drawn below the current root. Deeper nodes are left out. */
  maxDepth?: number;
  /** Write each node's name inside its segment when it fits */
  withLabels?: boolean;
  /** Text color of segment labels. Defaults to black or white, whichever reads on the fill. */
  labelColor?: string;
  /** Font size of segment labels */
  labelFontSize?: number;
  /**
   * Pressing a segment with children re-roots the chart on it; pressing the center
   * goes back up one level. Keeps a center hole of at least 15% of the radius.
   */
  zoomOnClick?: boolean;
  /** Called when a segment is pressed, with the node and its path from the top level */
  onSegmentPress?: (node: SunburstNode, path: SunburstNode[]) => void;
  /** Formats values in the tooltip */
  valueFormatter?: (value: number) => string;
  /** Legend of the top-level branches. Hidden unless `show` is true. */
  legend?: ChartLegend;
  /** Tooltip configuration; `formatter` receives the resolved segment */
  tooltip?: ChartTooltip<SunburstChartSegment>;
  /** Skip the intro and zoom animations */
  disableAnimation?: boolean;
}
