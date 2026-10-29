import { Checkbox, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="lg" wrap="wrap">
      <Checkbox variant="filled" label="filled" defaultChecked />
      <Checkbox variant="light" label="light" defaultChecked />
    </Row>
  );
}
