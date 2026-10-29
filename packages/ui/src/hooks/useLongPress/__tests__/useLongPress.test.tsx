import { act, renderHook } from '@testing-library/react-native';

import { useLongPress } from '../useLongPress';

describe('useLongPress', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function setup(threshold?: number) {
    const onLongPress = jest.fn();
    const onStart = jest.fn();
    const onFinish = jest.fn();
    const onCancel = jest.fn();
    const hook = renderHook(() => useLongPress(onLongPress, { threshold, onStart, onFinish, onCancel }));
    return { ...hook, onLongPress, onStart, onFinish, onCancel };
  }

  it('fires onLongPress once after the threshold, then onFinish on release', () => {
    const { result, onLongPress, onStart, onFinish, onCancel } = setup();

    act(() => result.current.onPressIn());
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(399));
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(onLongPress).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(1000));
    expect(onLongPress).toHaveBeenCalledTimes(1);

    act(() => result.current.onPressOut());
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('respects a custom threshold', () => {
    const { result, onLongPress } = setup(100);
    act(() => result.current.onPressIn());
    act(() => jest.advanceTimersByTime(99));
    expect(onLongPress).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('cancels when released before the threshold', () => {
    const { result, onLongPress, onFinish, onCancel } = setup();

    act(() => result.current.onPressIn());
    act(() => jest.advanceTimersByTime(200));
    act(() => result.current.onPressOut());
    act(() => jest.advanceTimersByTime(1000));

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('cancels on onTouchCancel (system interrupt)', () => {
    const { result, onLongPress, onCancel } = setup();

    act(() => result.current.onPressIn());
    act(() => result.current.onTouchCancel());
    act(() => jest.advanceTimersByTime(1000));

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('starts a press once when several start handlers fire for it', () => {
    const { result, onLongPress, onStart, onFinish } = setup();

    act(() => {
      result.current.onTouchStart();
      result.current.onPressIn();
    });
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(400));
    expect(onLongPress).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onTouchEnd();
      result.current.onPressOut();
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('ignores a release with no press in progress', () => {
    const { result, onCancel, onFinish } = setup();
    act(() => result.current.onPressOut());
    act(() => result.current.onMouseLeave());
    expect(onCancel).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('does not fire after unmount', () => {
    const { result, unmount, onLongPress } = setup();
    act(() => result.current.onPressIn());
    unmount();
    act(() => jest.advanceTimersByTime(1000));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('returns stable handlers that call the latest callbacks', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = renderHook(({ cb }: { cb: () => void }) => useLongPress(cb), {
      initialProps: { cb: first },
    });
    const handlers = result.current;

    rerender({ cb: second });
    expect(result.current).toBe(handlers);

    act(() => result.current.onPressIn());
    act(() => jest.advanceTimersByTime(400));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
