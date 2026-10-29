import { ComboChart } from '@plocks/charts';

import { LAYERS } from './data';

export function Demo() {
  return (
    <ComboChart
      h={340}
      layers={LAYERS}
      withBrush
      brushProps={{ start: 37, end: 60 }}
      xAxis={{ show: true, labelFormatter: (value) => `M${value}` }}
      yAxis={{ show: true }}
    />
  );
}
