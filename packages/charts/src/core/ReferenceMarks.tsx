import React from 'react';
import { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useChartTheme } from '../theme/ChartThemeContext';
import type {
  ChartReferenceArea,
  ChartReferenceDot,
  ChartReferenceLine,
  ChartReferenceValue,
} from '../types/base';

// Reference marks (areas / lines / dots) shared by the cartesian charts. Each
// chart renders these inside its plot Svg — areas before the series, lines and
// dots after — and hands over plot-local pixel transforms, so the marks follow
// the chart's own scales (pan/zoom, log/time axes, category bands) for free.

/**
 * Plot-local pixel transforms for the reference layers. Each maps a data
 * position to pixels inside the plot Svg (0..plotWidth / 0..plotHeight) and
 * returns NaN for a position the chart cannot place (unknown category label,
 * string on a numeric axis), which the layers skip.
 */
export interface ReferenceMarkScales {
  xToPx: (x: ChartReferenceValue) => number;
  yToPx: (y: ChartReferenceValue) => number;
  plotWidth: number;
  plotHeight: number;
  /**
   * Band width of a category x axis. Positions resolve to band centers; areas
   * grow by half a band on each side so `x1`/`x2` cover whole categories.
   */
  xBandWidth?: number;
  /** Band width of a category y axis (horizontal bars). */
  yBandWidth?: number;
}

/** Transform for a numeric axis: strings do not resolve. */
export function numericReference(scale: (value: number) => number) {
  return (value: ChartReferenceValue) => (typeof value === 'number' ? scale(value) : NaN);
}

/** Transform for a category axis: a number is the category index, a string its label. */
export function categoryReference(categories: readonly string[], scale: (index: number) => number) {
  return (value: ChartReferenceValue) => {
    const index = typeof value === 'string' ? categories.indexOf(value) : value;
    return index < 0 || index >= categories.length ? NaN : scale(index);
  };
}

const LABEL_FONT_SIZE = 11;
const LABEL_PAD = 4;
const DEFAULT_DOT_RADIUS = 5;

const finite = (value: number) => Number.isFinite(value);
// Half a pixel of slack so a mark exactly on the domain edge survives float error.
const EDGE_TOLERANCE = 0.5;
const inside = (value: number, size: number) => finite(value) && value >= -EDGE_TOLERANCE && value <= size + EDGE_TOLERANCE;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const hasPlot = (scales: ReferenceMarkScales) => scales.plotWidth > 0 && scales.plotHeight > 0;

export const ReferenceAreas: React.FC<{ areas?: ChartReferenceArea[]; scales: ReferenceMarkScales }> = ({ areas, scales }) => {
  const theme = useChartTheme();
  if (!areas?.length || !hasPlot(scales)) return null;
  const { xToPx, yToPx, plotWidth, plotHeight } = scales;
  const halfBandX = (scales.xBandWidth ?? 0) / 2;
  const halfBandY = (scales.yBandWidth ?? 0) / 2;
  return (
    <G>
      {areas.map((area, index) => {
        // A missing edge extends the area to that side of the plot.
        const px1 = area.x1 != null ? xToPx(area.x1) : 0;
        const px2 = area.x2 != null ? xToPx(area.x2) : plotWidth;
        const py1 = area.y1 != null ? yToPx(area.y1) : plotHeight;
        const py2 = area.y2 != null ? yToPx(area.y2) : 0;
        if (![px1, px2, py1, py2].every(finite)) return null;
        const left = clamp(Math.min(px1, px2) - halfBandX, 0, plotWidth);
        const right = clamp(Math.max(px1, px2) + halfBandX, 0, plotWidth);
        const top = clamp(Math.min(py1, py2) - halfBandY, 0, plotHeight);
        const bottom = clamp(Math.max(py1, py2) + halfBandY, 0, plotHeight);
        if (right - left <= 0 || bottom - top <= 0) return null;
        const color = area.color || theme.colors.accentPalette[0];
        return (
          <React.Fragment key={`reference-area-${index}`}>
            <Rect x={left} y={top} width={right - left} height={bottom - top} fill={color} fillOpacity={area.opacity ?? 0.12} />
            {area.label ? (
              <SvgText
                x={left + LABEL_PAD}
                y={top + LABEL_PAD + LABEL_FONT_SIZE}
                fill={theme.colors.textSecondary}
                fontSize={LABEL_FONT_SIZE}
              >
                {area.label}
              </SvgText>
            ) : null}
          </React.Fragment>
        );
      })}
    </G>
  );
};

export const ReferenceLines: React.FC<{ lines?: ChartReferenceLine[]; scales: ReferenceMarkScales }> = ({ lines, scales }) => {
  const theme = useChartTheme();
  if (!lines?.length || !hasPlot(scales)) return null;
  const { xToPx, yToPx, plotWidth, plotHeight } = scales;
  return (
    <G>
      {lines.map((line, index) => {
        const color = line.color || theme.colors.textSecondary;
        const strokeWidth = line.strokeWidth ?? 1;
        const strokeDasharray = line.dashed ? '4 4' : undefined;
        const nodes: React.ReactNode[] = [];
        if (line.x != null) {
          const px = xToPx(line.x);
          if (inside(px, plotWidth)) {
            nodes.push(<Line key="x" x1={px} x2={px} y1={0} y2={plotHeight} stroke={color} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />);
            if (line.label) {
              // Keep the label inside the plot: flip to the left of the line near the right edge.
              const flip = px > plotWidth * 0.75;
              nodes.push(
                <SvgText key="x-label" x={flip ? px - LABEL_PAD : px + LABEL_PAD} y={LABEL_PAD + LABEL_FONT_SIZE} fill={theme.colors.textSecondary} fontSize={LABEL_FONT_SIZE} textAnchor={flip ? 'end' : 'start'}>
                  {line.label}
                </SvgText>
              );
            }
          }
        }
        if (line.y != null) {
          const py = yToPx(line.y);
          if (inside(py, plotHeight)) {
            nodes.push(<Line key="y" x1={0} x2={plotWidth} y1={py} y2={py} stroke={color} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />);
            if (line.label) {
              // Sit above the line, or below it when the line hugs the top of the plot.
              const below = py < LABEL_FONT_SIZE + LABEL_PAD * 2;
              nodes.push(
                <SvgText key="y-label" x={plotWidth - LABEL_PAD} y={below ? py + LABEL_PAD + LABEL_FONT_SIZE : py - LABEL_PAD} fill={theme.colors.textSecondary} fontSize={LABEL_FONT_SIZE} textAnchor="end">
                  {line.label}
                </SvgText>
              );
            }
          }
        }
        return nodes.length ? <React.Fragment key={`reference-line-${index}`}>{nodes}</React.Fragment> : null;
      })}
    </G>
  );
};

export const ReferenceDots: React.FC<{ dots?: ChartReferenceDot[]; scales: ReferenceMarkScales }> = ({ dots, scales }) => {
  const theme = useChartTheme();
  if (!dots?.length || !hasPlot(scales)) return null;
  const { xToPx, yToPx, plotWidth, plotHeight } = scales;
  return (
    <G>
      {dots.map((dot, index) => {
        const cx = xToPx(dot.x);
        const cy = yToPx(dot.y);
        if (!inside(cx, plotWidth) || !inside(cy, plotHeight)) return null;
        const r = dot.r ?? DEFAULT_DOT_RADIUS;
        const color = dot.color || theme.colors.accentPalette[0];
        const labelAbove = cy - r - LABEL_PAD >= LABEL_FONT_SIZE;
        return (
          <React.Fragment key={`reference-dot-${index}`}>
            <Circle cx={cx} cy={cy} r={r} fill={color} stroke={theme.colors.background} strokeWidth={2} />
            {dot.label ? (
              <SvgText
                x={cx}
                y={labelAbove ? cy - r - LABEL_PAD : cy + r + LABEL_PAD + LABEL_FONT_SIZE}
                fill={theme.colors.textSecondary}
                fontSize={LABEL_FONT_SIZE}
                textAnchor="middle"
              >
                {dot.label}
              </SvgText>
            ) : null}
          </React.Fragment>
        );
      })}
    </G>
  );
};

ReferenceAreas.displayName = 'ReferenceAreas';
ReferenceLines.displayName = 'ReferenceLines';
ReferenceDots.displayName = 'ReferenceDots';
