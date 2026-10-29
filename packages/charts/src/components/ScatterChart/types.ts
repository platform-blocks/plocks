import type {
  BaseChartProps,
  ChartAnimation,
  ChartAxis,
  ChartDataPoint,
  ChartGrid,
  ChartInteractionCallbacks,
  ChartLegend,
  ChartReferenceMarksProps,
  ChartTooltip,
} from '../../types/base';

export interface ScatterQuadrantConfig {
  /** X-axis value used to split the chart into left/right quadrants */
  x?: number;
  /** Y-axis value used to split the chart into top/bottom quadrants */
  y?: number;
  /** Background fills applied to the resulting quadrants */
  fills?: {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
  };
  /** Background fill opacity */
  fillOpacity?: number;
  /** Whether to render dividing guide lines */
  showLines?: boolean;
  /** Color for the dividing guide lines */
  lineColor?: string;
  /** Thickness for the dividing guide lines */
  lineWidth?: number;
  /** Optional labels describing each quadrant */
  labels?: {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
  };
  /** Label color */
  labelColor?: string;
  /** Label font size */
  labelFontSize?: number;
  /** Offset from the quadrant edge for the labels */
  labelOffset?: number;
}

export interface ScatterSeries {
  /** Unique identifier for the series */
  id?: string;
  /** Display name for the series */
  name?: string;
  /** Base color applied to the series */
  color?: string;
  /** Data points belonging to the series */
  data: ChartDataPoint[];
  /** Point size override for the series */
  pointSize?: number;
  /** Point color override for the series */
  pointColor?: string;
  /**
   * Value axis this series is scaled against. `'right'` plots it on the
   * secondary axis (`yAxisRight`) with its own domain. Defaults to `'left'`.
   */
  yAxis?: 'left' | 'right';
}

export interface ScatterChartProps
  extends BaseChartProps,
    ChartInteractionCallbacks<ChartDataPoint>,
    ChartReferenceMarksProps {
  /** Data points */
  data: ChartDataPoint[];
  /** Optional multi-series data (overrides top-level data if provided) */
  series?: ScatterSeries[];
  /** Point size */
  pointSize?: number;
  /** Point color */
  pointColor?: string;
  /** Point opacity */
  pointOpacity?: number;
  /** Allow adding points by tapping */
  allowAddPoints?: boolean;
  /** Show trend line. true|'overall' for single combined regression, 'per-series' for one per series */
  showTrendline?: boolean | 'overall' | 'per-series';
  /** Trend line color */
  trendlineColor?: string;
  /** Enable pan & zoom interactions */
  enablePanZoom?: boolean;
  /** Zoom mode (axes constrained) */
  zoomMode?: 'x' | 'y' | 'both';
  /** Minimum zoom scale (domain fraction) */
  minZoom?: number;
  /** Enable wheel zoom (web) */
  enableWheelZoom?: boolean;
  /** Wheel zoom step */
  wheelZoomStep?: number;
  /** Invert wheel zoom direction */
  invertWheelZoom?: boolean;
  /** Reset zoom on double tap */
  resetOnDoubleTap?: boolean;
  /** Clamp pan/zoom to initial full domain */
  clampToInitialDomain?: boolean;
  /** Invert pinch gesture direction (scale grows when fingers move closer) */
  invertPinchZoom?: boolean;
  /** X-axis configuration */
  xAxis?: ChartAxis;
  /** Y-axis configuration */
  yAxis?: ChartAxis;
  /**
   * Secondary (right-hand) value axis. Passing it shows the axis; `show: false`
   * hides it while right-bound series keep their own scale. Series opt in with
   * `yAxis: 'right'`; when none do, the axis mirrors the left domain.
   */
  yAxisRight?: ChartAxis;
  /** Explicit domain for the right axis (defaults to the right-bound series' data, padded like the left axis) */
  yDomainRight?: [number, number];
  /** Grid configuration */
  grid?: ChartGrid;
  /** Legend configuration */
  legend?: ChartLegend;
  /** Tooltip configuration */
  tooltip?: ChartTooltip<ChartDataPoint>;
  /** Animation configuration */
  animation?: ChartAnimation;
  /** Enable multi-series shared tooltip popover */
  multiTooltip?: boolean;
  /** Enable crosshair */
  enableCrosshair?: boolean;
  /** Live (follow pointer) tooltip selection */
  liveTooltip?: boolean;
  /** X scale type */
  xScaleType?: 'linear' | 'log' | 'time';
  /** Y scale type */
  yScaleType?: 'linear' | 'log' | 'time';
  /** Optional quadrant overlay configuration */
  quadrants?: ScatterQuadrantConfig;
}