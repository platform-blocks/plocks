import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Rect as SvgRect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(SvgRect);

export interface AnimatedBulletBarProps {
  /** Final rect, container-origin px */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Horizontal bars grow rightward from `x`; vertical bars grow upward from `y + height` */
  horizontal: boolean;
  fill: string;
  stroke?: string;
  duration: number;
  /** Draw the final rect at once */
  disabled?: boolean;
  testID?: string;
}

/**
 * The rect for one animation frame. The drawn length is clamped to the bar's
 * extent: on web, a timing animation's first frame can land before its start
 * time, and the ease-out curve then returns a large negative value, which an SVG
 * rect rejects (and which would draw the bar past its baseline).
 */
export function bulletBarFrame(
  drawn: number,
  rect: { x: number; y: number; width: number; height: number },
  horizontal: boolean
) {
  'worklet';
  const { x, y, width, height } = rect;
  const length = Math.min(Math.max(0, drawn), Math.max(0, horizontal ? width : height));
  return horizontal ? { x, y, width: length, height } : { x, y: y + height - length, width, height: length };
}

/** The bullet's value bar, growing out from its baseline. */
export const AnimatedBulletBar: React.FC<AnimatedBulletBarProps> = React.memo(
  ({ x, y, width, height, horizontal, fill, stroke, duration, disabled = false, testID }) => {
    const length = horizontal ? width : height;
    const drawn = useSharedValue(disabled ? length : 0);

    useEffect(() => {
      drawn.value = disabled ? length : withTiming(length, { duration, easing: Easing.out(Easing.cubic) });
    }, [disabled, length, duration, drawn]);

    const animatedProps = useAnimatedProps(
      () => bulletBarFrame(drawn.value, { x, y, width, height }, horizontal) as any
    );

    const strokeProps = stroke ? { stroke, strokeWidth: 1.5 } : { stroke: 'none', strokeWidth: 0 };

    if (disabled) {
      return <SvgRect testID={testID} x={x} y={y} width={width} height={height} fill={fill} {...strokeProps} />;
    }
    return <AnimatedRect testID={testID} animatedProps={animatedProps} fill={fill} {...strokeProps} />;
  }
);

AnimatedBulletBar.displayName = 'AnimatedBulletBar';
