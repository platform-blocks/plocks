import type { ReactNode } from 'react';

import type { BaseChartProps, ChartInteractionCallbacks, ChartTooltip } from '../../types/base';

/** One cell of the matrix. */
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

/** SVG attributes a cell accepts from `getCellProps`. */
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

export interface MatrixChartProps extends BaseChartProps, ChartInteractionCallbacks<MatrixChartCell> {
  /** Cells, one per x/y pair. Missing pairs render as empty cells. */
  data: MatrixChartCell[];
  /** Column order and labels. Defaults to the distinct `x` values in data order. */
  xLabels?: string[];
  /** Row order and labels. Defaults to the distinct `y` values in data order. */
  yLabels?: string[];
  /** Show column labels */
  withXLabels?: boolean;
  /** Show row labels */
  withYLabels?: boolean;
  /** Which edge the column labels sit on */
  xLabelsPosition?: 'top' | 'bottom';
  /** Rotation of column labels, in degrees. Negative values lean left. */
  xLabelsRotation?: number;
  /** Height reserved for column labels; measured from the labels by default */
  xLabelsHeight?: number;
  /** Width reserved for row labels; measured from the labels by default */
  yLabelsWidth?: number;
  /** Label font size */
  fontSize?: number;
  /**
   * Colors cells interpolate between, low to high. Defaults to four shades of
   * the theme's first accent color.
   */
  colors?: string[];
  /** Value range mapped onto `colors`. Defaults to the data's min and max. */
  domain?: [number, number];
  /** Color of empty (`null` or missing) cells */
  emptyColor?: string;
  /** Cell size in px. Defaults to whatever fits the width, between 12 and 40 */
  cellSize?: number;
  /** Gap between cells, in px */
  gap?: number;
  /** Cell border radius */
  cellRadius?: number;
  /** Extra SVG attributes per cell, e.g. a fill decided by thresholds */
  getCellProps?: (cell: MatrixChartCell) => MatrixChartCellProps | undefined;
  /** Tooltip configuration; `formatter` receives the hovered cell */
  tooltip?: ChartTooltip<MatrixChartCell>;
  /** Color legend */
  legend?: MatrixChartLegend;
}
