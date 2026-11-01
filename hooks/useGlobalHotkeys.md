# useGlobalHotkeys

Attach application-wide shortcuts that persist even when the originating component unmounts.

## Metadata

- Import: `import { useGlobalHotkeys } from '@plocks/ui';`
- Since: 0.1.0
- Tags: keyboard, global, shortcuts
- Docs: https://plocks.dev/hooks/useGlobalHotkeys
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/hooks/useHotkeys/index.ts

## Definition

```ts
export function useGlobalHotkeys(id: string, hotkey: HotkeyItem, enabled: boolean = true);
```

## Examples

### Global palette toggle

Keep a command palette hotkey alive across route changes by registering it with the global manager once.

```tsx
import { useCallback, useState } from 'react';
import { Alert, Block, Button, KeyCap, Row, useGlobalHotkeys } from '@plocks/ui';

const NAMESPACE = 'hooks-command-palette';

export function Demo() {
  const [open, setOpen] = useState(false);

  const togglePalette = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  useGlobalHotkeys(NAMESPACE, ['mod+k', togglePalette]);

  return (
    <Block align="flex-start">
      <Row gap="xs" align="center">
        <KeyCap keyCode="K" modifiers={['cmd']} size="sm">⌘</KeyCap>
        <KeyCap keyCode="K" modifiers={['cmd']} size="sm">K</KeyCap>
      </Row>
      <Button onPress={togglePalette}>{open ? 'Close palette' : 'Open palette'}</Button>
      <Alert severity={open ? 'success' : 'info'} fullWidth>
        {open ? 'Palette is open globally. Press ⌘K again to close.' : 'Palette is currently closed.'}
      </Alert>
    </Block>
  );
}
```
