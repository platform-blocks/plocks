import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart title="Disk usage" data={DISK_USAGE} valueFormatter={(value) => `${value} GB`} maw={400} />;
}
