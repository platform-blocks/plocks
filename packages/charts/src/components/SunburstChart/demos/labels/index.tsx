import { SunburstChart } from '@plocks/charts';

import { DISK_USAGE } from './data';

export function Demo() {
  return <SunburstChart data={DISK_USAGE} labelFontSize={13} maw={400} />;
}
