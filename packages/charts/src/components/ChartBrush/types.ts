import type { ChartAutoSizeProps } from '../../core/autoSize';

/** One series drawn in the brush's miniature preview. */
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

/**
 * Props for the standalone {@link ChartBrush}: a strip with a miniature of the
 * data and a draggable window selecting an x range.
 *
 * The range is always `[start, end]` in data units. With `band` set the units are
 * category indices and both ends are inclusive (`[2, 5]` selects the third to sixth
 * categories); otherwise they are x values on a continuous axis.
 */
export interface ChartBrushProps extends ChartAutoSizeProps {
  /** Full extent the brush spans. Defaults to the x extent of `series` (or `[0, 1]`). */
  domain?: [number, number];
  /** Controlled selected range */
  value?: [number, number];
  /** Initial selected range when uncontrolled. Defaults to the whole `domain`. */
  defaultValue?: [number, number];
  /** Called with every new range — on each drag sample and each key press */
  onChange?: (range: [number, number]) => void;
  /** Called once a drag ends or after a keyboard step */
  onChangeEnd?: (range: [number, number]) => void;
  /** Series drawn in the miniature preview */
  series?: ChartBrushSeries[];
  /** Default preview drawing for series without a `type`. Default `'area'`. */
  previewType?: 'line' | 'area' | 'bar';
  /** Scale every preview series to its own y extent instead of a shared one (dual-axis data) */
  normalizeSeries?: boolean;
  /**
   * Treat the domain as category indices: values are whole indices, both ends
   * inclusive, and each index owns an equal band of the strip.
   */
  band?: boolean;
  /** Strip width in px. Omit to fill the available width. */
  w?: number;
  /** Strip height in px. Default 40. */
  h?: number;
  /** Keyboard step (Shift+Arrow and PageUp/PageDown move ten steps). Default: 1 with `band`, else 1% of the domain. */
  step?: number;
  /** Round dragged values to multiples of `step` from the domain start. Always on with `band`. */
  snap?: boolean;
  /** Smallest selectable span. Default: one `step` (a single category with `band`). */
  minSpan?: number;
  /** Width of the two drag handles in px. Default 8. */
  travellerWidth?: number;
  /** Fill of the selected window, drawn as given (pass a translucent color). Default: the first palette color at 12% opacity. */
  fill?: string;
  /** Color of the window outline and handles. Default: the theme's secondary text color. */
  stroke?: string;
  /** Formats a value for the handles' `aria-valuetext` */
  formatValue?: (value: number) => string;
  /** Accessible name of the start handle. Default "Range start". */
  startLabel?: string;
  /** Accessible name of the end handle. Default "Range end". */
  endLabel?: string;
  /** Ignore pointer and keyboard input */
  disabled?: boolean;
  /** Test ID of the strip; the handles get `-start` / `-end` and the window `-window` suffixes */
  testID?: string;
  /** Style of the outer View */
  style?: any;
}

/** `brushProps` on the cartesian charts. */
export interface ChartBrushConfig {
  /** Strip height in px. Default 40. The strip is carved out of `h`, never added to it. */
  height?: number;
  /**
   * Initial window start when the range is uncontrolled: an x value on Line, Area,
   * StackedArea and Combo charts, a category index on BarChart. Defaults to the
   * start of the data.
   */
  start?: number;
  /** Initial window end (inclusive category index on BarChart). Defaults to the end of the data. */
  end?: number;
  /** Called with every new range, like `onBrushChange` */
  onChange?: (range: [number, number]) => void;
  /** Width of the two drag handles in px. Default 8. */
  travellerWidth?: number;
  /** Fill of the selected window, drawn as given (pass a translucent color) */
  fill?: string;
  /** Color of the window outline and handles */
  stroke?: string;
  /** Series (by `id` or `name`) drawn in the miniature. Default: every visible series. */
  series?: string[];
  /** Keyboard step in range units. Default: the smallest gap between x values (1 on BarChart). */
  step?: number;
  /** Formats a value for the handles' `aria-valuetext`. Default: the chart's x-axis formatter. */
  formatValue?: (value: number) => string;
}

/**
 * Brush props shared by LineChart, AreaChart, StackedAreaChart, BarChart and
 * ComboChart. The range is `[start, end]`: x values for numeric/time x axes,
 * inclusive category indices for BarChart.
 */
export interface ChartBrushChartProps {
  /** Draw a brush strip under the x axis; the plot shows only the selected range */
  withBrush?: boolean;
  /** Brush customization */
  brushProps?: ChartBrushConfig;
  /**
   * Controlled visible x range. Drives the plot whether or not the built-in strip is
   * shown, so an external `ChartBrush` (or any control) can drive it. Pair with
   * `onBrushChange`; every range change — brush drag, keys, pan/zoom — is reported
   * there and not applied until the prop changes.
   */
  brushRange?: [number, number];
  /** Called with every new range, controlled or not */
  onBrushChange?: (range: [number, number]) => void;
}
