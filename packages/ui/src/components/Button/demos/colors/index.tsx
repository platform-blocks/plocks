import { Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="md" wrap="wrap">
      <Button color="primary">Primary</Button>
      <Button color="secondary">Secondary</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="error">Error</Button>
      <Button color="#5865F2">Custom</Button>
    </Row>
  );
}
