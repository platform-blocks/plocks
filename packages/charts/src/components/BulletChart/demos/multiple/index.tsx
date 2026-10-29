import { BulletChart } from '@plocks/charts';

import { KPIS } from './data';

export function Demo() {
  return <BulletChart data={KPIS} ranges={[{ value: 60 }, { value: 90 }, { value: 120 }]} maw={560} />;
}
