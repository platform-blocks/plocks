import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import {
  ChartContainer,
  ChartLegend,
  ChartTitle,
  estimateChartTextWidth,
  measureChartLegendBand,
  measureChartTitleBand,
  resolveChartLegendPosition,
} from '../../ChartBase';
import { AngularSliceHitTester } from '../../core/hittest/angular';
import type { HitSeries, Mark } from '../../core/hittest/types';
import { useActiveTarget, useOptionalChartInteraction } from '../../interaction/ChartInteractionContext';
import { useChartPointer } from '../../interaction/useChartPointer';
import { useChartTheme } from '../../theme/ChartThemeContext';
import type { ChartInteractionEvent } from '../../types';
import { formatPercentage } from '../../utils';
import { interpolateColor, parseColor } from '../../utils/colorScale';
import type { SunburstChartProps, SunburstChartSegment, SunburstNode } from './types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const DEG = Math.PI / 180;
const EPSILON = 1e-6;
/** Each ring out blends this much further toward the chart background. */
const DEPTH_TINT = 0.24;
/** Opacity of segments off the hovered path. */
const DIM_OPACITY = 0.3;
const INTRO_MS = 700;
const ZOOM_MS = 450;
/** Space kept between a label and the edges of its segment, in px. */
const LABEL_INSET = 3;
/** Outer margin around the rings, in px. */
const PAD = 8;
/** Smallest center hole when `zoomOnClick` needs somewhere to press. */
const ZOOM_MIN_HOLE = 0.15;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Annular sector between two canonical angles (0° at 12 o'clock, clockwise), as an
 * SVG path. A sweep of a full turn is stitched from two halves, since an arc whose
 * ends coincide draws nothing; its hole becomes a counter-wound sub-path.
 */
export const sunburstArcPath = (
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string => {
  'worklet';
  const sweep = endAngle - startAngle;
  if (!(outerRadius > EPSILON) || !(sweep > EPSILON)) return '';
  const x = (r: number, a: number) => cx + r * Math.sin(a * DEG);
  const y = (r: number, a: number) => cy - r * Math.cos(a * DEG);

  if (sweep >= 360 - 0.01) {
    const mid = startAngle + 180;
    let d = `M ${x(outerRadius, startAngle)} ${y(outerRadius, startAngle)} `
      + `A ${outerRadius} ${outerRadius} 0 0 1 ${x(outerRadius, mid)} ${y(outerRadius, mid)} `
      + `A ${outerRadius} ${outerRadius} 0 0 1 ${x(outerRadius, startAngle)} ${y(outerRadius, startAngle)} Z`;
    if (innerRadius > EPSILON) {
      d += ` M ${x(innerRadius, startAngle)} ${y(innerRadius, startAngle)} `
        + `A ${innerRadius} ${innerRadius} 0 0 0 ${x(innerRadius, mid)} ${y(innerRadius, mid)} `
        + `A ${innerRadius} ${innerRadius} 0 0 0 ${x(innerRadius, startAngle)} ${y(innerRadius, startAngle)} Z`;
    }
    return d;
  }

  const large = sweep > 180 ? 1 : 0;
  let d = `M ${x(outerRadius, startAngle)} ${y(outerRadius, startAngle)} `
    + `A ${outerRadius} ${outerRadius} 0 ${large} 1 ${x(outerRadius, endAngle)} ${y(outerRadius, endAngle)} `;
  if (innerRadius > EPSILON) {
    d += `L ${x(innerRadius, endAngle)} ${y(innerRadius, endAngle)} `
      + `A ${innerRadius} ${innerRadius} 0 ${large} 0 ${x(innerRadius, startAngle)} ${y(innerRadius, startAngle)} `;
  } else {
    d += `L ${cx} ${cy} `;
  }
  return `${d}Z`;
};

const DARK_LABEL = '#1f2937';
const LIGHT_LABEL = '#ffffff';

/** Dark or white text, whichever has the higher WCAG contrast on `fill`. */
const readableOn = (fill: string): string => {
  const rgb = parseColor(fill);
  if (!rgb) return LIGHT_LABEL;
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  // #1f2937 has a relative luminance of about 0.0185.
  return (luminance + 0.05) / (0.0185 + 0.05) > 1.05 / (luminance + 0.05) ? DARK_LABEL : LIGHT_LABEL;
};

const defaultValueFormatter = (value: number) => {
  try {
    return Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  } catch {
    return String(value);
  }
};

/** A share as a percentage, with a decimal only when whole percents would read as 0. */
const formatShare = (value: number, total: number) =>
  formatPercentage(value, total, total > 0 && value / total < 0.095 ? 1 : 0);

// --- Hierarchy ---------------------------------------------------------------

interface TreeNode {
  key: string;
  node: SunburstNode;
  value: number;
  color: string;
  depth: number;
  parent: TreeNode | null;
  children: TreeNode[];
  /** Deepest descendant level below this node (0 for a leaf) */
  height: number;
  path: SunburstNode[];
}

const positive = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

/**
 * Resolve values bottom-up (a parent without a value sums its children) and colors
 * top-down (each top-level branch takes a palette slot; descendants tint their
 * parent's color toward the background). Nodes that resolve to zero are dropped.
 */
function buildTree(data: SunburstNode[], palette: string[], background: string): TreeNode {
  const root: TreeNode = {
    key: '',
    node: { name: '' },
    value: 0,
    color: background,
    depth: 0,
    parent: null,
    children: [],
    height: 0,
    path: [],
  };

  const resolve = (node: SunburstNode, parent: TreeNode, index: number): TreeNode | null => {
    const depth = parent.depth + 1;
    const color = node.color
      ?? (depth === 1
        ? palette[index % Math.max(palette.length, 1)] ?? '#888888'
        : interpolateColor(parent.color, background, DEPTH_TINT));
    const self: TreeNode = {
      key: parent.key ? `${parent.key}/${index}` : String(index),
      node,
      value: 0,
      color,
      depth,
      parent,
      children: [],
      height: 0,
      path: [...parent.path, node],
    };
    (node.children ?? []).forEach((child, i) => {
      if (!child) return;
      const resolved = resolve(child, self, i);
      if (resolved) self.children.push(resolved);
    });
    const childSum = self.children.reduce((sum, child) => sum + child.value, 0);
    self.value = Math.max(positive(node.value), childSum);
    self.height = self.children.reduce((max, child) => Math.max(max, child.height + 1), 0);
    return self.value > 0 ? self : null;
  };

  (data ?? []).forEach((node, i) => {
    if (!node) return;
    const resolved = resolve(node, root, i);
    if (resolved) root.children.push(resolved);
  });
  root.value = root.children.reduce((sum, child) => sum + child.value, 0);
  root.height = root.children.reduce((max, child) => Math.max(max, child.height + 1), 0);
  return root;
}

const toSegment = (tree: TreeNode, total: number): SunburstChartSegment => {
  const parentValue = tree.parent?.value ?? total;
  return {
    key: tree.key,
    name: tree.node.name,
    value: tree.value,
    color: tree.color,
    depth: tree.depth,
    node: tree.node,
    path: tree.path,
    parentValue,
    total,
    shareOfParent: parentValue > 0 ? tree.value / parentValue : 0,
    shareOfTotal: total > 0 ? tree.value / total : 0,
    hasChildren: tree.children.length > 0,
    data: tree.node.data,
  };
};

// --- Layout -------------------------------------------------------------------

interface PlacedSegment {
  tree: TreeNode;
  segment: SunburstChartSegment;
  /** Drawn sweep, canonical degrees, after `padAngle` */
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

interface LabelPlacement {
  key: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
}

/**
 * Where a label goes inside a segment, or null when it does not fit. Straight text
 * either runs along the tangent (across the arc) or along the radius, whichever
 * fits and reads closer to level. Rotation keeps the text upright.
 */
function placeLabel(
  text: string,
  fontSize: number,
  cx: number,
  cy: number,
  seg: Pick<PlacedSegment, 'startAngle' | 'endAngle' | 'innerRadius' | 'outerRadius'>,
): { x: number; y: number; rotation: number } | null {
  const sweep = seg.endAngle - seg.startAngle;
  if (!text || sweep <= 0) return null;
  const r0 = seg.innerRadius;
  const r1 = seg.outerRadius;
  const thickness = r1 - r0;
  const midR = (r0 + r1) / 2;
  const sweepRad = Math.min(sweep, 360) * DEG;
  const width = estimateChartTextWidth(text, fontSize);
  const halfH = fontSize / 2;

  const fitsTangential = () => {
    if (fontSize + LABEL_INSET * 2 > thickness) return false;
    // The text's outer corners stay inside the outer arc…
    if (Math.hypot(midR + halfH, width / 2) > r1 - LABEL_INSET / 2) return false;
    // …and its ends stay inside the segment's sweep.
    if (sweep >= 360 - 0.01) return true;
    return 2 * Math.atan2(width / 2 + LABEL_INSET, Math.max(midR - halfH, EPSILON)) <= sweepRad;
  };
  const fitsRadial = () => {
    if (width + LABEL_INSET * 2 > thickness) return false;
    const nearEnd = Math.max(midR - width / 2, EPSILON);
    return 2 * Math.atan2(halfH + LABEL_INSET / 2, nearEnd) <= sweepRad;
  };

  const theta = (((seg.startAngle + seg.endAngle) / 2) % 360 + 360) % 360;
  // Both rotations keep the text upright. Tangential text is level at 12 and 6
  // o'clock and flips across the bottom half; radial text is level at 3 and 9
  // o'clock, reading outward on the right and inward on the left.
  const rotations = {
    tangential: theta > 90 && theta < 270 ? theta - 180 : theta >= 270 ? theta - 360 : theta,
    radial: theta <= 180 ? theta - 90 : theta - 270,
  };
  // Whichever orientation sits nearer to level is tried first.
  const order: Array<'tangential' | 'radial'> =
    Math.abs(rotations.tangential) <= Math.abs(rotations.radial) ? ['tangential', 'radial'] : ['radial', 'tangential'];
  const orientation = order.find((o) => (o === 'tangential' ? fitsTangential() : fitsRadial()));
  if (!orientation) return null;

  const x = cx + midR * Math.sin(theta * DEG);
  const y = cy - midR * Math.cos(theta * DEG);
  const rotation = rotations[orientation];
  return { x, y, rotation };
}

// --- Segment ------------------------------------------------------------------

interface AnimatedSegmentProps {
  cx: number;
  cy: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  intro: SharedValue<number>;
  animate: boolean;
  testID?: string;
}

/** One segment. Geometry changes (a zoom) tween; a segment that mounts after the intro fades in. */
const AnimatedSegment: React.FC<AnimatedSegmentProps> = React.memo(
  ({ cx, cy, startAngle, endAngle, innerRadius, outerRadius, fill, stroke, strokeWidth, opacity, intro, animate, testID }) => {
    const start = useSharedValue(startAngle);
    const end = useSharedValue(endAngle);
    const inner = useSharedValue(innerRadius);
    const outer = useSharedValue(outerRadius);
    const appear = useSharedValue(1);
    const mounted = useRef(false);

    useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        if (animate && intro.value >= 1) {
          appear.value = 0;
          appear.value = withTiming(1, { duration: ZOOM_MS, easing: Easing.out(Easing.cubic) });
        }
        return;
      }
      if (!animate) {
        start.value = startAngle;
        end.value = endAngle;
        inner.value = innerRadius;
        outer.value = outerRadius;
        return;
      }
      const config = { duration: ZOOM_MS, easing: Easing.inOut(Easing.cubic) };
      start.value = withTiming(startAngle, config);
      end.value = withTiming(endAngle, config);
      inner.value = withTiming(innerRadius, config);
      outer.value = withTiming(outerRadius, config);
    }, [startAngle, endAngle, innerRadius, outerRadius, animate, start, end, inner, outer, appear, intro]);

    const animatedProps = useAnimatedProps(() => {
      // The intro unfurls every ring clockwise from 12 o'clock.
      const p = intro.value;
      return {
        d: sunburstArcPath(cx, cy, inner.value, outer.value, start.value * p, end.value * p),
        fillOpacity: appear.value,
        strokeOpacity: appear.value,
      } as any;
    }, [cx, cy]);

    // Without animation the geometry is static: a plain path, redrawn by React.
    if (!animate) {
      return (
        <Path
          testID={testID}
          d={sunburstArcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
          opacity={opacity}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    }

    return (
      <AnimatedPath
        testID={testID}
        animatedProps={animatedProps}
        opacity={opacity}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }
);

AnimatedSegment.displayName = 'SunburstChart.Segment';

// --- Plot ---------------------------------------------------------------------

interface SunburstPlotProps {
  tree: TreeNode;
  width: number;
  height: number;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRatio: number;
  ringGap: number;
  padAngle: number;
  stroke: string;
  strokeWidth: number;
  maxDepth?: number;
  withLabels: boolean;
  labelColor?: string;
  labelFontSize: number;
  zoomOnClick: boolean;
  animate: boolean;
  interactive: boolean;
  formatValue: (value: number) => string;
  tooltip: SunburstChartProps['tooltip'];
  onSegmentPress: SunburstChartProps['onSegmentPress'];
  onDataPointPress: SunburstChartProps['onDataPointPress'];
  onPress: SunburstChartProps['onPress'];
}

/**
 * Rings, labels and the gesture surface. Rendered inside ChartContainer so its
 * interaction hooks see the container's provider even when the chart stands alone.
 */
const SunburstPlot: React.FC<SunburstPlotProps> = ({
  tree,
  width,
  height,
  cx,
  cy,
  outerRadius,
  innerRatio,
  ringGap,
  padAngle,
  stroke,
  strokeWidth,
  maxDepth,
  withLabels,
  labelColor,
  labelFontSize,
  zoomOnClick,
  animate,
  interactive,
  formatValue,
  tooltip,
  onSegmentPress,
  onDataPointPress,
  onPress,
}) => {
  const seriesId = `sunburst${useId()}`;
  const interaction = useOptionalChartInteraction();
  const register = interaction?.register;

  const byKey = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const walk = (node: TreeNode) => {
      map.set(node.key, node);
      node.children.forEach(walk);
    };
    walk(tree);
    return map;
  }, [tree]);

  const [focusKey, setFocusKey] = useState('');
  const focus = (zoomOnClick ? byKey.get(focusKey) : undefined) ?? tree;
  const zoomed = focus !== tree;

  // --- Geometry ---
  const hole = zoomOnClick ? Math.max(innerRatio, ZOOM_MIN_HOLE) : innerRatio;
  const innerRadius = outerRadius * clamp(hole, 0, 0.9);
  const levels = Math.max(0, Math.min(maxDepth != null && maxDepth > 0 ? Math.floor(maxDepth) : Infinity, focus.height));
  const thickness = levels > 0 ? Math.max(0, (outerRadius - innerRadius - ringGap * (levels - 1)) / levels) : 0;

  const placed = useMemo<PlacedSegment[]>(() => {
    const out: PlacedSegment[] = [];
    const total = tree.value;
    const place = (node: TreeNode, start: number, sweep: number, ring: number) => {
      if (ring > levels) return;
      const half = sweep >= 360 - 0.01 ? 0 : Math.min(Math.max(padAngle, 0) / 2, sweep / 4);
      const r0 = innerRadius + (ring - 1) * (thickness + ringGap);
      out.push({
        tree: node,
        segment: toSegment(node, total),
        startAngle: start + half,
        endAngle: start + sweep - half,
        innerRadius: r0,
        outerRadius: r0 + thickness,
      });
      let cursor = start;
      node.children.forEach((child) => {
        const childSweep = node.value > 0 ? (sweep * child.value) / node.value : 0;
        place(child, cursor, childSweep, ring + 1);
        cursor += childSweep;
      });
    };
    let cursor = 0;
    focus.children.forEach((child) => {
      const sweep = focus.value > 0 ? (360 * child.value) / focus.value : 0;
      place(child, cursor, sweep, 1);
      cursor += sweep;
    });
    return out;
  }, [tree, focus, levels, innerRadius, thickness, ringGap, padAngle]);

  // --- Interaction ---
  const tooltipFormatter = tooltip?.formatter;
  const hitSeries = useMemo<HitSeries[]>(() => {
    const marks: Mark[] = placed.map((p) => {
      const midAngle = ((p.startAngle + p.endAngle) / 2) * DEG;
      const midR = (p.innerRadius + p.outerRadius) / 2;
      const { segment } = p;
      const pathLabel = segment.path.map((n) => n.name).join(' › ');
      const parentName = segment.depth > 1 ? segment.path[segment.depth - 2]?.name : null;
      const details = [
        formatValue(segment.value),
        parentName ? `${formatShare(segment.value, segment.parentValue)} of ${parentName}` : null,
        `${formatShare(segment.value, segment.total)} of total`,
      ].filter(Boolean).join(' · ');
      const custom = tooltipFormatter?.(segment);
      return {
        id: segment.key,
        pixel: { x: cx + midR * Math.sin(midAngle), y: cy - midR * Math.cos(midAngle) },
        value: segment.value,
        datum: segment,
        label: pathLabel,
        color: segment.color,
        extent: {
          slice: {
            startAngle: p.startAngle,
            endAngle: p.endAngle,
            innerRadius: p.innerRadius,
            outerRadius: p.outerRadius,
          },
        },
        formattedValue: typeof custom === 'string' ? custom : details,
        // The path is the row's label; by default the numbers sit on their own line
        // beneath it. A string from `tooltip.formatter` takes the usual `label: value` row.
        ...(typeof custom === 'string' ? {} : { customTooltip: custom ?? details }),
      };
    });
    return [{ id: seriesId, name: 'Sunburst', visible: true, marks }];
  }, [placed, cx, cy, formatValue, tooltipFormatter, seriesId]);

  const tester = useMemo(() => new AngularSliceHitTester(cx, cy, hitSeries), [cx, cy, hitSeries]);

  useEffect(() => {
    if (!register) return;
    register(seriesId, { frame: { kind: 'polar', cx, cy } as any, geometry: { kind: 'slice', cx, cy }, series: hitSeries });
    return () => register(seriesId, null);
  }, [register, seriesId, hitSeries, cx, cy]);

  const { handlers, ref: surfaceRef, onLayout: surfaceOnLayout } = useChartPointer({
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    plotWidth: width,
    plotHeight: height,
    enabled: interactive && Boolean(interaction),
    hover: true,
    press: true,
    tester,
    onPress: (e, target) => {
      if (!target) {
        if (zoomed && Math.hypot(e.containerX - cx, e.containerY - cy) <= innerRadius) {
          setFocusKey(focus.parent?.key ?? '');
        }
        return;
      }
      const segment = target.datum as SunburstChartSegment;
      const event: ChartInteractionEvent<SunburstChartSegment> = {
        nativeEvent: e.raw,
        chartX: width > 0 ? e.containerX / width : 0,
        chartY: height > 0 ? e.containerY / height : 0,
        dataY: segment.value,
        dataPoint: segment,
        distance: target.distance,
      };
      onSegmentPress?.(segment.node, segment.path);
      onDataPointPress?.(segment, event);
      onPress?.(event);
      if (zoomOnClick && segment.hasChildren) setFocusKey(segment.key);
    },
  });

  // Hovering a segment keeps it and its ancestors lit and dims the rest.
  const { activeTarget } = useActiveTarget();
  const activeKey = activeTarget?.seriesId === seriesId ? (activeTarget.datum as SunburstChartSegment | undefined)?.key : undefined;
  const lit = useMemo(() => {
    if (activeKey == null) return null;
    const set = new Set<string>();
    for (let node = byKey.get(activeKey); node && node.depth > 0; node = node.parent ?? undefined) set.add(node.key);
    return set;
  }, [activeKey, byKey]);

  // --- Animation ---
  const intro = useSharedValue(animate ? 0 : 1);
  const labelAlpha = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) {
      intro.value = 1;
      return;
    }
    intro.value = withTiming(1, { duration: INTRO_MS, easing: Easing.out(Easing.cubic) });
  }, [animate, intro]);
  // Labels sit at their final spots, so they wait out the intro and every zoom.
  useEffect(() => {
    if (!animate) {
      labelAlpha.value = 1;
      return;
    }
    labelAlpha.value = 0;
    labelAlpha.value = withDelay(intro.value >= 1 ? ZOOM_MS * 0.8 : INTRO_MS * 0.8, withTiming(1, { duration: 250 }));
  }, [animate, focus, labelAlpha, intro]);
  const labelProps = useAnimatedProps(() => ({ opacity: labelAlpha.value }) as any);

  // --- Labels ---
  const labels = useMemo<LabelPlacement[]>(() => {
    if (!withLabels) return [];
    const out: LabelPlacement[] = [];
    placed.forEach((p) => {
      const spot = placeLabel(p.segment.name, labelFontSize, cx, cy, p);
      if (spot) out.push({ key: p.segment.key, text: p.segment.name, ...spot, color: labelColor ?? readableOn(p.segment.color) });
    });
    return out;
  }, [withLabels, placed, labelFontSize, cx, cy, labelColor]);

  const centerRadius = Math.max(0, innerRadius - Math.max(ringGap, strokeWidth, 1));
  const centerLabelFits = zoomed && estimateChartTextWidth(focus.node.name, labelFontSize + 1) <= centerRadius * 2 - LABEL_INSET * 2;

  return (
    <>
      <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        {zoomed && centerRadius > 0 && (
          <G testID="sunburst-center">
            <Circle cx={cx} cy={cy} r={centerRadius} fill={focus.color} stroke={stroke} strokeWidth={strokeWidth} />
            {centerLabelFits && (
              <SvgText
                x={cx}
                y={cy + (labelFontSize + 1) * 0.35}
                fill={labelColor ?? readableOn(focus.color)}
                fontSize={labelFontSize + 1}
                fontWeight="600"
                textAnchor="middle"
              >
                {focus.node.name}
              </SvgText>
            )}
          </G>
        )}
        <G>
          {placed.map((p) => (
            <AnimatedSegment
              key={p.segment.key}
              testID={`sunburst-segment-${p.segment.key}`}
              cx={cx}
              cy={cy}
              startAngle={p.startAngle}
              endAngle={p.endAngle}
              innerRadius={p.innerRadius}
              outerRadius={p.outerRadius}
              fill={p.segment.color}
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={lit && !lit.has(p.segment.key) ? DIM_OPACITY : 1}
              intro={intro}
              animate={animate}
            />
          ))}
        </G>
        {labels.length > 0 && (
          <AnimatedG animatedProps={labelProps}>
            {labels.map((label) => (
              <SvgText
                key={label.key}
                testID={`sunburst-label-${label.key}`}
                x={0}
                y={labelFontSize * 0.35}
                transform={`translate(${label.x} ${label.y}) rotate(${label.rotation})`}
                fill={label.color}
                fontSize={labelFontSize}
                fontWeight="500"
                textAnchor="middle"
                opacity={lit && !lit.has(label.key) ? DIM_OPACITY : 1}
              >
                {label.text}
              </SvgText>
            ))}
          </AnimatedG>
        )}
      </Svg>
      {interactive && Boolean(interaction) && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          testID="sunburst-gesture-surface"
          style={{ position: 'absolute', left: 0, top: 0, width, height }}
          {...handlers}
        />
      )}
    </>
  );
};

// --- Chart --------------------------------------------------------------------

export const SunburstChart: React.FC<SunburstChartProps> = (props) => {
  const {
    data,
    w: width = 360,
    h: height = 360,
    title,
    subtitle,
    innerRadius = 0.2,
    ringGap = 0,
    padAngle = 0,
    strokeColor,
    strokeWidth = 1,
    maxDepth,
    withLabels = true,
    labelColor,
    labelFontSize,
    zoomOnClick = false,
    onSegmentPress,
    valueFormatter,
    legend,
    tooltip,
    disableAnimation = false,
    disabled = false,
    accessibilityLabel,
    style,
    onPress,
    onDataPointPress,
    ...rest
  } = props;

  const theme = useChartTheme();
  const tree = useMemo(
    () => buildTree(data, theme.colors.accentPalette, theme.colors.background),
    [data, theme.colors.accentPalette, theme.colors.background]
  );

  // --- Layout: a square plot centered in whatever the title and legend leave ---
  const legendShown = legend?.show === true && tree.children.length > 0;
  const legendItems = useMemo(
    () => legend?.items ?? tree.children.map((child) => ({ label: child.node.name, color: child.color })),
    [legend?.items, tree]
  );
  const legendPosition = resolveChartLegendPosition(legend?.position, width);
  const legendBand = measureChartLegendBand({
    items: legendShown ? legendItems : undefined,
    containerWidth: width,
    position: legendPosition,
    fontSize: legend?.fontSize,
  });
  const titleBand = measureChartTitleBand(title, subtitle, { containerWidth: width });
  const plotLeft = PAD + legendBand.left;
  const plotTop = Math.max(PAD, titleBand) + legendBand.top;
  const availableWidth = Math.max(0, width - plotLeft - PAD - legendBand.right);
  const availableHeight = Math.max(0, height - plotTop - PAD - legendBand.bottom);
  const cx = plotLeft + availableWidth / 2;
  const cy = plotTop + availableHeight / 2;
  const outerRadius = Math.max(0, Math.min(availableWidth, availableHeight) / 2 - strokeWidth / 2);

  const formatValue = valueFormatter ?? defaultValueFormatter;

  const summary = useMemo(() => {
    if (tree.children.length === 0) return 'No data';
    return tree.children.map((child) => `${child.node.name} ${formatShare(child.value, tree.value)}`).join(', ');
  }, [tree]);

  return (
    <ChartContainer
      {...rest}
      w={width}
      h={height}
      style={style}
      disabled={disabled}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? summary}
      interactionConfig={{ multiTooltip: false, liveTooltip: tooltip?.show !== false }}
    >
      {(title || subtitle) && <ChartTitle title={title} subtitle={subtitle} />}
      <SunburstPlot
        tree={tree}
        width={width}
        height={height}
        cx={cx}
        cy={cy}
        outerRadius={outerRadius}
        innerRatio={innerRadius}
        ringGap={Math.max(0, ringGap)}
        padAngle={padAngle}
        stroke={strokeColor ?? theme.colors.background}
        strokeWidth={strokeWidth}
        maxDepth={maxDepth}
        withLabels={withLabels}
        labelColor={labelColor}
        labelFontSize={labelFontSize ?? theme.fontSize.xs + 1}
        zoomOnClick={zoomOnClick}
        animate={!disableAnimation && !disabled}
        interactive={!disabled}
        formatValue={formatValue}
        tooltip={tooltip}
        onSegmentPress={onSegmentPress}
        onDataPointPress={onDataPointPress}
        onPress={onPress}
      />
      {legendShown && (
        <ChartLegend
          items={legendItems}
          position={legendPosition}
          align={legend?.align}
          textColor={legend?.textColor}
          fontSize={legend?.fontSize}
          style={
            legendPosition === 'left' || legendPosition === 'right'
              ? { maxWidth: legendBand[legendPosition], top: titleBand }
              : { maxHeight: legendBand[legendPosition], ...(legendPosition === 'top' ? { top: titleBand } : null) }
          }
        />
      )}
    </ChartContainer>
  );
};

SunburstChart.displayName = 'SunburstChart';

export default SunburstChart;
