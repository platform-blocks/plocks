import { Block, KeyCap, Row, Text, useModifierKeys } from '@plocks/ui';

export function Demo() {
  const { alt, ctrl, meta, shift } = useModifierKeys();
  const action = alt ? 'Copy' : shift ? 'Add to selection' : 'Move';

  return (
    <Block align="flex-start" gap="sm">
      <Row gap="xs" wrap="wrap">
        <KeyCap size="sm" pressed={shift}>⇧ Shift</KeyCap>
        <KeyCap size="sm" pressed={alt}>⌥ Alt</KeyCap>
        <KeyCap size="sm" pressed={ctrl}>⌃ Ctrl</KeyCap>
        <KeyCap size="sm" pressed={meta}>⌘ Meta</KeyCap>
      </Row>
      <Text size="sm">Dropping now would: {action}</Text>
    </Block>
  );
}
