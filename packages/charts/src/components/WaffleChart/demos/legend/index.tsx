import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart data={BROWSER_SHARE} legend={{ position: 'right' }} maw={480} />;
}
