# useModifierKeys

Know which modifier keys (`alt`, `ctrl`, `meta`, `shift`) are held right now from one shared, document-wide tracker: `useModifierKeys()` re-renders only when one changes, and `getModifierKeys()` reads the state inside an event or gesture handler without a render. Window blur releases everything. Web only; all `false` on native.

## Metadata

- Import: `import { useModifierKeys } from '@plocks/ui';`
- Since: 0.3.1
- Tags: keyboard, modifiers, shift, alt, held, web
- Docs: https://plocks.dev/hooks/useModifierKeys
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/hooks/useModifierKeys/useModifierKeys.ts

## Definition

```ts
export interface ModifierKeysState {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

export function useModifierKeys(): ModifierKeysState;
```

## Examples

### Held modifiers

`useModifierKeys()` returns `{ alt, ctrl, meta, shift }` and re-renders only when one of them changes — here, to show what a drag would do. In a gesture handler, read `getModifierKeys()` instead: no render at all.

```tsx
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
```
