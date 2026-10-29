import { act, fireEvent, renderHook } from '@testing-library/react';

import { getModifierKeys, useModifierKeys } from '../useModifierKeys';

describe('useModifierKeys (web)', () => {
  afterEach(() => {
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
  });

  it('tracks held modifiers and re-renders only when one changes', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useModifierKeys();
    });
    expect(result.current).toEqual({ alt: false, ctrl: false, meta: false, shift: false });

    act(() => {
      fireEvent.keyDown(window, { key: 'Shift', shiftKey: true });
    });
    expect(result.current.shift).toBe(true);
    const afterShift = renders;
    // a key that leaves the modifiers as they were costs no render
    act(() => {
      fireEvent.keyDown(window, { key: 'a', shiftKey: true });
    });
    expect(renders).toBe(afterShift);

    act(() => {
      fireEvent.keyUp(window, { key: 'Shift', shiftKey: false });
    });
    expect(result.current.shift).toBe(false);
  });

  it('reads the state without a render, picks it up from pointer events, and clears on blur', () => {
    getModifierKeys();
    // capture phase: a handler that stops propagation can't hide the key
    const stop = (event: Event) => event.stopPropagation();
    document.addEventListener('keydown', stop);
    fireEvent.keyDown(document.body, { key: 'Alt', altKey: true });
    document.removeEventListener('keydown', stop);
    expect(getModifierKeys().alt).toBe(true);

    // jsdom has no PointerEvent; a MouseEvent of that type carries the same flags
    window.dispatchEvent(new MouseEvent('pointermove', { metaKey: true }));
    expect(getModifierKeys()).toEqual({ alt: false, ctrl: false, meta: true, shift: false });

    window.dispatchEvent(new Event('blur'));
    expect(getModifierKeys().meta).toBe(false);
  });
});
