import type { KnobGradient, KnobShading } from '../types';
import { polarToCartesian } from './geometry';

/**
 * Body outlines, built in JS rather than with an SVG `rotate()` so the *geometry* turns
 * with the value while gradients drawn over it (the lighting) stay put.
 *
 * Angles are knob angles: degrees clockwise from 12 o'clock.
 */

const fmt = (n: number) => Number(n.toFixed(3));

/** Rotates a point given in the body's local frame (pointing up, y down) by `angle`. */
const rotateLocal = (cx: number, cy: number, x: number, y: number, angle: number) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: fmt(cx + x * cos - y * sin), y: fmt(cy + x * sin + y * cos) };
};

export const buildCirclePath = (cx: number, cy: number, r: number) => {
  if (r <= 0) return '';
  return `M ${fmt(cx - r)} ${fmt(cy)} A ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx + r)} ${fmt(cy)} A ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx - r)} ${fmt(cy)} Z`;
};

export const buildPolygonPath = (cx: number, cy: number, r: number, sides: number, rotation: number) => {
  const n = Math.max(3, Math.round(sides));
  const points = Array.from({ length: n }, (_, i) => polarToCartesian(cx, cy, r, rotation + (360 / n) * i));
  return `M ${points.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join(' L ')} Z`;
};

/**
 * Scalloped outline: the rim runs at `r`, and between each pair of rim points a quadratic
 * curve dips inward by `depth`, so every flute reads as a concave finger groove.
 */
export const buildFlutedPath = (
  cx: number,
  cy: number,
  r: number,
  flutes: number,
  depth: number,
  rotation: number
) => {
  const n = Math.max(3, Math.round(flutes));
  const step = 360 / n;
  // A quadratic's midpoint sits halfway between its chord's midpoint and its control point,
  // so the control point is placed to land the curve's deepest point at `r * (1 - depth)`.
  const chordMidRadius = r * Math.cos((step / 2) * (Math.PI / 180));
  const controlRadius = 2 * r * (1 - Math.max(0, Math.min(0.4, depth))) - chordMidRadius;
  const start = polarToCartesian(cx, cy, r, rotation);
  let d = `M ${fmt(start.x)} ${fmt(start.y)}`;
  for (let i = 0; i < n; i += 1) {
    const control = polarToCartesian(cx, cy, controlRadius, rotation + step * i + step / 2);
    const end = polarToCartesian(cx, cy, r, rotation + step * (i + 1));
    d += ` Q ${fmt(control.x)} ${fmt(control.y)} ${fmt(end.x)} ${fmt(end.y)}`;
  }
  return `${d} Z`;
};

/**
 * The classic chickenhead: a tapered bar that reaches the rim at the value, swelling into
 * a hub over the center, with a short rounded tail opposite.
 */
export const buildChickenheadPath = (cx: number, cy: number, r: number, angle: number) => {
  const tipHalf = r * 0.09;
  const hub = r * 0.5;
  const tail = r * 0.66;
  const p = (x: number, y: number) => rotateLocal(cx, cy, x, y, angle);
  const pts = {
    tipL: p(-tipHalf, -r * 0.93),
    tipC: p(0, -r * 1.02),
    tipR: p(tipHalf, -r * 0.93),
    shoulderR: p(hub, -r * 0.02),
    tailCtrlR: p(hub * 1.02, tail),
    tailC: p(0, tail),
    tailCtrlL: p(-hub * 1.02, tail),
    shoulderL: p(-hub, -r * 0.02),
  };
  const pt = (k: keyof typeof pts) => `${pts[k].x} ${pts[k].y}`;
  return [
    `M ${pt('tipL')}`,
    `Q ${pt('tipC')} ${pt('tipR')}`,
    `L ${pt('shoulderR')}`,
    `Q ${pt('tailCtrlR')} ${pt('tailC')}`,
    `Q ${pt('tailCtrlL')} ${pt('shoulderL')}`,
    'Z',
  ].join(' ');
};

export type BodyShape = 'circle' | 'polygon' | 'fluted' | 'chickenhead';

export const buildBodyPath = (
  shape: BodyShape,
  cx: number,
  cy: number,
  r: number,
  options: { sides: number; fluteDepth: number; rotation: number }
) => {
  switch (shape) {
    case 'polygon':
      return buildPolygonPath(cx, cy, r, options.sides, options.rotation);
    case 'fluted':
      return buildFlutedPath(cx, cy, r, options.sides, options.fluteDepth, options.rotation);
    case 'chickenhead':
      return buildChickenheadPath(cx, cy, r, options.rotation);
    default:
      return buildCirclePath(cx, cy, r);
  }
};

/**
 * Overlay gradients for each shading preset. They are white/black at partial opacity, so
 * they light whatever color sits underneath instead of replacing it.
 */
export const getShadingGradients = (shading: KnobShading | undefined): KnobGradient[] => {
  switch (shading) {
    case 'dome':
      return [
        {
          type: 'radial',
          center: { x: 0.35, y: 0.3 },
          radius: 0.75,
          stops: [
            { offset: 0, color: '#ffffff', opacity: 0.4 },
            { offset: 0.45, color: '#ffffff', opacity: 0.06 },
            { offset: 1, color: '#000000', opacity: 0.3 },
          ],
        },
      ];
    case 'concave':
      return [
        {
          type: 'linear',
          angle: 315,
          stops: [
            { offset: 0, color: '#000000', opacity: 0.32 },
            { offset: 0.55, color: '#000000', opacity: 0.04 },
            { offset: 1, color: '#ffffff', opacity: 0.28 },
          ],
        },
      ];
    case 'matte':
      return [
        {
          type: 'linear',
          stops: [
            { offset: 0, color: '#ffffff', opacity: 0.14 },
            { offset: 1, color: '#000000', opacity: 0.2 },
          ],
        },
      ];
    case 'metal':
    case 'brushed':
      return [
        {
          type: 'linear',
          angle: 20,
          stops: [
            { offset: 0, color: '#ffffff', opacity: 0.55 },
            { offset: 0.35, color: '#000000', opacity: 0.08 },
            { offset: 0.5, color: '#ffffff', opacity: 0.3 },
            { offset: 0.7, color: '#000000', opacity: 0.18 },
            { offset: 1, color: '#000000', opacity: 0.35 },
          ],
        },
      ];
    default:
      return [];
  }
};

/** Endpoints for a linear gradient at `angle` (0° = top→bottom), as box fractions. */
export const getLinearGradientVector = (angle = 0) => {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) * 0.5;
  const dy = Math.cos(rad) * 0.5;
  return { x1: fmt(0.5 - dx), y1: fmt(0.5 - dy), x2: fmt(0.5 + dx), y2: fmt(0.5 + dy) };
};

export type GripMark =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'dot'; cx: number; cy: number };

/** Evenly spaced grip marks around the rim, turned by `rotation`. */
export const buildGripMarks = (
  style: 'knurl' | 'ridge' | 'dots',
  cx: number,
  cy: number,
  r: number,
  count: number,
  depth: number,
  rotation: number
): GripMark[] => {
  const n = Math.max(1, Math.min(360, Math.round(count)));
  const inner = r * (1 - Math.max(0.02, Math.min(0.6, depth)));
  return Array.from({ length: n }, (_, i) => {
    const angle = rotation + (360 / n) * i;
    if (style === 'dots') {
      const p = polarToCartesian(cx, cy, (r + inner) / 2, angle);
      return { kind: 'dot', cx: fmt(p.x), cy: fmt(p.y) };
    }
    const a = polarToCartesian(cx, cy, inner, angle);
    const b = polarToCartesian(cx, cy, r, angle);
    return { kind: 'line', x1: fmt(a.x), y1: fmt(a.y), x2: fmt(b.x), y2: fmt(b.y) };
  });
};
