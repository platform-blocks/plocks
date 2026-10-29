import { TimePickerInput } from '@plocks/dates';

export function Demo() {
  return (
    <TimePickerInput
      label="Meeting time"
      presets={['09:00', '10:30', '13:00', '15:30', '17:00']}
      closeDropdownOnPresetSelect
      fullWidth
    />
  );
}
