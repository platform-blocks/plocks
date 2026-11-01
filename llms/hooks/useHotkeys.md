# useHotkeys

Register scoped keyboard shortcuts that only run while the component using them stays mounted. A binding takes a handler or `{ keydown, keyup, repeat, preventDefault }`: `keyup` runs when the key of a matched press is released (or the window loses focus), and a modifier can be bound on its own (`'shift'`, `'alt'`), for held-key behavior. `useModifierKeys` reports which modifiers are held.

## Metadata

- Import: `import { useHotkeys } from '@plocks/ui';`
- Since: 0.1.0
- Tags: keyboard, shortcuts, scoped
- Docs: https://plocks.dev/hooks/useHotkeys
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/hooks/useHotkeys/index.ts

## Definition

```ts
export function useHotkeys(hotkeys: HotkeyItem[]);
```

## Examples

### Scoped shortcuts

Register multiple keyboard combinations while a view is mounted to keep editor commands local to that surface.

```tsx
import { useCallback, useState } from 'react';
import { Block, KeyCap, Row, Text, useHotkeys } from '@plocks/ui';

export function Demo() {
  const [log, setLog] = useState<string[]>([]);

  const append = useCallback((entry: string) => {
    setLog(prev => [entry, ...prev].slice(0, 4));
  }, []);

  useHotkeys([
    ['mod+b', () => append('Bold toggled')],
    ['mod+shift+p', () => append('Command palette opened')],
    ['escape', () => append('Escape pressed')],
  ]);

  return (
    <Block align="flex-start">
      <Row gap="xs" wrap="wrap">
        <KeyCap keyCode="B" modifiers={['cmd']} size="sm">⌘B</KeyCap>
        <KeyCap keyCode="P" modifiers={['cmd', 'shift']} size="sm">⇧⌘P</KeyCap>
        <KeyCap keyCode="Escape" size="sm">Esc</KeyCap>
      </Row>
      {log.length ? (
        log.map((entry, index) => (
          <Text key={`${entry}-${index}`} size="sm">{entry}</Text>
        ))
      ) : (
        <Text size="sm" c="muted">No shortcuts fired yet.</Text>
      )}
    </Block>
  );
}
```
