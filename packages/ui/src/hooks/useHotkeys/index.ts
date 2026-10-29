import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useLatestCallback } from '../../core/hooks/useLatestCallback';
import { hasDOM, isWeb } from '../../core/platform';

export type KeyboardModifiers = {
  /** Whether the Alt key is pressed */
  alt?: boolean;
  /** Whether the Ctrl key is pressed */
  ctrl?: boolean;
  /** Whether the Meta (Cmd) key is pressed */
  meta?: boolean;
  /** Whether the Shift key is pressed */
  shift?: boolean;
};

/** Called with the DOM keyboard event that matched. */
export type HotkeyHandler = (event: KeyboardEvent) => void;

/**
 * Press and release handlers for one binding — the form for anything held:
 * push-to-talk, a modifier that changes what a drag does, a key that previews
 * while it is down.
 */
export interface HotkeyHandlers {
  /** Runs when the combination is pressed, and again on auto-repeat unless `repeat` is false. */
  keydown?: HotkeyHandler;
  /**
   * Runs when the key of a press that matched is released, whatever the
   * modifiers did in between (⇧A released after ⇧ still ends the ⇧A press). It
   * also runs, with a synthetic `keyup` event, when the window loses focus while
   * the key is held, and for every held binding when ⌘ is released (macOS
   * drops the keyups of keys let go while ⌘ is down).
   */
  keyup?: HotkeyHandler;
  /** Whether auto-repeat keydowns call `keydown` again. @default true */
  repeat?: boolean;
  /** Whether a matching press or release calls `preventDefault()` and `stopPropagation()`. @default true */
  preventDefault?: boolean;
}

export type HotkeyItem = [
  /**
   * Key combination like 'mod+k', 'escape', 'ctrl+j'. The last part may be a
   * modifier itself ('shift', 'alt', 'ctrl', 'meta', 'mod') to bind that key on
   * its own; 'space' is the space bar.
   */
  string,
  /** Press handler, or `{ keydown, keyup, repeat, preventDefault }` */
  HotkeyHandler | HotkeyHandlers,
  /** optional modifiers override */
  KeyboardModifiers?,
  /** optional description */
  string[]?
];

type ModifierName = keyof KeyboardModifiers;

const isApplePlatform = () =>
  isWeb && typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/** `event.key` (lowercased) of each modifier, and the flag it sets while down. */
const MODIFIER_KEYS: Record<string, { key: string; flag: ModifierName }> = {
  shift: { key: 'shift', flag: 'shift' },
  alt: { key: 'alt', flag: 'alt' },
  option: { key: 'alt', flag: 'alt' },
  ctrl: { key: 'control', flag: 'ctrl' },
  control: { key: 'control', flag: 'ctrl' },
  meta: { key: 'meta', flag: 'meta' },
  cmd: { key: 'meta', flag: 'meta' },
};

/** Names for keys whose `event.key` is awkward to write in a combination string. */
const KEY_ALIASES: Record<string, string> = { space: ' ' };

interface ParsedHotkey {
  modifiers: KeyboardModifiers;
  /** Lowercased `event.key` to match. */
  key: string;
  /** The modifier flag the key itself sets while down ('shift' binds Shift alone), else null. */
  ownFlag: ModifierName | null;
}

// Parse hotkey string into modifiers and key
function parseHotkey(hotkey: string): ParsedHotkey {
  const keys = hotkey.toLowerCase().split('+');
  let key = keys[keys.length - 1];
  const modifiers: KeyboardModifiers = {};

  for (let i = 0; i < keys.length - 1; i++) {
    const modifier = keys[i];
    switch (modifier) {
      case 'mod':
        // 'mod' maps to cmd on Mac, ctrl on others
        if (isApplePlatform()) {
          modifiers.meta = true;
        } else {
          modifiers.ctrl = true;
        }
        break;
      case 'ctrl':
        modifiers.ctrl = true;
        break;
      case 'alt':
        modifiers.alt = true;
        break;
      case 'meta':
      case 'cmd':
        modifiers.meta = true;
        break;
      case 'shift':
        modifiers.shift = true;
        break;
    }
  }

  if (key === 'mod') key = isApplePlatform() ? 'meta' : 'ctrl';
  const own = MODIFIER_KEYS[key];
  if (own) return { modifiers, key: own.key, ownFlag: own.flag };
  return { modifiers, key: KEY_ALIASES[key] ?? key, ownFlag: null };
}

// Check if event matches the hotkey
function matchesHotkey(
  event: KeyboardEvent,
  modifiers: KeyboardModifiers,
  key: string,
  ownFlag: ModifierName | null = null
): boolean {
  // Check key match (case insensitive)
  if (typeof event.key !== 'string' || event.key.toLowerCase() !== key.toLowerCase()) {
    return false;
  }

  // Check modifiers. A modifier bound on its own is down during its own press,
  // so its flag is not compared.
  if (ownFlag !== 'alt' && !!modifiers.alt !== !!event.altKey) return false;
  if (ownFlag !== 'ctrl' && !!modifiers.ctrl !== !!event.ctrlKey) return false;
  if (ownFlag !== 'meta' && !!modifiers.meta !== !!event.metaKey) return false;
  if (ownFlag !== 'shift' && !!modifiers.shift !== !!event.shiftKey) return false;

  return true;
}

/** Typing in a field keeps its keys (Escape excepted). */
function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  return (
    !!target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.contentEditable === 'true')
  );
}

function handlersOf(handler: HotkeyItem[1]): HotkeyHandlers {
  return typeof handler === 'function' ? { keydown: handler } : handler ?? {};
}

/** The physical key a press came from, so its release is found whatever the modifiers did. */
const pressId = (event: KeyboardEvent) => event.code || event.key?.toLowerCase() || '';

interface HeldPress {
  combo: string;
  /** The binding's handlers when it was pressed: the release falls back to them if it is gone. */
  handlers: HotkeyHandlers;
  key: string;
  code: string;
}

/**
 * Shared keydown/keyup matching for `useHotkeys` and the global manager.
 * `items` is read on every event, so handlers are always the latest.
 */
function createHotkeyRouter(items: () => Iterable<HotkeyItem>) {
  const held = new Map<string, HeldPress>();

  const current = (press: HeldPress): HotkeyHandlers => {
    for (const [combo, handler] of items()) {
      if (combo === press.combo) return handlersOf(handler);
    }
    return press.handlers;
  };

  const release = (id: string, event: KeyboardEvent) => {
    const press = held.get(id);
    if (!press) return false;
    held.delete(id);
    const handlers = current(press);
    if (handlers.keyup && handlers.preventDefault !== false) {
      event.preventDefault();
      event.stopPropagation();
    }
    handlers.keyup?.(event);
    return true;
  };

  /** Ends every held press with a synthetic keyup (focus lost, ⌘ released). */
  const releaseAll = () => {
    for (const [id, press] of Array.from(held)) {
      const event =
        typeof KeyboardEvent === 'function'
          ? new KeyboardEvent('keyup', { key: press.key, code: press.code })
          : ({ type: 'keyup', key: press.key, code: press.code, preventDefault() {}, stopPropagation() {} } as unknown as KeyboardEvent);
      release(id, event);
    }
  };

  const keydown = (event: KeyboardEvent) => {
    // Don't trigger hotkeys when user is typing in input fields
    // Exception: allow escape key to work in input fields
    if (isTypingTarget(event) && event.key !== 'Escape') return;

    for (const [combo, handler, customModifiers] of items()) {
      const { modifiers, key, ownFlag } = parseHotkey(combo);
      if (!matchesHotkey(event, customModifiers || modifiers, key, ownFlag)) continue;

      const handlers = handlersOf(handler);
      if (handlers.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }
      const id = pressId(event);
      // A fresh press of a key still marked held means its keyup was lost
      // (released while ⌘ was down, or in another window): end that one first.
      if (!event.repeat && held.has(id)) release(id, event);
      if (handlers.keyup && !held.has(id)) {
        held.set(id, { combo, handlers, key: event.key, code: event.code });
      }
      if (!event.repeat || handlers.repeat !== false) handlers.keydown?.(event);
      break; // Only trigger first matching hotkey
    }
  };

  const keyup = (event: KeyboardEvent) => {
    // macOS never delivers the keyups of keys released while ⌘ was down, so
    // letting go of ⌘ ends every press.
    if (event.key === 'Meta') {
      release(pressId(event), event);
      releaseAll();
      return;
    }
    release(pressId(event), event);
  };

  return { keydown, keyup, releaseAll };
}

// Main useHotkeys hook
/**
 * Document-level keyboard shortcuts (web; no-op on native).
 *
 * Each binding is `[combo, handler]` or `[combo, { keydown, keyup, repeat,
 * preventDefault }]`; `keyup` runs when the key of a press that matched is
 * released (or the window loses focus while it is held), which is how a held
 * key is tracked. A modifier can be bound on its own (`'shift'`, `'alt'`).
 *
 * Handlers are always the latest ones passed — the listeners are attached once
 * and read the current `hotkeys` on every key event — so inline handlers never
 * go stale and never cause re-subscription.
 */
export function useHotkeys(hotkeys: HotkeyItem[]) {
  const readHotkeys = useLatestCallback(() => hotkeys);
  const [router] = useState(() => createHotkeyRouter(() => readHotkeys() ?? []));

  useEffect(() => {
    if (!hasDOM) {
      return;
    }

    document.addEventListener('keydown', router.keydown);
    document.addEventListener('keyup', router.keyup);
    window.addEventListener('blur', router.releaseAll);
    return () => {
      document.removeEventListener('keydown', router.keydown);
      document.removeEventListener('keyup', router.keyup);
      window.removeEventListener('blur', router.releaseAll);
      // Unmounting mid-press still ends the press.
      router.releaseAll();
    };
  }, [router]);
}

// Global hotkey manager
class GlobalHotkeyManager {
  private hotkeys: Map<string, HotkeyItem> = new Map();
  private isListening = false;
  private currentAppState: AppStateStatus | 'active' | 'background' = 'active';
  private appStateSubscription?: { remove?: () => void } | (() => void);
  private visibilityCleanup?: () => void;

  constructor() {
    if (isWeb) {
      if (hasDOM) {
        this.currentAppState = document.hidden ? 'background' : 'active';
        const handleVisibility = () => {
          this.currentAppState = document.hidden ? 'background' : 'active';
          this.syncListening();
        };
        document.addEventListener('visibilitychange', handleVisibility, { passive: true });
        this.visibilityCleanup = () => document.removeEventListener('visibilitychange', handleVisibility);
      }
    } else if (typeof AppState?.addEventListener === 'function') {
      try {
        const state = AppState.currentState;
        if (state) {
          this.currentAppState = state;
        }
      } catch {
        this.currentAppState = 'active';
      }

      const subscriber = AppState.addEventListener('change', this.handleAppStateChange);
      this.appStateSubscription = subscriber ?? undefined;
    }
  }

  register(id: string, hotkey: HotkeyItem) {
    this.hotkeys.set(id, hotkey);
    this.syncListening();
  }

  unregister(id: string) {
    this.hotkeys.delete(id);
    this.syncListening();
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    this.currentAppState = nextState;
    this.syncListening();
  };

  private isForeground() {
    return this.currentAppState === 'active' || (this.currentAppState as string) === 'foreground';
  }

  private syncListening() {
    if (!hasDOM) {
      return;
    }

    const shouldListen = this.hotkeys.size > 0 && this.isForeground();
    if (shouldListen && !this.isListening) {
      document.addEventListener('keydown', this.router.keydown);
      document.addEventListener('keyup', this.router.keyup);
      window.addEventListener('blur', this.router.releaseAll);
      this.isListening = true;
    } else if (!shouldListen && this.isListening) {
      this.stopListening();
    }
  }

  private stopListening() {
    document.removeEventListener('keydown', this.router.keydown);
    document.removeEventListener('keyup', this.router.keyup);
    window.removeEventListener('blur', this.router.releaseAll);
    this.isListening = false;
    // Backgrounded or emptied mid-press: still end the press.
    this.router.releaseAll();
  }

  private router = createHotkeyRouter(() => this.hotkeys.values());

  dispose() {
    if (hasDOM && this.isListening) {
      this.stopListening();
    }

    if (typeof this.visibilityCleanup === 'function') {
      this.visibilityCleanup();
      this.visibilityCleanup = undefined;
    }

    const subscription = this.appStateSubscription;
    if (subscription) {
      if (typeof subscription === 'function') {
        subscription();
      } else {
        subscription.remove?.();
      }
      this.appStateSubscription = undefined;
    }
  }
}

export const globalHotkeys = new GlobalHotkeyManager();

// Hook for global hotkeys that persist across component unmounts
/**
 * Registers a shortcut with the global manager under `id` (one handler per id).
 * The handler is always the latest one passed; the registration only changes
 * when the id, key combination, modifiers or `enabled` change.
 */
export function useGlobalHotkeys(id: string, hotkey: HotkeyItem, enabled: boolean = true) {
  const [combo, handler, modifiers, description] = hotkey;
  const latestHandlers = useLatestCallback(() => handlersOf(handler));
  // One stable registration that forwards to the latest handlers, flags included.
  const [proxy] = useState<HotkeyHandlers>(() => ({
    keydown: (event) => latestHandlers()?.keydown?.(event),
    get keyup() {
      return latestHandlers()?.keyup ? (event: KeyboardEvent) => latestHandlers()?.keyup?.(event) : undefined;
    },
    get repeat() {
      return latestHandlers()?.repeat;
    },
    get preventDefault() {
      return latestHandlers()?.preventDefault;
    },
  }));
  const modifiersKey = modifiers ? JSON.stringify(modifiers) : '';
  const descriptionKey = description ? description.join('\u0000') : '';

  useEffect(() => {
    if (!enabled) return undefined;
    const parsedModifiers: KeyboardModifiers | undefined = modifiersKey ? JSON.parse(modifiersKey) : undefined;
    const parsedDescription = descriptionKey ? descriptionKey.split('\u0000') : undefined;
    globalHotkeys.register(id, [combo, proxy, parsedModifiers, parsedDescription]);
    return () => globalHotkeys.unregister(id);
  }, [id, combo, modifiersKey, descriptionKey, enabled, proxy]);
}

// Convenience hooks for common patterns

// Escape is owned by the overlay layer stack (one listener, topmost layer
// only); useEscapeKey is a layer, not a hotkey.
export { useEscapeKey } from '../useEscapeKey/useEscapeKey';

export function useToggleColorScheme(handler: () => void, enabled = true) {
  useHotkeys(enabled ? [['ctrl+j', handler]] : []);
}

export function useSpotlightToggle(handler: () => void, enabled = true) {
  useGlobalHotkeys('spotlight-toggle', ['mod+k', handler], enabled);
}
