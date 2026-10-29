// Simple platform detection helper for charts package without importing full React Native Platform everywhere.
// We treat 'web' as presence of window & document objects.

/**
 * Checks if the current platform is web (browser)
 * @returns True if running in a browser environment
 */
export const isWeb = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Optional helper for SSR-safe window access
 * Returns undefined if window is not available
 */
export const safeWindow: (Window & typeof globalThis) | undefined = typeof window !== 'undefined' ? window : undefined;

// RN-web expands the 'System' family for <Text>, but an SVG <text> passes it to the
// browser verbatim, where it matches no font and falls back to the default serif.
const WEB_SYSTEM_FONT_STACK = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/**
 * Resolves a chart theme font family for SVG text. On web, 'System' (the theme
 * default) or no family becomes a system sans-serif stack; native passes through.
 */
export const resolveSvgFontFamily = (fontFamily?: string): string | undefined => {
  if (!isWeb()) return fontFamily;
  if (!fontFamily || fontFamily === 'System') return WEB_SYSTEM_FONT_STACK;
  return fontFamily;
};
