import { AreaChart } from '@plocks/charts';

import { LISTENING_SERIES, MONTHS } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Listening hours by genre"
      h={320}
      series={LISTENING_SERIES}
      layout="stream"
      areaOpacity={0.8}
      xAxis={{ show: true, labelFormatter: (value) => MONTHS[Math.round(value)] ?? '' }}
      legend={{ show: true, position: 'bottom' }}
      enableCrosshair
      multiTooltip
      liveTooltip
    />
  );
}
