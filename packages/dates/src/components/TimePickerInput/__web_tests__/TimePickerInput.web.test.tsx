import React from 'react';
import { act, fireEvent, render as rtlRender, screen, within } from '@testing-library/react';

import { PlocksProvider } from '@plocks/ui';
import { __resetLayerStackForTests } from '@plocks/ui/test-utils';
import { TimePickerInput } from '../TimePickerInput';

const render = (ui: React.ReactElement) => rtlRender(<PlocksProvider>{ui}</PlocksProvider>);
beforeEach(() => __resetLayerStackForTests());

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
};

describe('TimePickerInput (react-native-web DOM)', () => {
  it('is a labelled text field with a clock button that opens the wheel dialog', async () => {
    render(<TimePickerInput label="Meeting time" required defaultValue={{ hours: 9, minutes: 30 }} />);
    const input = screen.getByRole('textbox', { name: 'Meeting time' }) as HTMLInputElement;
    expect(input.value).toBe('09:30');
    expect(input.getAttribute('aria-required')).toBe('true');

    const button = screen.getByRole('button', { name: 'Choose time' });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(button);
    await flush();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    const dialog = screen.getByRole('dialog', { name: 'Select time' });
    expect(within(dialog).getByRole('slider', { name: 'Hour' })).toBeTruthy();
    expect(within(dialog).getByRole('slider', { name: 'Minute' })).toBeTruthy();
  });

  it('is a button field when typing is off', () => {
    render(<TimePickerInput label="Start" allowInput={false} defaultValue={{ hours: 8, minutes: 0 }} />);
    const button = screen.getByRole('button', { name: 'Start' });
    expect(button.textContent).toContain('08:00');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('picks a preset in the dialog and closes it with closeDropdownOnPresetSelect', async () => {
    const onChange = jest.fn();
    render(<TimePickerInput label="Start" onChange={onChange} presets={['08:00', '12:00']} closeDropdownOnPresetSelect />);
    const button = screen.getByRole('button', { name: 'Choose time' });
    fireEvent.click(button);
    await flush();
    const dialog = screen.getByRole('dialog', { name: 'Select time' });
    const presets = within(dialog).getByRole('group', { name: 'Presets' });
    fireEvent.click(within(presets).getByRole('button', { name: '12:00' }));
    await flush();
    expect(onChange).toHaveBeenLastCalledWith({ hours: 12, minutes: 0 });
    expect((screen.getByRole('textbox', { name: 'Start' }) as HTMLInputElement).value).toBe('12:00');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
