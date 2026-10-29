import type {
  BaseChartProps,
  ChartAxis,
  ChartGrid,
  ChartInteractionCallbacks,
  ChartLegend,
  ChartReferenceMarksProps,
} from '../../types/base';
import type { ChartBrushChartProps } from '../ChartBrush/types';

export interface ComboChartXYPoint {
  /** X-axis value for the data point */
  x: number;
  /** Y-axis value for the data point */
  y: number;
  /** Optional color override for the point */
  color?: string;
  /** Optional metadata forwarded through interaction callbacks and tooltips */
  meta?: Record<string, any>;
}

export type ComboChartLayer =
  | {
      /** Layer type */
      type: 'bar';
      /** Unique identifier for the layer */
      id?: string | number;
      /** Display name for the layer */
      name?: string;
      /** Axis assigned to render this layer */
      targetAxis?: 'left' | 'right';
      /** Bar series data points */
      data: ComboChartXYPoint[];
      /** Explicit bar width override */
      barWidth?: number;
      /** Base color applied to bars */
      color?: string;
      /** Opacity applied to the bars */
      opacity?: number;
    }
  | {
      /** Layer type */
      type: 'line';
      /** Unique identifier for the layer */
      id?: string | number;
      /** Display name for the layer */
      name?: string;
      /** Axis assigned to render this layer */
      targetAxis?: 'left' | 'right';
      /** Line series data points */
      data: ComboChartXYPoint[];
      /** Smooth the line path using curve interpolation */
      smooth?: boolean;
      /** Line stroke thickness */
      thickness?: number;
      /** Base color applied to the line */
      color?: string;
      /** Show point markers along the line */
      showPoints?: boolean;
      /** Size of the point markers */
      pointSize?: number;
    }
  | {
      /** Layer type */
      type: 'area';
      /** Unique identifier for the layer */
      id?: string | number;
      /** Display name for the layer */
      name?: string;
      /** Axis assigned to render this layer */
      targetAxis?: 'left' | 'right';
      /** Area series data points */
      data: ComboChartXYPoint[];
      /** Smooth the area curve using interpolation */
      smooth?: boolean;
      /** Fill color applied to the area */
      color?: string;
      /** Fill opacity applied to the area */
      fillOpacity?: number;
    }
  | {
      /** Layer type */
      type: 'histogram';
      /** Unique identifier for the layer */
      id?: string | number;
      /** Display name for the layer */
      name?: string;
      /** Axis assigned to render this layer */
      targetAxis?: 'left' | 'right';
      /** Raw values used to build the histogram */
      values: number[];
      /** Explicit bin count override */
      bins?: number;
      /** Automatic binning method */
      binMethod?: 'sturges' | 'sqrt' | 'fd';
      /** Color applied to histogram bars */
      color?: string;
      /** Opacity applied to histogram bars */
      opacity?: number;
    }
  | {
      /** Layer type */
      type: 'density';
      /** Unique identifier for the layer */
      id?: string | number;
      /** Display name for the layer */
      name?: string;
      /** Axis assigned to render this layer */
      targetAxis?: 'left' | 'right';
      /** Raw values used to compute the density curve */
      values: number[];
      /** Kernel bandwidth override for density estimation */
      bandwidth?: number;
      /** Color applied to the density curve */
      color?: string;
      /** Stroke thickness for the density curve */
      thickness?: number;
    };

export interface ComboChartProps
  extends BaseChartProps,
    ChartInteractionCallbacks<ComboChartXYPoint>,
    ChartReferenceMarksProps,
    ChartBrushChartProps {
  /** Ordered set of layers to render in the combo chart */
  layers: ComboChartLayer[];
  /** Enable crosshair indicator across layers */
  enableCrosshair?: boolean;
  /** Enable multi-series tooltip aggregation */
  multiTooltip?: boolean;
  /** Follow pointer live with tooltip */
  liveTooltip?: boolean;
  /** Explicit override for the shared x-domain */
  xDomain?: [number, number];
  /** Explicit override for the primary y-domain */
  yDomain?: [number, number];
  /** Explicit override for the secondary y-domain */
  yDomainRight?: [number, number];
  /** Axis configuration for the shared x-axis */
  xAxis?: ChartAxis;
  /** Axis configuration for the primary y-axis */
  yAxis?: ChartAxis;
  /** Axis configuration for the secondary y-axis */
  yAxisRight?: ChartAxis;
  /** Grid line configuration */
  grid?: ChartGrid;
  /** Legend display options */
  legend?: ChartLegend;
}