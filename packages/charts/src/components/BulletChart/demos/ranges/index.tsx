import { BulletChart } from '@plocks/charts';

import { SATISFACTION_RANGES } from './data';

export function Demo() {
  return (
    <BulletChart
      label="Satisfaction"
      description="Score out of 100"
      value={72}
      target={85}
      ranges={SATISFACTION_RANGES}
      color="#334155"
      maw={520}
    />
  );
}
