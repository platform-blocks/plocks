import { ComboChart } from '@plocks/charts';

import { LAYERS } from './data';

export function Demo() {
  return (
    <ComboChart
      title="Monthly orders"
      h={320}
      layers={LAYERS}
      yDomain={[0, 700]}
      referenceAreas={[{ x1: 4.5, x2: 6.5, color: '#10b981', label: 'Promo' }]}
      referenceLines={[{ y: 500, label: 'Target 500', color: '#f59e0b', dashed: true }]}
      referenceDots={[{ x: 12, y: 640, r: 6, color: '#10b981', label: 'Record' }]}
      xAxis={{ show: true, labelFormatter: (value) => `M${value}` }}
      yAxis={{ show: true }}
      legend={{ show: true, position: 'bottom' }}
    />
  );
}
