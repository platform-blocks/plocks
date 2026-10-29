import { Radio, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="lg" wrap="wrap">
      <Radio value="filled" variant="filled" label="filled" checked />
      <Radio value="light" variant="light" label="light" checked />
    </Row>
  );
}
