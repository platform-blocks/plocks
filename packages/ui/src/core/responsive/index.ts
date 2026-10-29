import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { DEFAULT_BREAKPOINT_VALUES } from '../theme/scales';
import { useTheme } from '../theme/ThemeProvider';
import { getBreakpoints, type BreakpointValues } from '../theme/tokens';
import {
  SERVER_VIEWPORT,
  getViewportSnapshot,
  subscribeViewport,
  type ViewportSize,
} from './viewportStore';

export {
  SERVER_VIEWPORT,
  getServerViewportSnapshot,
  getViewportSnapshot,
  subscribeViewport,
  type ViewportSize,
} from './viewportStore';
export type { BreakpointValues } from '../theme/tokens';

// Breakpoint system
export type Breakpoint = 'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Ascending breakpoint names. `base` is everything below `xs`. */
export const BREAKPOINT_ORDER: readonly Breakpoint[] = ['base', 'xs', 'sm', 'md', 'lg', 'xl'];

/**
 * Default breakpoint table — `DEFAULT_THEME.breakpoints` as numbers, plus `base`.
 * Hooks read the CURRENT theme's table (or a `BreakpointProvider` override).
 */
const BREAKPOINTS = {
  base: 0,
  ...DEFAULT_BREAKPOINT_VALUES,
} as const;

// Responsive value type - can be a single value or breakpoint object
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

// Common responsive types
export type ResponsiveSize = ResponsiveValue<number>;
export type ResponsiveString = ResponsiveValue<string>;
export type ResponsiveBoolean = ResponsiveValue<boolean>;

/** Viewport size plus the breakpoint it falls in. */
export interface ViewportState extends ViewportSize {
  breakpoint: Breakpoint;
}

/** The breakpoint a `width` falls in, against `values` (defaults to the default theme's table). */
export function getBreakpointForWidth(
  width: number,
  values: Partial<BreakpointValues> = DEFAULT_BREAKPOINT_VALUES
): Breakpoint {
  for (let i = BREAKPOINT_ORDER.length - 1; i > 0; i -= 1) {
    const name = BREAKPOINT_ORDER[i] as Exclude<Breakpoint, 'base'>;
    const min = values[name] ?? DEFAULT_BREAKPOINT_VALUES[name];
    if (width >= min) return name;
  }
  return 'base';
}

/** Whether breakpoint `current` is at or above `target`. */
export function isBreakpointAtLeast(current: Breakpoint, target: Breakpoint): boolean {
  return BREAKPOINT_ORDER.indexOf(current) >= BREAKPOINT_ORDER.indexOf(target);
}

const BreakpointValuesContext = createContext<BreakpointValues | null>(null);
const ServerViewportContext = createContext<ViewportSize>(SERVER_VIEWPORT);

export interface BreakpointProviderProps {
  /**
   * Override (some of) the theme's breakpoint widths, in px, for this subtree.
   * Omit to use `theme.breakpoints`.
   */
  breakpoints?: Partial<BreakpointValues>;
  /**
   * Viewport assumed while the page is statically rendered and hydrated (web
   * prerender has no window), for `useViewport`, `useBreakpoint` and everything
   * built on them in this subtree. Omit to inherit the parent's, which at the
   * root is a desktop-sized default (`SERVER_VIEWPORT`). A phone-first app
   * passes a phone size so a phone's first paint is already its own layout.
   */
  serverViewport?: ViewportSize;
  children?: React.ReactNode;
}

/**
 * Optional override of the breakpoint table for a subtree. The viewport itself
 * is tracked by one module-level store, so this provider no longer owns a
 * listener; without `breakpoints` it is a pass-through.
 * `PlocksProvider` mounts one automatically.
 */
function BreakpointProvider({ breakpoints, serverViewport, children }: BreakpointProviderProps) {
  const parent = useContext(BreakpointValuesContext);
  const parentServerViewport = useContext(ServerViewportContext);
  const serverWidth = serverViewport?.width;
  const serverHeight = serverViewport?.height;
  const server = useMemo<ViewportSize | null>(
    () =>
      serverWidth === undefined || serverHeight === undefined
        ? null
        : { width: serverWidth, height: serverHeight },
    [serverWidth, serverHeight]
  );
  const theme = useTheme();
  const themeValues = getBreakpoints(theme);
  const { xs, sm, md, lg, xl } = breakpoints ?? {};
  const value = useMemo<BreakpointValues | null>(() => {
    if (xs === undefined && sm === undefined && md === undefined && lg === undefined && xl === undefined) {
      return parent;
    }
    const base = parent ?? themeValues;
    return {
      xs: xs ?? base.xs,
      sm: sm ?? base.sm,
      md: md ?? base.md,
      lg: lg ?? base.lg,
      xl: xl ?? base.xl,
    };
  }, [parent, themeValues, xs, sm, md, lg, xl]);

  // Always the same two providers, so setting `serverViewport` later never
  // remounts the subtree.
  return React.createElement(
    ServerViewportContext.Provider,
    { value: server ?? parentServerViewport },
    React.createElement(BreakpointValuesContext.Provider, { value }, children)
  );
}

/** The breakpoint table in effect: a `BreakpointProvider` override, else `theme.breakpoints`. */
function useBreakpointValues(): BreakpointValues {
  const override = useContext(BreakpointValuesContext);
  const theme = useTheme();
  return override ?? getBreakpoints(theme);
}

export interface UseViewportOptions {
  /**
   * Size to report while the page is statically rendered and hydrated (web
   * prerender has no window). Defaults to the nearest `BreakpointProvider` /
   * `PlocksProvider` `serverViewport`, else a desktop size (`SERVER_VIEWPORT`).
   * Native never prerenders, so it always reads the real window.
   */
  serverViewport?: ViewportSize;
}

/**
 * The server snapshot for `size`: the shared default object when it matches, so
 * `useSyncExternalStore` gets a stable value without a cache per caller.
 */
function useServerViewport(size: ViewportSize | undefined): ViewportSize {
  const inherited = useContext(ServerViewportContext);
  const width = size?.width ?? inherited.width;
  const height = size?.height ?? inherited.height;
  return useMemo(
    () => (width === inherited.width && height === inherited.height ? inherited : { width, height }),
    [width, height, inherited]
  );
}

/**
 * Current viewport `{ width, height, breakpoint }`, re-rendering on every size
 * change. Hydration-safe: the server and the hydration pass see the prerender
 * size (`options.serverViewport`, else the provider's `serverViewport`, else a
 * desktop default), then the real one, so markup never mismatches. Prefer
 * `useBreakpoint()` when only the breakpoint matters.
 */
export function useViewport(options?: UseViewportOptions): ViewportState {
  const server = useServerViewport(options?.serverViewport);
  const getServerSnapshot = useCallback(() => server, [server]);
  const size = useSyncExternalStore(subscribeViewport, getViewportSnapshot, getServerSnapshot);
  const values = useBreakpointValues();
  return useMemo(
    () => ({ width: size.width, height: size.height, breakpoint: getBreakpointForWidth(size.width, values) }),
    [size, values]
  );
}

/**
 * Current breakpoint name. Only re-renders when the breakpoint changes, not on
 * every resize. Hook-order-safe and hydration-safe (server: the provider's
 * `serverViewport` breakpoint, `xl` by default).
 */
function useBreakpoint(): Breakpoint {
  const values = useBreakpointValues();
  const serverWidth = useContext(ServerViewportContext).width;
  const getSnapshot = useCallback(() => getBreakpointForWidth(getViewportSnapshot().width, values), [values]);
  const getServerSnapshot = useCallback(() => getBreakpointForWidth(serverWidth, values), [serverWidth, values]);
  return useSyncExternalStore(subscribeViewport, getSnapshot, getServerSnapshot);
}

// Utility to check if we're on mobile
const useIsMobile = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'base' || breakpoint === 'xs' || breakpoint === 'sm';
};

// Utility to resolve responsive values
const resolveResponsiveValue = <T>(
  value: ResponsiveValue<T>,
  currentBreakpoint: Breakpoint
): T => {
  // If it's not an object, return the value directly
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }

  // Array of breakpoints in order from largest to smallest
  const breakpointOrder: Breakpoint[] = ['xl', 'lg', 'md', 'sm', 'xs', 'base'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

  const responsiveObj = value as Partial<Record<Breakpoint, T>>;

  // Look for the closest breakpoint value, starting from current and going down
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (responsiveObj[bp] !== undefined) {
      return responsiveObj[bp] as T;
    }
  }

  // If no value found, return undefined (TypeScript will handle this)
  return undefined as T;
};

// Hook to resolve responsive values reactively
const useResponsiveValue = <T>(value: ResponsiveValue<T>): T => {
  const breakpoint = useBreakpoint();
  return resolveResponsiveValue(value, breakpoint);
};

// Utility function to create responsive styles for React Native
const createResponsiveStyle = <T extends object>(
  styleValue: ResponsiveValue<T>,
  breakpoint: Breakpoint
): T => {
  return resolveResponsiveValue(styleValue, breakpoint);
};

// Utility to check if a value is responsive
const isResponsiveValue = <T>(value: ResponsiveValue<T>): value is Partial<Record<Breakpoint, T>> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * CSS-in-JS output of `createResponsiveCSS`: the base declaration plus one
 * nested block per `@media (min-width: …)` query.
 */
type ResponsiveCSS = { [propertyOrMediaQuery: string]: string | Record<string, string> };

// CSS-in-JS style helper for web
const createResponsiveCSS = <T>(
  property: string,
  value: ResponsiveValue<T>,
  unit: string = '',
  breakpoints: Partial<BreakpointValues> = DEFAULT_BREAKPOINT_VALUES
): ResponsiveCSS => {
  if (Platform.OS !== 'web') {
    return {};
  }

  if (!isResponsiveValue(value)) {
    return { [property]: `${value}${unit}` };
  }

  const styles: ResponsiveCSS = {};

  Object.entries(value).forEach(([bp, val]) => {
    const breakpoint = bp as Breakpoint;
    if (val !== undefined) {
      if (breakpoint === 'base') {
        styles[property] = `${val}${unit}`;
      } else {
        const min = breakpoints[breakpoint] ?? BREAKPOINTS[breakpoint];
        const mediaQuery = `@media (min-width: ${min}px)`;
        const existing = styles[mediaQuery];
        const block = typeof existing === 'object' ? existing : {};
        block[property] = `${val}${unit}`;
        styles[mediaQuery] = block;
      }
    }
  });

  return styles;
};

// Export all utilities
export {
  BREAKPOINTS,
  BreakpointProvider,
  useBreakpoint,
  useBreakpointValues,
  useIsMobile,
  resolveResponsiveValue,
  useResponsiveValue,
  createResponsiveStyle,
  isResponsiveValue,
  createResponsiveCSS,
};
