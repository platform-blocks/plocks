import React from 'react';
import { LineChart } from '../LineChart';
import { StackedAreaChart } from '../StackedAreaChart';
import type { AreaChartProps } from './types';

// Enhanced wrapper that can render overlap, stacked or stream area layouts.
// Every other prop — reference marks included — is forwarded to whichever chart renders.
const STACK_MODES = {
  stacked: 'absolute',
  stackedPercentage: 'percentage',
  stream: 'stream',
} as const;

export const AreaChart: React.FC<AreaChartProps> = (props) => {
  const {
    layout = 'overlap',
    areaOpacity,
    stackOrder,
    series,
    data,
    fill,
    smooth,
    fillOpacity,
    areaFillMode,
    ...lineProps
  } = props;

  const resolvedFill = fill ?? true;
  const resolvedSmooth = smooth ?? true;
  const resolvedFillOpacity = fillOpacity ?? 0.35;
  const hasMultiSeries = Array.isArray(series) && series.length > 0;

  const stackMode = layout === 'overlap' ? undefined : STACK_MODES[layout];

  if (stackMode && hasMultiSeries) {
    return (
      <StackedAreaChart
        {...lineProps}
        series={series}
        smooth={resolvedSmooth}
        opacity={areaOpacity ?? resolvedFillOpacity}
        stackOrder={stackOrder}
        stackMode={stackMode}
      />
    );
  }

  return (
    <LineChart
      {...lineProps}
      data={hasMultiSeries ? undefined : data}
      series={hasMultiSeries ? series : undefined}
      fill={resolvedFill}
      smooth={resolvedSmooth}
      fillOpacity={resolvedFillOpacity}
      areaFillMode={areaFillMode ?? (hasMultiSeries ? 'series' : 'single')}
    />
  );
};

AreaChart.displayName = 'AreaChart';
