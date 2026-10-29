import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} ringGap={4} padAngle={1} strokeWidth={0} maw={400} />;
}
