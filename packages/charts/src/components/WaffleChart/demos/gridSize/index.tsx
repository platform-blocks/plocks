import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart data={BROWSER_SHARE} rows={5} columns={20} gap={2} cellRadius={6} maw={480} />;
}
