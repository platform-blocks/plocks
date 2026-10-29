import { WaffleChart } from '@plocks/charts';

import { BROWSER_SHARE } from './data';

export function Demo() {
  return <WaffleChart title="Browser share" data={BROWSER_SHARE} maw={360} />;
}
