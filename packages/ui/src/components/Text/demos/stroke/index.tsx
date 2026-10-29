import { Row, Text } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="lg" align="center">
      <Text size={96} fw="black" lh={1} c="transparent" stroke={{ c: 'primary', w: 2 }}>
        1
      </Text>
      <Text size={48} fw="bold" stroke="error">
        Outlined
      </Text>
    </Row>
  );
}
