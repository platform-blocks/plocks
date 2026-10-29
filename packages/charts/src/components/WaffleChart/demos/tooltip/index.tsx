import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return (
    <WaffleChart
      data={BROWSER_SHARE}
      tooltip={{ formatter: (segment) => `${segment.name}: ${segment.value}% (${segment.count} cells)` }}
      maw={360}
    />
  );
}
