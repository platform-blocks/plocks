import { Column, TextArea } from '@plocks/ui';

export function Demo() {
  return (
    <Column h={320} fullWidth>
      <TextArea flex={1} label="Message" placeholder="Write a message" fullWidth />
    </Column>
  );
}
