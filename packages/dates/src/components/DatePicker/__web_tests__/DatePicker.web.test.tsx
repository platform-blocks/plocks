import React from 'react';
import { act, fireEvent, render as rtlRender, screen, within } from '@testing-library/react';

import { PlocksProvider } from '@plocks/ui';
import { DatePicker } from '../DatePicker';

const render = (ui: React.ReactElement) => rtlRender(<PlocksProvider>{ui}</PlocksProvider>);

describe('DatePicker (react-native-web DOM)', () => {
  it('wraps the calendar grid in a labelled group and selects days', () => {
    const onChange = jest.fn();
    render(
      <DatePicker
        accessibilityLabel="Check-in date"
        onChange={onChange}
        calendarProps={{ defaultDate: new Date(2026, 2, 1) }}
      />
    );

    const group = screen.getByRole('group', { name: 'Check-in date' });
    const grid = within(group).getByRole('grid', { name: 'March 2026' });
    const day = within(grid).getByRole('gridcell', { name: 'Tuesday, March 3, 2026' });
    expect(day.getAttribute('aria-selected')).toBe('false');

    act(() => {
      fireEvent.click(day);
    });
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 3));
    expect(day.getAttribute('aria-selected')).toBe('true');
  });

  it('renders no group role without a label', () => {
    render(<DatePicker calendarProps={{ defaultDate: new Date(2026, 2, 1) }} />);
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeTruthy();
  });

  it('forwards withNativeLevelSelect / yearsSelectRange to the calendar header', () => {
    render(
      <DatePicker withNativeLevelSelect yearsSelectRange={[2020, 2030]} calendarProps={{ defaultDate: new Date(2026, 2, 1) }} />
    );
    const year = screen.getByRole('combobox', { name: 'Year' }) as HTMLSelectElement;
    expect(year.options).toHaveLength(11);
    act(() => {
      fireEvent.change(year, { target: { value: '2021' } });
    });
    expect(screen.getByRole('grid', { name: 'March 2021' })).toBeTruthy();
  });
});
