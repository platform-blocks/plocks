import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react';

import { PlocksProvider } from '../../../../core/theme/PlocksProvider';
import { Checkbox } from '../../../Checkbox';
import { ColorInput } from '../../../ColorInput';
import { Select } from '../../../Select';
import { Switch } from '../../../Switch';
import { TextArea } from '../../../TextArea';

const render = (ui: React.ReactElement) => rtlRender(<PlocksProvider>{ui}</PlocksProvider>);

/**
 * Every field family forwards `success` to its wrapper: the message renders and
 * describes the control, and an error still wins. Guards against a field that
 * accepts the prop through the shared types but silently drops it.
 */
describe('success across field families', () => {
  const cases: Array<[string, (props: { success?: React.ReactNode; error?: React.ReactNode }) => React.ReactElement]> = [
    ['TextArea', (p) => <TextArea id="f" label="Bio" {...p} />],
    ['Select', (p) => <Select label="Plan" options={[{ label: 'Pro', value: 'pro' }]} {...p} />],
    ['ColorInput', (p) => <ColorInput label="Brand" {...p} />],
    ['Checkbox', (p) => <Checkbox id="f" label="Terms" {...p} />],
    ['Switch', (p) => <Switch id="f" label="Alerts" {...p} />],
  ];

  it.each(cases)('%s renders the success message and is described by it', (_name, make) => {
    const { container } = render(make({ success: 'Looks good' }));
    const message = screen.getByText('Looks good');
    expect(message).toBeTruthy();
    const describedBy = Array.from(container.querySelectorAll('[aria-describedby]'))
      .map((node) => node.getAttribute('aria-describedby') ?? '')
      .join(' ')
      .split(/\s+/);
    const messageId = message.closest('[id]')?.getAttribute('id');
    expect(messageId).toBeTruthy();
    expect(describedBy).toContain(messageId);
  });

  it.each(cases)('%s shows the error instead of success when both are set', (_name, make) => {
    render(make({ success: 'Looks good', error: 'Required' }));
    expect(screen.queryByText('Looks good')).toBeNull();
    expect(screen.getByText('Required')).toBeTruthy();
  });
});
