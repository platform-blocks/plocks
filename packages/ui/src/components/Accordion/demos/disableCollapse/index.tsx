import { Accordion } from '@plocks/ui';
import { faqItems } from '../data';

export function Demo() {
  return <Accordion disableCollapse defaultExpanded={['foundation']} items={faqItems} />;
}
