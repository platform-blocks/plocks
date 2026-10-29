import React, { useId, useMemo } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import type { KnobGradient } from '../types';
import type { ResolvedBodyDisc, ResolvedBodyStyle } from '../appearance';
import type { LayoutState } from '../hooks/useKnobGeometry';
import { knobStyles as styles } from '../styles';
import {
  buildBodyPath,
  buildCirclePath,
  buildGripMarks,
  getLinearGradientVector,
  getShadingGradients,
} from '../utils/body';

export type BodyLayerProps = {
  layoutState: LayoutState;
  body: ResolvedBodyStyle | null;
  /** Radius of the body outline (the skirt and cap scale off it). */
  bodyRadius: number;
  /** The knob's current angle; the body turns to it when `body.rotates` is on. */
  displayAngle: number;
};

/** Layers a soft shadow is faked with — react-native-svg has no portable blur filter. */
const SHADOW_STEPS = 5;
/** Concentric rings drawn for the `brushed` finish. */
const BRUSHED_RINGS = 14;

type Box = { cx: number; cy: number; r: number };

/**
 * Gradients use absolute (`userSpaceOnUse`) coordinates over the shape's bounding circle,
 * so a body that rotates keeps its lighting fixed instead of dragging the highlight around.
 */
const renderGradient = (id: string, gradient: KnobGradient, box: Box) => {
  const stops = gradient.stops.map((stop, index) => (
    <Stop
      key={index}
      offset={stop.offset}
      stopColor={stop.color}
      stopOpacity={stop.opacity ?? 1}
    />
  ));
  const left = box.cx - box.r;
  const top = box.cy - box.r;
  const span = box.r * 2;
  if (gradient.type === 'radial') {
    const center = gradient.center ?? { x: 0.5, y: 0.5 };
    return (
      <RadialGradient
        key={id}
        id={id}
        gradientUnits="userSpaceOnUse"
        cx={left + center.x * span}
        cy={top + center.y * span}
        fx={left + center.x * span}
        fy={top + center.y * span}
        r={(gradient.radius ?? 0.5) * span}
      >
        {stops}
      </RadialGradient>
    );
  }
  const vector = getLinearGradientVector(gradient.angle);
  return (
    <LinearGradient
      key={id}
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={left + vector.x1 * span}
      y1={top + vector.y1 * span}
      x2={left + vector.x2 * span}
      y2={top + vector.y2 * span}
    >
      {stops}
    </LinearGradient>
  );
};

type Surface = {
  key: string;
  path: string;
  box: Box;
  color: string;
  gradient?: KnobGradient;
  overlays: KnobGradient[];
  brushed: boolean;
  borderWidth: number;
  borderColor: string;
};

type Geometry = {
  pad: number;
  cx: number;
  cy: number;
  skirtRadius: number;
  capRadius: number;
  outerRadius: number;
};

const getGeometry = (body: ResolvedBodyStyle, bodyRadius: number, layoutState: LayoutState): Geometry => {
  const skirtRadius = body.skirt ? Math.min(bodyRadius * body.skirt.ratio, layoutState.radius) : 0;
  const capRadius = body.cap ? bodyRadius * body.cap.ratio : 0;
  const outerRadius = Math.max(bodyRadius, skirtRadius);
  // Shadows reach past the knob's own box; the SVG is padded so they are not clipped.
  const shadowReach = body.shadows.reduce(
    (reach, shadow) =>
      Math.max(
        reach,
        outerRadius +
          (shadow.blur ?? 0) +
          Math.max(Math.abs(shadow.offsetX ?? 0), Math.abs(shadow.offsetY ?? 0))
      ),
    outerRadius + (body.borderWidth ?? 0)
  );
  const pad = Math.max(0, Math.ceil(shadowReach - layoutState.radius));
  return { pad, cx: layoutState.cx + pad, cy: layoutState.cy + pad, skirtRadius, capRadius, outerRadius };
};

const discSurface = (key: string, disc: ResolvedBodyDisc, cx: number, cy: number, r: number): Surface => ({
  key,
  path: buildCirclePath(cx, cy, r),
  box: { cx, cy, r },
  color: disc.color,
  gradient: disc.gradient,
  overlays: getShadingGradients(disc.shading),
  brushed: disc.shading === 'brushed',
  borderWidth: disc.borderWidth,
  borderColor: disc.borderColor,
});

const bodySurface = (body: ResolvedBodyStyle, cx: number, cy: number, r: number, rotation: number): Surface => ({
  key: 'body',
  path: buildBodyPath(body.shape, cx, cy, r, { sides: body.sides, fluteDepth: body.fluteDepth, rotation }),
  box: { cx, cy, r },
  color: body.color,
  gradient: body.gradient,
  overlays: getShadingGradients(body.shading),
  brushed: body.shading === 'brushed',
  borderWidth: body.borderWidth,
  borderColor: body.borderColor,
});

const gradientIdFor = (idBase: string, surfaceKey: string, index: number | 'base') =>
  `${idBase}-${surfaceKey}-${index}`;

const renderSurface = (idBase: string, surface: Surface, children?: React.ReactNode) => (
  <React.Fragment key={surface.key}>
    <Path
      d={surface.path}
      fill={surface.gradient ? `url(#${gradientIdFor(idBase, surface.key, 'base')})` : surface.color}
    />
    {surface.overlays.map((_, index) => (
      <Path
        key={`${surface.key}-shade-${index}`}
        d={surface.path}
        fill={`url(#${gradientIdFor(idBase, surface.key, index)})`}
      />
    ))}
    {surface.brushed
      ? Array.from({ length: BRUSHED_RINGS }, (_, index) => (
          <Circle
            key={`${surface.key}-brush-${index}`}
            cx={surface.box.cx}
            cy={surface.box.cy}
            r={(surface.box.r * 0.85 * (index + 1)) / BRUSHED_RINGS}
            fill="none"
            stroke={index % 2 ? '#ffffff' : '#000000'}
            strokeOpacity={0.07}
            strokeWidth={Math.max(0.5, surface.box.r / (BRUSHED_RINGS * 2))}
          />
        ))
      : null}
    {children}
    {surface.borderWidth > 0 ? (
      <Path d={surface.path} fill="none" stroke={surface.borderColor} strokeWidth={surface.borderWidth} />
    ) : null}
  </React.Fragment>
);

const renderGrip = (body: ResolvedBodyStyle, cx: number, cy: number, r: number, rotation: number) => {
  const grip = body.grip;
  if (!grip) return null;
  return buildGripMarks(grip.style, cx, cy, r, grip.count, grip.depth, rotation).map((mark, index) =>
    mark.kind === 'dot' ? (
      <Circle
        key={`grip-${index}`}
        cx={mark.cx}
        cy={mark.cy}
        r={grip.width / 2}
        fill={grip.color}
        fillOpacity={grip.opacity}
      />
    ) : (
      <Line
        key={`grip-${index}`}
        x1={mark.x1}
        y1={mark.y1}
        x2={mark.x2}
        y2={mark.y2}
        stroke={grip.color}
        strokeOpacity={grip.opacity}
        strokeWidth={grip.width}
        strokeLinecap="butt"
      />
    )
  );
};

const renderShadows = (body: ResolvedBodyStyle, geometry: Geometry, rotation: number) => {
  const { cx, cy, outerRadius } = geometry;
  // A skirt is the outermost part, and it is round whatever the body's shape.
  const outlineAt = (r: number, dx: number, dy: number) =>
    body.skirt
      ? buildCirclePath(cx + dx, cy + dy, Math.max(r, 0))
      : buildBodyPath(body.shape, cx + dx, cy + dy, Math.max(r, 0), {
          sides: body.sides,
          fluteDepth: body.fluteDepth,
          rotation,
        });
  return body.shadows.map((shadow, shadowIndex) => {
    const blur = Math.max(0, shadow.blur ?? 0);
    const steps = blur > 0 ? SHADOW_STEPS : 1;
    const opacity = shadow.opacity ?? 0.3;
    return Array.from({ length: steps }, (_, step) => (
      <Path
        key={`shadow-${shadowIndex}-${step}`}
        d={outlineAt(
          outerRadius + (blur * (steps - step)) / steps - blur / 2,
          shadow.offsetX ?? 0,
          shadow.offsetY ?? 0
        )}
        fill={shadow.color ?? '#000000'}
        fillOpacity={opacity / steps}
      />
    ));
  });
};

/**
 * The body re-renders with every value change, but most of it never moves: gradients, the
 * skirt, the cap, and the whole body when it does not rotate. Those parts are built once
 * per look and handed back as the same elements, so React skips them; only the turning
 * outline, its grip, and (for shaped bodies) its shadow are rebuilt as the angle changes.
 */
export const BodyLayer: React.FC<BodyLayerProps> = ({ layoutState, body, bodyRadius, displayAngle }) => {
  // `useId` yields `:r0:`-style ids, and a colon inside `url(#…)` breaks SVG references.
  const idBase = `knob-body-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Keyed by content rather than identity: an inline `appearance` hands over a new body
  // object on every render even when nothing about the look has changed.
  const bodyKey = useMemo(() => (body ? JSON.stringify(body) : ''), [body]);
  const { cx: layoutCx, cy: layoutCy, radius: layoutRadius, width, height } = layoutState;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `bodyKey` stands in for `body`.
  const stableBody = useMemo(() => body, [bodyKey]);
  const geometry = useMemo(
    () => (stableBody ? getGeometry(stableBody, bodyRadius, layoutState) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the layout's fields, not its identity.
    [stableBody, bodyRadius, layoutCx, layoutCy, layoutRadius]
  );

  const rotates = !!stableBody?.rotates;
  const rotation = rotates ? displayAngle : 0;
  // Shadows follow the outline only when the outline is not round.
  const shadowRotation = stableBody && !stableBody.skirt && stableBody.shape !== 'circle' ? rotation : 0;

  const defs = useMemo(() => {
    if (!stableBody || !geometry) return null;
    const { cx, cy, skirtRadius, capRadius } = geometry;
    // Gradients sit in absolute coordinates over each part's bounding circle, which does not
    // move when the part turns — so these never need rebuilding for rotation.
    const parts: { key: string; box: Box; gradient?: KnobGradient; shading: ResolvedBodyStyle['shading'] }[] = [];
    if (stableBody.skirt) parts.push({ key: 'skirt', box: { cx, cy, r: skirtRadius }, ...stableBody.skirt });
    parts.push({ key: 'body', box: { cx, cy, r: bodyRadius }, gradient: stableBody.gradient, shading: stableBody.shading });
    if (stableBody.cap && capRadius > 0) parts.push({ key: 'cap', box: { cx, cy, r: capRadius }, ...stableBody.cap });
    const nodes: React.ReactNode[] = [];
    parts.forEach((part) => {
      if (part.gradient) nodes.push(renderGradient(gradientIdFor(idBase, part.key, 'base'), part.gradient, part.box));
      getShadingGradients(part.shading).forEach((overlay, index) =>
        nodes.push(renderGradient(gradientIdFor(idBase, part.key, index), overlay, part.box))
      );
    });
    return nodes.length ? <Defs>{nodes}</Defs> : null;
  }, [stableBody, geometry, bodyRadius, idBase]);

  const shadows = useMemo(
    () => (stableBody && geometry ? renderShadows(stableBody, geometry, shadowRotation) : null),
    [stableBody, geometry, shadowRotation]
  );

  const skirt = useMemo(
    () =>
      stableBody?.skirt && geometry
        ? renderSurface(idBase, discSurface('skirt', stableBody.skirt, geometry.cx, geometry.cy, geometry.skirtRadius))
        : null,
    [stableBody, geometry, idBase]
  );

  const main = useMemo(() => {
    if (!stableBody || !geometry) return null;
    const { cx, cy } = geometry;
    return renderSurface(
      idBase,
      bodySurface(stableBody, cx, cy, bodyRadius, rotation),
      renderGrip(stableBody, cx, cy, bodyRadius, rotation)
    );
  }, [stableBody, geometry, bodyRadius, rotation, idBase]);

  const cap = useMemo(
    () =>
      stableBody?.cap && geometry && geometry.capRadius > 0
        ? renderSurface(idBase, discSurface('cap', stableBody.cap, geometry.cx, geometry.cy, geometry.capRadius))
        : null,
    [stableBody, geometry, idBase]
  );

  if (!stableBody || !geometry || bodyRadius <= 0) return null;

  const { pad } = geometry;
  return (
    <Svg
      pointerEvents="none"
      width={width + pad * 2}
      height={height + pad * 2}
      style={[styles.bodyLayer, { left: -pad, top: -pad }]}
    >
      {defs}
      {shadows}
      {skirt}
      {main}
      {cap}
    </Svg>
  );
};
