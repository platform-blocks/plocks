import { useSyncExternalStore } from 'react';

import { hasDOM } from '../../core/platform';

/** Which modifier keys are held down right now. */
export interface ModifierKeysState {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

const NONE: ModifierKeysState = Object.freeze({ alt: false, ctrl: false, meta: false, shift: false });

type Listener = () => void;

const listeners = new Set<Listener>();
let state: ModifierKeysState = NONE;
let tracking = false;

/** Every keyboard and pointer event carries the four modifier flags. */
type ModifierEvent = Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

function write(next: ModifierKeysState): void {
  if (
    next.alt === state.alt &&
    next.ctrl === state.ctrl &&
    next.meta === state.meta &&
    next.shift === state.shift
  ) {
    return;
  }
  state = next.alt || next.ctrl || next.meta || next.shift ? Object.freeze(next) : NONE;
  listeners.forEach((listener) => listener());
}

function sync(event: ModifierEvent): void {
  write({ alt: !!event.altKey, ctrl: !!event.ctrlKey, meta: !!event.metaKey, shift: !!event.shiftKey });
}

function clear(): void {
  write(NONE);
}

/**
 * Starts the one document-wide tracker (web). It stays attached for the life of
 * the page: three key/focus listeners plus pointer events, which also carry the
 * flags, so a modifier pressed while the window was in the background is
 * picked up on the first pointer move. Capture phase, so a handler that stops
 * propagation can't hide a key from it.
 */
function ensureTracking(): void {
  if (tracking || !hasDOM) return;
  tracking = true;
  const options: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener('keydown', sync, options);
  window.addEventListener('keyup', sync, options);
  window.addEventListener('pointerdown', sync, options);
  window.addEventListener('pointermove', sync, options);
  // A key released while the tab is in the background never reports its keyup.
  window.addEventListener('blur', clear);
}

/**
 * The modifier keys held right now, without a render: read it inside a gesture
 * or event handler (a drop that copies while ⌥ is down, a drag that goes fine
 * while ⇧ is down). The first call starts tracking, so call it once at module
 * load or mount (or mount `useModifierKeys`) when the very first read must
 * already be right. Web only; all `false` on native, which has no modifiers.
 */
export function getModifierKeys(): ModifierKeysState {
  ensureTracking();
  return state;
}

function subscribe(listener: Listener): () => void {
  ensureTracking();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getServerSnapshot = () => NONE;

/**
 * The modifier keys held right now (`{ alt, ctrl, meta, shift }`), re-rendering
 * only when one of them changes — for UI that answers a held modifier, like a
 * "copy" badge while ⌥ is down. One shared tracker serves every caller;
 * window blur releases everything. Use `getModifierKeys()` instead when only an
 * event handler needs the value. Web only; all `false` on native.
 */
export function useModifierKeys(): ModifierKeysState {
  return useSyncExternalStore(subscribe, getModifierKeys, getServerSnapshot);
}

/** Test helper: forgets the held state (the tracker stays attached). */
export function resetModifierKeys(): void {
  state = NONE;
}
