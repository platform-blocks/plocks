import { useEffect, useMemo, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';

import { useLatestCallback } from '../../core/hooks/useLatestCallback';
import type { WebMouseEvent } from '../../core/platform/webProps';

/** The event a press handler received: RN's responder event, or a DOM mouse event on web. */
export type UseLongPressEvent = GestureResponderEvent | WebMouseEvent;

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

const DEFAULT_THRESHOLD = 400;
/** Browsers replay a touch as mouse events shortly after `touchend`; ignore those. */
const TOUCH_MOUSE_REPLAY_MS = 500;

/**
 * Calls `onLongPress` once a press has been held for `threshold` ms, and
 * returns handlers to spread onto a `Pressable` or `View`. Cross-platform:
 * RN `onPressIn` / `onPressOut` / `onTouchCancel`, plus the DOM mouse and
 * touch events react-native-web forwards from plain Views. A platform firing
 * several of them for one press (web: `onMouseDown` and `onPressIn`) starts
 * it once; releasing, leaving or a system interrupt before the threshold
 * cancels it.
 *
 * The handlers object is stable for the component's lifetime.
 *
 * @example
 * const handlers = useLongPress(() => setOpened(true), { threshold: 600 });
 * return <Pressable {...handlers}>…</Pressable>;
 */
export function useLongPress(
  onLongPress: (event?: UseLongPressEvent) => void,
  options: UseLongPressOptions = {}
): UseLongPressHandlers {
  const { threshold = DEFAULT_THRESHOLD } = options;

  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const longPress = useLatestCallback(onLongPress);
  const start = useLatestCallback(options.onStart);
  const finish = useLatestCallback(options.onFinish);
  const cancel = useLatestCallback(options.onCancel);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);
  const firedRef = useRef(false);
  const lastTouchEndRef = useRef(0);

  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    },
    []
  );

  return useMemo<UseLongPressHandlers>(() => {
    const begin = (event?: UseLongPressEvent) => {
      if (pressedRef.current) return;
      pressedRef.current = true;
      firedRef.current = false;
      start(event);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        firedRef.current = true;
        longPress(event);
      }, thresholdRef.current);
    };

    const end = (event?: UseLongPressEvent) => {
      if (!pressedRef.current) return;
      pressedRef.current = false;
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (firedRef.current) finish(event);
      else cancel(event);
      firedRef.current = false;
    };

    const endTouch = (event?: GestureResponderEvent) => {
      lastTouchEndRef.current = Date.now();
      end(event);
    };

    const beginMouse = (event?: WebMouseEvent) => {
      if (Date.now() - lastTouchEndRef.current < TOUCH_MOUSE_REPLAY_MS) return;
      begin(event);
    };

    return {
      onPressIn: begin,
      onPressOut: end,
      onTouchStart: begin,
      onTouchEnd: endTouch,
      onTouchCancel: endTouch,
      onMouseDown: beginMouse,
      onMouseUp: end,
      onMouseLeave: end,
    };
  }, [longPress, start, finish, cancel]);
}
