import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart data={BROWSER_SHARE} fillDirection="left-to-right" maw={360} />;
}
