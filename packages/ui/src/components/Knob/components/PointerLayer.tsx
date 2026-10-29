import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { KnobPointerStyle } from '../types';
import type { LayoutState } from '../hooks/useKnobGeometry';
import { clamp } from '../utils/math';
import { polarToCartesian } from '../utils/geometry';
import { knobStyles as styles } from '../styles';

export type PointerLayerProps = {
  pointerConfig?: KnobPointerStyle | false | null;
  labelColor: string;
  displayAngle: number;
  layoutState: LayoutState;
  size: number;
  thumbSize: number;
  ringRadius: number;
};

const fmt = (n: number) => Number(n.toFixed(3));

export const PointerLayer: React.FC<PointerLayerProps> = ({
  pointerConfig,
  labelColor,
  displayAngle,
  layoutState,
  size,
  thumbSize,
  ringRadius,
}) => {
  if (!pointerConfig || pointerConfig.visible === false) {
    return null;
  }

  const shape = pointerConfig.shape ?? 'line';
  const width = pointerConfig.width ?? Math.max(2, Math.round(size * 0.015));
  const color = pointerConfig.color ?? labelColor;
  const cap = pointerConfig.cap ?? 'round';
  const { cx, cy } = layoutState;
  const endRadius = clamp(
    (pointerConfig.length ?? ringRadius) + (pointerConfig.offset ?? 0),
    0,
    layoutState.radius + thumbSize
  );
  const counterweightRadius = pointerConfig.counterweight?.size
    ? Math.max(0, pointerConfig.counterweight.size / 2)
    : 0;
  const counterweightColor = pointerConfig.counterweight?.color ?? color;
  const startRadius = Math.max(pointerConfig.inset ?? 0, shape === 'needle' ? 0 : counterweightRadius);
  const at = (radius: number, angleOffset = 0) => polarToCartesian(cx, cy, radius, displayAngle + angleOffset);
  // Perpendicular offset, for shapes with width: positive is clockwise of the arm.
  const across = (radius: number, offset: number) => {
    const p = at(radius);
    const rad = (displayAngle * Math.PI) / 180;
    return { x: fmt(p.x + Math.cos(rad) * offset), y: fmt(p.y + Math.sin(rad) * offset) };
  };

  let indicator: React.ReactNode = null;
  switch (shape) {
    case 'dot': {
      const p = at(endRadius);
      indicator = <Circle cx={p.x} cy={p.y} r={width / 2} fill={color} />;
      break;
    }
    case 'dimple': {
      // A dish reads as concave when it is dark toward the light (top left) and catches a
      // highlight on the far lip.
      const p = at(endRadius);
      const r = width / 2;
      indicator = (
        <>
          <Circle cx={p.x} cy={p.y} r={r} fill={color} />
          <Circle cx={p.x} cy={p.y} r={r} fill="#000000" fillOpacity={0.22} />
          <Circle cx={p.x + r * 0.18} cy={p.y + r * 0.18} r={r * 0.78} fill="#ffffff" fillOpacity={0.12} />
        </>
      );
      break;
    }
    case 'triangle': {
      const tip = at(endRadius);
      const baseRadius = Math.max(0, endRadius - width * 1.1);
      const left = across(baseRadius, -width / 2);
      const right = across(baseRadius, width / 2);
      indicator = (
        <Path d={`M ${fmt(tip.x)} ${fmt(tip.y)} L ${right.x} ${right.y} L ${left.x} ${left.y} Z`} fill={color} />
      );
      break;
    }
    case 'needle': {
      // Tapers from a broad base over the hub to a fine tip, with a short tail behind it.
      const tip = at(endRadius);
      const tailRadius = Math.min(endRadius * 0.18, Math.max(counterweightRadius, width * 2));
      const tail = at(tailRadius, 180);
      const left = across(0, -width);
      const right = across(0, width);
      indicator = (
        <Path
          d={`M ${fmt(tip.x)} ${fmt(tip.y)} L ${right.x} ${right.y} L ${fmt(tail.x)} ${fmt(tail.y)} L ${left.x} ${left.y} Z`}
          fill={color}
        />
      );
      break;
    }
    default: {
      if (endRadius <= startRadius) break;
      const start = at(startRadius);
      const end = at(endRadius);
      const line = (
        <Line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={color}
          strokeWidth={width}
          strokeLinecap={cap}
        />
      );
      if (shape !== 'notch') {
        indicator = line;
        break;
      }
      // A groove: the cut itself, and a lit edge on the side facing away from the light.
      const edgeStart = across(startRadius, width * 0.6);
      const edgeEnd = across(endRadius, width * 0.6);
      indicator = (
        <>
          {line}
          <Line
            x1={edgeStart.x}
            y1={edgeStart.y}
            x2={edgeEnd.x}
            y2={edgeEnd.y}
            stroke="#ffffff"
            strokeOpacity={0.35}
            strokeWidth={Math.max(1, width * 0.3)}
            strokeLinecap={cap}
          />
        </>
      );
    }
  }

  if (!indicator) return null;

  return (
    <Svg
      pointerEvents="none"
      width={layoutState.width || size}
      height={layoutState.height || size}
      style={styles.pointerLayer}
    >
      {indicator}
      {counterweightRadius > 0 ? (
        <Circle cx={cx} cy={cy} r={counterweightRadius} fill={counterweightColor} />
      ) : null}
    </Svg>
  );
};
