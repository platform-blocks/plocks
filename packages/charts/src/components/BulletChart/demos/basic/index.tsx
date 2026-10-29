import { BulletChart } from '@plocks/charts';

import { REVENUE_RANGES } from './data';

export function Demo() {
  return <BulletChart label="Revenue" description="USD, Q3" value={230000} target={250000} ranges={REVENUE_RANGES} maw={520} />;
}
