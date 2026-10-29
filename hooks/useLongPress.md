# useLongPress

Fire a callback once a press is held for a threshold, with handlers that cover React Native's press events and the DOM's mouse and touch events.

## Metadata

- Import: `import { useLongPress } from '@plocks/ui';`
- Tags: press, long-press, pressable, web
- Docs: https://plocks.dev/hooks/useLongPress
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/hooks/useLongPress/useLongPress.ts

## Definition

```ts
export interface UseLongPressOptions {
  /** Time (ms) the press must be held before `onLongPress` fires. @default 400 */
  threshold?: number;
  /** Called when a press starts. */
  onStart?: (event?: UseLongPressEvent) => void;
  /** Called when the press is released after `onLongPress` fired. */
  onFinish?: (event?: UseLongPressEvent) => void;
  /** Called when the press ends (release, pointer leave, system interrupt) before `onLongPress` fired. */
  onCancel?: (event?: UseLongPressEvent) => void;
}

export interface UseLongPressHandlers {
  /** Press started. RN `Pressable`. */
  onPressIn: (event?: GestureResponderEvent) => void;
  /** Press released (or the responder was taken away). RN `Pressable`. */
  onPressOut: (event?: GestureResponderEvent) => void;
  /** Touch began. RN `View` / `Pressable`, and the DOM touch event on web. */
  onTouchStart: (event?: GestureResponderEvent) => void;
  /** Touch lifted. */
  onTouchEnd: (event?: GestureResponderEvent) => void;
  /** The system interrupted the touch (incoming call, scroll took over…): cancels the press. */
  onTouchCancel: (event?: GestureResponderEvent) => void;
  /** Web only: mouse button pressed on a plain `View`. */
  onMouseDown: (event?: WebMouseEvent) => void;
  /** Web only: mouse button released. */
  onMouseUp: (event?: WebMouseEvent) => void;
  /** Web only: the pointer left the element while pressed: cancels the press. */
  onMouseLeave: (event?: WebMouseEvent) => void;
}

export type UseLongPressEvent = GestureResponderEvent | WebMouseEvent;

export function useLongPress(onLongPress: (event?: UseLongPressEvent) => void, options: UseLongPressOptions = {}): UseLongPressHandlers;
```

## Examples

### Long press

`useLongPress(onLongPress, { threshold, onStart, onFinish, onCancel })` returns handlers to spread onto a `<Pressable>`, `<View>` or `<Button>`. `onLongPress` fires once after `threshold` ms (default 400); releasing, leaving or a system interrupt before that cancels the press.

```tsx
import { useState } from 'react';
import { Button, useLongPress } from '@plocks/ui';

export function Demo() {
  const [state, setState] = useState<'idle' | 'pressing' | 'long-pressed'>('idle');
  const handlers = useLongPress(() => setState('long-pressed'), {
    threshold: 600,
    onStart: () => setState('pressing'),
    onCancel: () => setState('idle'),
  });

  return (
    <Button {...handlers} variant={state === 'long-pressed' ? 'filled' : 'outline'}>
      {state === 'idle' ? 'Hold me' : state === 'pressing' ? 'Keep holding…' : 'Long pressed'}
    </Button>
  );
}
```
