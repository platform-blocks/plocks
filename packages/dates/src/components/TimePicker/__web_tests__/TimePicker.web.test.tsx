import React from 'react';
import { fireEvent, render as rtlRender, screen, within } from '@testing-library/react';

import { PlocksProvider } from '@plocks/ui';
import { TimePicker } from '../TimePicker';

const render = (ui: React.ReactElement) => rtlRender(<PlocksProvider>{ui}</PlocksProvider>);

describe('TimePicker (react-native-web DOM)', () => {
  it('is a named group of adjustable wheels, one per column, without duplicate caption text', () => {
    render(<TimePicker withSeconds format={12} defaultValue={{ hours: 14, minutes: 5, seconds: 0 }} minuteStep={5} />);
    const group = screen.getByRole('group', { name: 'Time' });
    expect(group).toBeTruthy();
    for (const name of ['Hour', 'Minute', 'Second', 'Period']) {
      expect(screen.getByRole('slider', { name })).toBeTruthy();
    }
    // Visible captions are aria-hidden: each column is announced once, by its wheel.
    const captions = Array.from(document.querySelectorAll('[aria-hidden="true"]')).map((node) => node.textContent);
    expect(captions).toEqual(expect.arrayContaining(['Hour', 'Minute', 'Second', 'Period']));
  });

  it('renders presets as focusable buttons with aria-pressed, grouped under their labels', () => {
    const onChange = jest.fn();
    render(
      <TimePicker
        defaultValue={{ hours: 9, minutes: 0 }}
        onChange={onChange}
        presets={[
          { label: 'Morning', values: ['09:00', '10:30'] },
          { label: 'Afternoon', values: ['14:00'] },
        ]}
      />
    );
    const morning = screen.getByRole('group', { name: 'Morning' });
    const active = within(morning).getByRole('button', { name: '09:00' });
    expect(active.getAttribute('aria-pressed')).toBe('true');
    const other = within(morning).getByRole('button', { name: '10:30' });
    expect(other.getAttribute('aria-pressed')).toBe('false');
    expect(other.tabIndex).toBe(0);
    expect(screen.getByRole('group', { name: 'Afternoon' })).toBeTruthy();

    fireEvent.click(other);
    expect(onChange).toHaveBeenLastCalledWith({ hours: 10, minutes: 30 });
    expect(other.getAttribute('aria-pressed')).toBe('true');
    expect(active.getAttribute('aria-pressed')).toBe('false');
  });
});
