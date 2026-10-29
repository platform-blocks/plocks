import { act, fireEvent, renderHook } from '@testing-library/react';

import { useGlobalHotkeys, useHotkeys } from '../index';

describe('useHotkeys (web)', () => {
  it('always calls the latest handler without re-subscribing', () => {
    const add = jest.spyOn(document, 'addEventListener');
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = renderHook(({ handler }: { handler: () => void }) => useHotkeys([['mod+k', handler], ['escape', handler]]), {
      initialProps: { handler: first },
    });
    const keydownSubscriptions = () => add.mock.calls.filter(([type]) => type === 'keydown').length;
    expect(keydownSubscriptions()).toBe(1);

    rerender({ handler: second });
    expect(keydownSubscriptions()).toBe(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    add.mockRestore();
  });

  it('ignores typing in inputs except Escape', () => {
    const handler = jest.fn();
    renderHook(() => useHotkeys([['k', handler], ['escape', handler]]));
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'k' });
    expect(handler).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(handler).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('runs keyup when the key of a matched press is released, whatever the modifiers did', () => {
    const down = jest.fn();
    const up = jest.fn();
    renderHook(() => useHotkeys([['shift+a', { keydown: down, keyup: up }]]));
    fireEvent.keyDown(document, { key: 'A', code: 'KeyA', shiftKey: true });
    expect(down).toHaveBeenCalledTimes(1);
    // Shift let go first: the A press still ends on A's keyup
    fireEvent.keyUp(document, { key: 'Shift', code: 'ShiftLeft' });
    expect(up).not.toHaveBeenCalled();
    fireEvent.keyUp(document, { key: 'a', code: 'KeyA' });
    expect(up).toHaveBeenCalledTimes(1);
    // a release without a matched press does nothing
    fireEvent.keyUp(document, { key: 'a', code: 'KeyA' });
    expect(up).toHaveBeenCalledTimes(1);
  });

  it('binds a modifier on its own, for a held state', () => {
    let held = false;
    renderHook(() =>
      useHotkeys([['alt', { keydown: () => (held = true), keyup: () => (held = false), preventDefault: false }]])
    );
    const down = new KeyboardEvent('keydown', { key: 'Alt', code: 'AltLeft', altKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(down);
    expect(held).toBe(true);
    expect(down.defaultPrevented).toBe(false);
    fireEvent.keyUp(document, { key: 'Alt', code: 'AltLeft', altKey: false });
    expect(held).toBe(false);
  });

  it('skips auto-repeat with repeat: false, and keeps repeating by default', () => {
    const once = jest.fn();
    const every = jest.fn();
    renderHook(() => useHotkeys([['x', { keydown: once, repeat: false }], ['y', every]]));
    fireEvent.keyDown(document, { key: 'x', code: 'KeyX' });
    fireEvent.keyDown(document, { key: 'x', code: 'KeyX', repeat: true });
    fireEvent.keyDown(document, { key: 'y', code: 'KeyY' });
    fireEvent.keyDown(document, { key: 'y', code: 'KeyY', repeat: true });
    expect(once).toHaveBeenCalledTimes(1);
    expect(every).toHaveBeenCalledTimes(2);
  });

  it('ends held presses when the window loses focus, when ⌘ is released, and on unmount', () => {
    const up = jest.fn();
    const { unmount } = renderHook(() =>
      useHotkeys([['space', { keyup: up }], ['meta+k', { keyup: up }], ['z', { keyup: up }]])
    );
    fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(up).toHaveBeenCalledTimes(1);
    expect(up.mock.calls[0][0].type).toBe('keyup');

    // macOS drops K's keyup while ⌘ is down; letting go of ⌘ ends the press
    fireEvent.keyDown(document, { key: 'k', code: 'KeyK', metaKey: true });
    fireEvent.keyUp(document, { key: 'Meta', code: 'MetaLeft' });
    expect(up).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'z', code: 'KeyZ' });
    unmount();
    expect(up).toHaveBeenCalledTimes(3);
  });

  it('ends a press whose keyup was lost before starting it again', () => {
    const down = jest.fn();
    const up = jest.fn();
    renderHook(() => useHotkeys([['q', { keydown: down, keyup: up }]]));
    fireEvent.keyDown(document, { key: 'q', code: 'KeyQ' });
    fireEvent.keyDown(document, { key: 'q', code: 'KeyQ' });
    expect(down).toHaveBeenCalledTimes(2);
    expect(up).toHaveBeenCalledTimes(1);
  });

  it('supports keyup in global hotkeys, with the latest handlers', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ up }: { up: () => void }) => useGlobalHotkeys('test-hold', ['g', { keyup: up }]),
      { initialProps: { up: first } }
    );
    fireEvent.keyDown(document, { key: 'g', code: 'KeyG' });
    rerender({ up: second });
    fireEvent.keyUp(document, { key: 'g', code: 'KeyG' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
  });
});

