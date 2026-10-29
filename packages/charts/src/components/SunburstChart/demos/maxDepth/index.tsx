import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} maxDepth={2} maw={400} />;
}
