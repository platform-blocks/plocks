import { CandlestickChart } from '@plocks/charts';

import { PRICE_SERIES } from './data';

export function Demo() {
  return (
    <CandlestickChart
      h={300}
      series={[{ id: 'apple', name: 'Apple Inc.', data: PRICE_SERIES }]}
      yDomain={[150, 175]}
      domainPadding={{ x: 24, y: 12 }}
      grid={{ show: true }}
    />
  );
}
