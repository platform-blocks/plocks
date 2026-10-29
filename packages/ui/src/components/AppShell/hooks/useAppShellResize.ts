import { useCallback, useMemo, useState } from 'react';

import { useLatestCallback } from '../../../core/hooks/useLatestCallback';
import { usePersistedState, type PersistedStateStorage } from '../../../hooks/usePersistedState/usePersistedState';
import type {
  AppShellResizeCollapsible,
  AppShellResizeSection,
  AppShellResizeStore,
  AppShellResizeSectionOptions,
  AppShellResizeSizes,
  ResolvedAppShellResizeSection,
  UseAppShellResizeOptions,
  UseAppShellResizeReturn,
} from '../types';

const SECTIONS: readonly AppShellResizeSection[] = ['navbar', 'aside', 'header', 'footer'];

/** Bounds a section gets when its options leave them out. */
const DEFAULT_BOUNDS: Record<AppShellResizeSection, { min: number; max: number }> = {
  navbar: { min: 160, max: 480 },
  aside: { min: 160, max: 480 },
  header: { min: 40, max: 200 },
  footer: { min: 32, max: 200 },
};

const DEFAULT_LABELS: Record<AppShellResizeSection, string> = {
  navbar: 'Resize navigation',
  aside: 'Resize aside',
  header: 'Resize header',
  footer: 'Resize footer',
};

const EMPTY_SIZES: AppShellResizeSizes = Object.freeze({}) as AppShellResizeSizes;

/** Storage that never stores: lets `usePersistedState` be called unconditionally without a `storageKey`. */
const NO_STORAGE: PersistedStateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function createStore(): AppShellResizeStore {
  const listeners = new Set<() => void>();
  let active: AppShellResizeSection | null = null;
  let live: AppShellResizeSizes = EMPTY_SIZES;
  const notify = () => listeners.forEach((listener) => listener());
  const store: AppShellResizeStore = {
    getActive: () => active,
    getLive: () => live,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    begin: (section) => {
      active = section;
      live = EMPTY_SIZES;
      notify();
    },
    move: (section, size) => {
      if (live[section] === size) return;
      live = { ...live, [section]: size };
      if (size !== undefined) store.writer?.(section, size);
      notify();
    },
    end: () => {
      if (active === null && live === EMPTY_SIZES) return;
      active = null;
      live = EMPTY_SIZES;
      notify();
    },
    writer: null,
  };
  return store;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function resolveSection(
  section: AppShellResizeSection,
  options: AppShellResizeSectionOptions | boolean | undefined
): ResolvedAppShellResizeSection | undefined {
  if (!options) return undefined;
  const given = options === true ? {} : options;
  const min = given.min ?? Math.min(DEFAULT_BOUNDS[section].min, given.max ?? Infinity);
  const max = Math.max(min, given.max ?? DEFAULT_BOUNDS[section].max);
  return {
    min,
    max,
    defaultSize: given.defaultSize === undefined ? undefined : clamp(given.defaultSize, min, max),
    collapseThreshold: given.collapseThreshold,
    onCollapse: given.onCollapse,
    label: given.label ?? DEFAULT_LABELS[section],
  };
}

/**
 * Drag handles for `AppShell`'s sections: pass the result to
 * `<AppShell resize={…}>`. The navbar and aside resize horizontally, the
 * header and footer vertically — by pointer or touch drag, or from the
 * keyboard on the focused handle (arrows step `step` px, Shift+arrows
 * `shiftStep` px, Home/End jump to `min`/`max`, Enter or a double-click
 * resets). Only the sections named in `options` get a handle; `true` takes
 * the defaults.
 *
 * Sizes are px and override the section's configured `width`/`height` while
 * the section is resizable. Dragging below a section's `collapseThreshold`
 * collapses it — the navbar to its rail (`navbar.collapsedWidth`, the same
 * state `closeNavbar()` sets), the aside, header and footer to nothing — and
 * calls `onCollapse`; dragging back out expands it again. A collapsed aside,
 * header or footer keeps its handle on the shell's edge so it can be dragged
 * (or Enter-reset) back.
 *
 * Resizing is off wherever the section is not inline: the navbar below
 * `navbar.breakpoint` and on native (it is a drawer there), the aside below
 * `aside.breakpoint` and on native. The header and footer resize everywhere.
 *
 * `sizes` updates when a drag ends (and on every keyboard step); in between,
 * the shell moves on its own without re-rendering the component that owns
 * this hook, and `onSizeChange` reports each frame.
 *
 * With `storageKey`, sizes are kept with `usePersistedState` (localStorage on
 * the web, AsyncStorage on native when installed). Collapsed state is not
 * persisted.
 *
 * @example
 * const resize = useAppShellResize({
 *   navbar: { min: 200, max: 400, collapseThreshold: 120 },
 *   aside: true,
 * });
 * <AppShell navbar={{ width: 260 }} aside={{ width: 240 }} resize={resize}>…</AppShell>
 */
export function useAppShellResize(options: UseAppShellResizeOptions = {}): UseAppShellResizeReturn {
  const { step = 10, shiftStep = 50, storageKey } = options;

  const sections = useMemo(
    () => ({
      navbar: resolveSection('navbar', options.navbar),
      aside: resolveSection('aside', options.aside),
      header: resolveSection('header', options.header),
      footer: resolveSection('footer', options.footer),
    }),
    // Options objects are usually inline; key the memo on their contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionKey(options.navbar), sectionKey(options.aside), sectionKey(options.header), sectionKey(options.footer)]
  );
  // `onCollapse` is read from the latest options, not the memo above.
  const latestSections = useLatestCallback((section: AppShellResizeSection) => resolveSection(section, options[section]));

  const onSizeChange = useLatestCallback(options.onSizeChange);
  const onResizeEnd = useLatestCallback(options.onResizeEnd);

  // Sizes the user has set, on top of each section's `defaultSize`. Kept in
  // `usePersistedState` when there is a `storageKey`, in plain state otherwise
  // (both hooks always run; only one is read).
  const [localOverrides, setLocalOverrides] = useState<AppShellResizeSizes>(EMPTY_SIZES);
  const [storedOverrides, setStoredOverrides] = usePersistedState<AppShellResizeSizes>(
    storageKey ?? '',
    EMPTY_SIZES,
    storageKey ? undefined : { storage: NO_STORAGE }
  );
  const overrides = storageKey ? storedOverrides : localOverrides;
  const setOverrides = storageKey ? setStoredOverrides : setLocalOverrides;

  const [collapsed, setCollapsedState] = useState<Record<AppShellResizeCollapsible, boolean>>({
    aside: false,
    header: false,
    footer: false,
  });

  const [store] = useState(createStore);

  const sizes = useMemo(() => {
    const next: AppShellResizeSizes = {};
    for (const section of SECTIONS) {
      const resolved = sections[section];
      if (!resolved) continue;
      const value = overrides?.[section] ?? resolved.defaultSize;
      if (typeof value === 'number' && Number.isFinite(value)) next[section] = clamp(value, resolved.min, resolved.max);
    }
    return next;
  }, [overrides, sections]);

  const commitSize = useCallback(
    (section: AppShellResizeSection, size: number): number | undefined => {
      const resolved = sections[section];
      if (!resolved || !Number.isFinite(size)) return undefined;
      const next = clamp(size, resolved.min, resolved.max);
      setOverrides((previous) => (previous?.[section] === next ? previous : { ...previous, [section]: next }));
      return next;
    },
    [sections, setOverrides]
  );

  const setSize = useCallback(
    (section: AppShellResizeSection, size: number) => {
      const next = commitSize(section, size);
      if (next !== undefined) onSizeChange(section, next);
    },
    [commitSize, onSizeChange]
  );

  const setCollapsed = useCallback((section: AppShellResizeCollapsible, value: boolean) => {
    setCollapsedState((previous) => (previous[section] === value ? previous : { ...previous, [section]: value }));
  }, []);

  const reset = useCallback(
    (section?: AppShellResizeSection) => {
      const targets = section ? [section] : SECTIONS;
      setOverrides((previous) => {
        if (!previous) return EMPTY_SIZES;
        const next = { ...previous };
        for (const target of targets) delete next[target];
        return next;
      });
      setCollapsedState((previous) => {
        const next = { ...previous };
        for (const target of targets) if (target !== 'navbar') next[target] = false;
        return next;
      });
    },
    [setOverrides]
  );

  return useMemo<UseAppShellResizeReturn>(
    () => ({
      sizes,
      collapsed,
      setSize,
      setCollapsed,
      reset,
      commitSize,
      sections,
      step,
      shiftStep,
      store,
      getSectionOptions: latestSections,
      notifySizeChange: onSizeChange,
      notifyResizeEnd: onResizeEnd,
    }),
    [sizes, collapsed, setSize, setCollapsed, reset, commitSize, sections, step, shiftStep, store, latestSections, onSizeChange, onResizeEnd]
  );
}

/** A section's options as a memo key: its bounds and label (callbacks are read through a ref). */
function sectionKey(options: AppShellResizeSectionOptions | boolean | undefined): string {
  if (!options) return '';
  if (options === true) return 'on';
  return [options.min, options.max, options.defaultSize, options.collapseThreshold, options.label].join('|');
}
