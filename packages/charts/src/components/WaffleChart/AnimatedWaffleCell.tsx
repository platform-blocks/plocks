import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Rect as SvgRect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(SvgRect);

export interface AnimatedWaffleCellProps {
  x: number;
  y: number;
  size: number;
  radius: number;
  fill: string;
  /** Position in fill order; later cells appear later */
  index: number;
  /** Cells in the grid, for adaptive stagger timing */
  total: number;
  /** Draw the final state at once */
  disabled?: boolean;
  highlighted?: boolean;
  stroke: string;
  testID?: string;
}

/** One waffle cell, popping into place in fill order. */
export const AnimatedWaffleCell: React.FC<AnimatedWaffleCellProps> = React.memo(
  ({ x, y, size, radius, fill, index, total, disabled = false, highlighted = false, stroke, testID }) => {
    const progress = useSharedValue(disabled ? 1 : 0);

    useEffect(() => {
      if (disabled) {
        progress.value = 1;
        return;
      }
      // The whole grid fills in about a second whatever its size.
      const stagger = Math.min(12, 900 / Math.max(total, 1));
      progress.value = withDelay(index * stagger, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
    }, [disabled, index, total, progress]);

    const animatedProps = useAnimatedProps(() => {
      const scale = 0.4 + 0.6 * progress.value;
      const drawn = size * scale;
      const inset = (size - drawn) / 2;
      return { opacity: progress.value, x: x + inset, y: y + inset, width: drawn, height: drawn } as any;
    });

    return (
      <AnimatedRect
        testID={testID}
        animatedProps={animatedProps}
        fill={fill}
        rx={radius}
        ry={radius}
        stroke={highlighted ? stroke : 'none'}
        strokeWidth={highlighted ? 1.5 : 0}
      />
    );
  }
);

AnimatedWaffleCell.displayName = 'AnimatedWaffleCell';
