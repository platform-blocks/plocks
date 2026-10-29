import { SunburstChart } from '@plocks/charts';

import { BUDGET } from './data';

export function Demo() {
  return <SunburstChart data={BUDGET} valueFormatter={(value) => `$${value}k`} maw={400} />;
}
