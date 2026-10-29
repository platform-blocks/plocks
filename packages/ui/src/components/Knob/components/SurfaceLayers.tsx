import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import type { LayoutState } from '../hooks/useKnobGeometry';
import { knobStyles as styles } from '../styles';

export type SurfaceLayersProps = {
  layoutState: LayoutState;
  /** The rendered body (`BodyLayer`), painted between the surface disk and the ring. */
  bodyLayer?: React.ReactNode;
  /** `false` hides the track and the disk under it; progress still draws. */
  ringVisible: boolean;
  ringBaseDiameter: number;
  ringSvgCenter: number;
  ringBackgroundColor?: string;
  ringBaseStroke: string;
  ringPath: string;
  ringSegmentPaths: { key: string; path: string; color: string; thickness: number }[];
  ringThickness: number;
  ringCap: 'butt' | 'round';
  ringShadowStyle: ViewStyle | null;
  trackStyle?: StyleProp<ViewStyle>;
  showContiguousProgress: boolean;
  progressPath: string;
  progressStrokeColor: string;
  progressThickness: number;
  progressStrokeCap: 'butt' | 'round';
  showSplitProgress: boolean;
  splitPositivePath?: string;
  splitNegativePath?: string;
  splitPositiveColor: string;
  splitNegativeColor: string;
  showZeroIndicator: boolean;
  zeroIndicatorPoints?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null;
  zeroIndicatorColor: string;
};

export const SurfaceLayers: React.FC<SurfaceLayersProps> = ({
  layoutState,
  bodyLayer,
  ringVisible,
  ringBaseDiameter,
  ringSvgCenter,
  ringBackgroundColor,
  ringBaseStroke,
  ringPath,
  ringSegmentPaths,
  ringThickness,
  ringCap,
  ringShadowStyle,
  trackStyle,
  showContiguousProgress,
  progressPath,
  progressStrokeColor,
  progressThickness,
  progressStrokeCap,
  showSplitProgress,
  splitPositivePath,
  splitNegativePath,
  splitPositiveColor,
  splitNegativeColor,
  showZeroIndicator,
  zeroIndicatorPoints,
  zeroIndicatorColor,
}) => {
  return (
    <>
      {/* Surface disk first, then the body over it: the disk spans the whole knob, so
          painting it later would hide the body. */}
      {ringVisible ? (
        <View
          pointerEvents="none"
          style={[
            styles.ringBase,
            {
              left: layoutState.cx - ringSvgCenter,
              top: layoutState.cy - ringSvgCenter,
              width: ringBaseDiameter,
              height: ringBaseDiameter,
              borderRadius: ringBaseDiameter / 2,
              backgroundColor: ringBackgroundColor,
            },
            ringShadowStyle ?? undefined,
            trackStyle,
          ]}
        />
      ) : null}

      {bodyLayer}

      <Svg
        pointerEvents="none"
        width={ringBaseDiameter}
        height={ringBaseDiameter}
        style={[
          styles.ringSvg,
          {
            left: layoutState.cx - ringSvgCenter,
            top: layoutState.cy - ringSvgCenter,
          },
        ]}
      >
        {ringVisible ? (
          <Path
            d={ringPath}
            stroke={ringBaseStroke}
            strokeWidth={ringThickness}
            strokeLinecap={ringCap}
            fill="none"
          />
        ) : null}
        {ringSegmentPaths.map((segment) => (
          <Path
            key={segment.key}
            d={segment.path}
            stroke={segment.color}
            strokeWidth={segment.thickness}
            strokeLinecap="butt"
            fill="none"
          />
        ))}
        {showContiguousProgress && progressPath ? (
          <Path
            d={progressPath}
            stroke={progressStrokeColor}
            strokeWidth={progressThickness}
            strokeLinecap={progressStrokeCap}
            fill="none"
          />
        ) : null}
        {showSplitProgress && splitNegativePath ? (
          <Path
            d={splitNegativePath}
            stroke={splitNegativeColor}
            strokeWidth={progressThickness}
            strokeLinecap={progressStrokeCap}
            fill="none"
          />
        ) : null}
        {showSplitProgress && splitPositivePath ? (
          <Path
            d={splitPositivePath}
            stroke={splitPositiveColor}
            strokeWidth={progressThickness}
            strokeLinecap={progressStrokeCap}
            fill="none"
          />
        ) : null}
        {showZeroIndicator && zeroIndicatorPoints ? (
          <Line
            x1={zeroIndicatorPoints.x1}
            y1={zeroIndicatorPoints.y1}
            x2={zeroIndicatorPoints.x2}
            y2={zeroIndicatorPoints.y2}
            stroke={zeroIndicatorColor}
            strokeWidth={Math.min(progressThickness * 0.6, 4)}
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
    </>
  );
};
