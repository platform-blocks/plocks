import { TimePickerInput } from '@plocks/dates';

export function Demo() {
  return (
    <TimePickerInput
      label="Appointment"
      format={12}
      presets={[
        { label: 'Morning', values: ['08:00', '09:00', '10:00', '11:00'] },
        { label: 'Afternoon', values: ['13:00', '14:00', '15:00', '16:00'] },
        { label: 'Evening', values: ['18:00', '19:00'] },
      ]}
      fullWidth
    />
  );
}
