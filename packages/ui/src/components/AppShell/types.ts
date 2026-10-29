import type React from 'react';
import type { Role, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { Breakpoint as ResponsiveBreakpoint } from '../../core/responsive';
import type { BaseProps } from '../../core/types/base';

/**
 * A size that can change per breakpoint. Numbers are px; strings are parsed as
 * px (`'240'`, `'240px'`). The navbar's drawer width also accepts viewport
 * relative strings (`'100%'`, `'80vw'`, `'full'`).
 */
export type ResponsiveSize = number | string | {
  base?: number | string;
  xs?: number | string;
  sm?: number | string;
  md?: number | string;
  lg?: number | string;
  xl?: number | string;
};

/**
 * Breakpoint names. Widths come from `theme.breakpoints` (xs 480, sm 576,
 * md 768, lg 992, xl 1200 by default); `base` is everything below `xs`.
 */
export type Breakpoint = ResponsiveBreakpoint;

export interface HeaderConfig {
  height: ResponsiveSize;
  /** Hide the header: `AppShell.Header` renders nothing and reserves no height. @default false */
  collapsed?: boolean;
  /**
   * Whether the main content starts below the header. `false` lets content run
   * underneath it (e.g. a translucent header over a hero image). @default true
   */
  offset?: boolean;
  /** Stacking order of `AppShell.Header`. @default theme.zIndices.header */
  zIndex?: number;
}

export interface NavbarConfig {
  width: ResponsiveSize;
  /**
   * Narrowest viewport at which the navbar is an inline rail (web). Below it the
   * navbar is an overlay drawer. Native apps always use the drawer. @default 'md'
   */
  breakpoint?: Breakpoint;
  /**
   * Initial state. `mobile: false` starts the drawer open; `desktop: true`
   * starts the desktop navbar collapsed to its rail (`startCollapsedDesktop`
   * takes precedence). The state resets when the viewport crosses `breakpoint`.
   */
  collapsed?: {
    mobile?: boolean;
    desktop?: boolean;
  };
  /**
   * Stacking order of the inline rail. @default theme.zIndices.sticky
   * (The drawer uses `theme.zIndices.overlay`, above the header; set
   * `AppShell.Navbar zIndex` to override both.)
   */
  zIndex?: number;
  collapsedWidth?: number;
  expandOnHover?: boolean;
  /**
   * When paired with `expandOnHover`, hovering the collapsed rail pushes the
   * main content aside (flexing the page) instead of overlaying it.
   * Defaults to `false` (overlay) to preserve existing behavior.
   */
  expandOnHoverPush?: boolean;
  /**
   * Auto-expand the navbar (start open, not a collapsed rail) once the viewport
   * reaches this breakpoint or wider, e.g. `'xl'`. Overrides
   * `startCollapsedDesktop` at/above the breakpoint; smaller desktops keep the
   * collapsed-with-hover behavior.
   */
  autoExpandBreakpoint?: Breakpoint;
  startCollapsedDesktop?: boolean;
}

export interface AsideConfig {
  width: ResponsiveSize;
  /** Narrowest viewport at which `collapsed.desktop` applies; below it `collapsed.mobile` does. @default 'md' */
  breakpoint?: Breakpoint;
  collapsed?: {
    /** @default true */
    mobile?: boolean;
    /** @default false */
    desktop?: boolean;
  };
  /** Stacking order of `AppShell.Aside`. @default theme.zIndices.sticky */
  zIndex?: number;
}

export interface FooterConfig {
  height: ResponsiveSize;
  /** Hide the footer: `AppShell.Footer` renders nothing and reserves no height. @default false */
  collapsed?: boolean;
  /** Whether the main content ends above the footer. `false` lets content run underneath it. @default true */
  offset?: boolean;
  /** Stacking order of `AppShell.Footer`. @default theme.zIndices.sticky */
  zIndex?: number;
}

export interface BottomNavConfig {
  height: ResponsiveSize;
  /** Only show the bottom navigation at mobile widths (and on native). @default true */
  showOnlyMobile?: boolean;
  /** Hide the bottom navigation. @default false */
  collapsed?: boolean;
  /** Stacking order of `AppShell.BottomNav`. @default theme.zIndices.sticky */
  zIndex?: number;
}

export interface LayoutVisibilityConfig {
  header?: boolean;
  navbar?: boolean;
  aside?: boolean;
  footer?: boolean;
  bottomNav?: boolean;
}

// Mobile navigation patterns
export interface MobileMenuConfig {
  type?: 'modal' | 'drawer' | 'fullscreen';
  animationType?: 'slide' | 'fade' | 'none';
  showBackdrop?: boolean;
  closeOnOutsidePress?: boolean;
  /** Open/close transition length in ms; `0` shows and hides instantly. @default 300 */
  transitionDuration?: number;
}

export interface StatusBarConfig {
  style?: 'auto' | 'light' | 'dark';
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}

export type LayoutType = 'default' | 'alt' | 'mobile-bottom-nav' | 'mobile-tabs';

// Unified internal layout strategies used by context/layout calculators
export type LayoutStrategy =
  | 'desktop-default'
  | 'desktop-alt'
  | 'mobile-bottom-nav'
  | 'adaptive';

export interface AppShellProps extends BaseProps<ViewStyle> {
  /**
   * `'default'`: the header spans the full width and the navbar/aside sit
   * below it. `'alt'`: the navbar and aside span the full height and the
   * header sits between them. @default 'default'
   */
  layout?: 'default' | 'alt';
  header?: HeaderConfig;
  navbar?: NavbarConfig;
  aside?: AsideConfig;
  footer?: FooterConfig;
  bottomNav?: BottomNavConfig;
  showHeader?: boolean;
  /** Toggle rendering of individual autoLayout sections */
  layoutSections?: LayoutVisibilityConfig;
  /** Enable AppShell auto-composition. When true, AppShell will render its own Header/Navbar/Main/Footer/BottomBar using the provided content props instead of relying on children. */
  autoLayout?: boolean;
  /** Content to render inside AppShell.Header when autoLayout is enabled */
  headerContent?: React.ReactNode | (() => React.ReactNode);
  /** Content to render inside AppShell.Navbar when autoLayout is enabled */
  navbarContent?: React.ReactNode | (() => React.ReactNode);
  /** Content to render inside AppShell.Aside when autoLayout is enabled */
  asideContent?: React.ReactNode | (() => React.ReactNode);
  /** Content to render inside AppShell.Footer when autoLayout is enabled */
  footerContent?: React.ReactNode | (() => React.ReactNode);
  /** Items for a mobile bottom navigation bar when autoLayout is enabled */
  bottomNavItems?: BottomAppBarItem[];
  /** Additional props forwarded to BottomAppBar in autoLayout mode (items overridden by bottomNavItems) */
  bottomNavProps?: Partial<BottomAppBarProps>;
  mobileMenu?: MobileMenuConfig;
  /**
   * Take the shell's geometry from CSS custom properties rather than from the
   * breakpoint the JavaScript resolved. Web only, and a contract: the app must
   * inline the stylesheet `createAppShellCss` builds from the same config. It
   * exists for statically rendered apps, where the prerender has no viewport to
   * measure and every guess it makes lands as a layout shift and a hydration
   * mismatch on first paint. See `shellCssVars.ts`.
   * @default false
   */
  cssGeometry?: boolean;
  statusBar?: StatusBarConfig;
  /**
   * Padding inside the main content area: a spacing token (`'md'`), px
   * number, or a per-breakpoint object. @default no padding
   */
  padding?: ResponsiveSize;
  /** Default `withBorder` for every section. @default true */
  withBorder?: boolean;
  /** Stacking order for every section that doesn't set its own. @default each section's `theme.zIndices` layer */
  zIndex?: number;
  /** Navbar/content transition length in ms (`0` = instant). Reduced motion forces `0`. @default 200 */
  transitionDuration?: number;
  /**
   * CSS timing function for the navbar/content transitions: `'linear'`,
   * `'ease'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'` or `'cubic-bezier(…)'`.
   * @default a cubic ease-in-out
   */
  transitionTimingFunction?: string;
  disabled?: boolean;
  children: React.ReactNode;
  withSafeArea?: boolean;
  /** Maximum width for main content area to prevent stretching on wide screens */
  maxContentWidth?: number | string;
  /** Center content when maxContentWidth is set */
  centerContent?: boolean;
  /** Optional table of contents rendered at the end side of the main content */
  tableOfContents?: React.ReactNode;
  /** Hide the table of contents automatically on mobile breakpoints */
  hideTableOfContentsOnMobile?: boolean;
  /** Custom width for the table of contents column */
  tableOfContentsWidth?: number | string;
  /** Toggle border between content and table of contents */
  tableOfContentsWithBorder?: boolean;
  /**
   * Resizable sections: the result of `useAppShellResize()`. Each section it
   * names gets a drag handle (`role="separator"`) on its inner edge, and its
   * size comes from the hook instead of the section config while it is
   * resizable (not below the navbar/aside breakpoint, not a native drawer).
   *
   * Web: the shell then writes its geometry as CSS custom properties
   * (`--plocks-shell-navbar-w`, `--plocks-shell-aside-w`,
   * `--plocks-shell-header-h`, `--plocks-shell-footer-h`,
   * `--plocks-shell-content-bottom`) on the shell's root element rather than
   * leaving them to `:root`, and a drag updates them in place without a React
   * render. Content portalled outside the shell cannot see them; read
   * `useAppShellLayout()` there instead.
   */
  resize?: UseAppShellResizeReturn;
}

// ---------------------------------------------------------------------------
// Resizable sections (useAppShellResize)
// ---------------------------------------------------------------------------

/** A section `useAppShellResize` can make resizable. */
export type AppShellResizeSection = 'navbar' | 'aside' | 'header' | 'footer';

/** Sections whose collapsed state the hook owns (the navbar's is the shell's own open/rail state). */
export type AppShellResizeCollapsible = 'aside' | 'header' | 'footer';

/** Section sizes in px. */
export type AppShellResizeSizes = Partial<Record<AppShellResizeSection, number>>;

export interface AppShellResizeSectionOptions {
  /** Smallest size in px. @default navbar/aside 160, header 40, footer 32 */
  min?: number;
  /** Largest size in px. @default navbar/aside 480, header/footer 200 */
  max?: number;
  /** Starting size in px, and what `reset` returns to. @default the section config's width/height */
  defaultSize?: number;
  /**
   * Dragging the section smaller than this (px) collapses it — the navbar to
   * its rail, the others to nothing — and calls `onCollapse`. Without it the
   * drag stops at `min`.
   */
  collapseThreshold?: number;
  /** Called when a drag (or a keyboard step past `min`) collapses the section. */
  onCollapse?: () => void;
  /** Accessible name of the handle. @default 'Resize navigation' / 'Resize aside' / 'Resize header' / 'Resize footer' */
  label?: string;
}

export interface UseAppShellResizeOptions {
  /** Make the navbar resizable (`true` = defaults). */
  navbar?: AppShellResizeSectionOptions | boolean;
  /** Make the aside resizable (`true` = defaults). */
  aside?: AppShellResizeSectionOptions | boolean;
  /** Make the header resizable (`true` = defaults). */
  header?: AppShellResizeSectionOptions | boolean;
  /** Make the footer resizable (`true` = defaults). */
  footer?: AppShellResizeSectionOptions | boolean;
  /** Arrow-key step in px. @default 10 */
  step?: number;
  /** Shift+arrow step in px. @default 50 */
  shiftStep?: number;
  /** Persist sizes under this key with `usePersistedState`. Read once per key; keep it stable. */
  storageKey?: string;
  /** Every size change — each drag frame, each key press. */
  onSizeChange?: (section: AppShellResizeSection, size: number) => void;
  /** A drag released, or a keyboard step taken. `size` is 0 (or the rail width) when the section collapsed. */
  onResizeEnd?: (section: AppShellResizeSection, size: number) => void;
}

/** @internal A section's options with the defaults filled in. */
export interface ResolvedAppShellResizeSection {
  min: number;
  max: number;
  defaultSize: number | undefined;
  collapseThreshold: number | undefined;
  onCollapse: (() => void) | undefined;
  label: string;
}

/**
 * @internal The live half of `useAppShellResize`: the size a section has
 * *during* a drag, kept outside React state so a drag doesn't re-render the
 * component that owns the hook (and with it the page) on every frame.
 */
export interface AppShellResizeStore {
  /** The section being dragged, or `null`. */
  getActive: () => AppShellResizeSection | null;
  /** Live size of the section being dragged (a new object per change). */
  getLive: () => AppShellResizeSizes;
  subscribe: (listener: () => void) => () => void;
  begin: (section: AppShellResizeSection) => void;
  /** A live size, or `undefined` while the drag holds the section collapsed. */
  move: (section: AppShellResizeSection, size: number | undefined) => void;
  end: () => void;
  /** Set by AppShell on web: writes a live size into the shell root's CSS variables. */
  writer: ((section: AppShellResizeSection, size: number) => void) | null;
}

/** What `useAppShellResize` returns; pass it whole to `<AppShell resize>`. */
export interface UseAppShellResizeReturn {
  /**
   * Committed size per resizable section, in px — the user's size, else
   * `defaultSize`; absent when neither is set (the section config's size
   * applies). Updates when a drag ends, not on every frame.
   */
  sizes: AppShellResizeSizes;
  /** Whether a drag (or keyboard) collapsed the aside, header or footer. The navbar's state is `useAppShell().navbarOpen`. */
  collapsed: Record<AppShellResizeCollapsible, boolean>;
  /** Set a section's size (clamped to its `min`/`max`). */
  setSize: (section: AppShellResizeSection, size: number) => void;
  /** Collapse or expand the aside, header or footer. */
  setCollapsed: (section: AppShellResizeCollapsible, collapsed: boolean) => void;
  /** Back to `defaultSize` (or the config size) and expanded — one section, or all of them. */
  reset: (section?: AppShellResizeSection) => void;
  /** @internal `setSize` without `onSizeChange` (a drag already reported it); returns the clamped size. */
  commitSize: (section: AppShellResizeSection, size: number) => number | undefined;
  /** @internal */
  sections: Record<AppShellResizeSection, ResolvedAppShellResizeSection | undefined>;
  /** @internal */
  step: number;
  /** @internal */
  shiftStep: number;
  /** @internal */
  store: AppShellResizeStore;
  /** @internal Latest options for a section (for its callbacks). */
  getSectionOptions: (section: AppShellResizeSection) => ResolvedAppShellResizeSection | undefined;
  /** @internal */
  notifySizeChange: (section: AppShellResizeSection, size: number) => void;
  /** @internal */
  notifyResizeEnd: (section: AppShellResizeSection, size: number) => void;
}

/** Imperative navbar controls, from `useAppShellApi()`. */
export interface AppShellApi {
  openNavbar: () => void;
  closeNavbar: () => void;
  toggleNavbar: () => void;
}

/** Resolved section sizes, from `useAppShellLayout()`. */
export interface AppShellLayoutValue {
  headerHeight: number | string;
  navbarWidth: number | string;
  asideWidth: number | string;
  footerHeight: number | string;
  bottomNavHeight: number | string;
}

export interface AppShellContextValue {
  headerHeight: number | string;
  navbarWidth: number | string;
  fullNavbarWidth: number | string;
  navbarCollapsedRailWidth: number | string;
  navbarExpandOnHover: boolean;
  /** Whether hover-expansion should push the main content instead of overlaying it. */
  navbarPushOnHover: boolean;
  /** Hover-expansion progress (0 = collapsed rail, 1 = fully expanded). */
  navbarHoverProgress: SharedValue<number>;
  asideWidth: number | string;
  footerHeight: number | string;
  bottomNavHeight: number | string;
  isNavbarCollapsed: boolean;
  isNavbarRail: boolean;
  isAsideCollapsed: boolean;
  /** Native, or a web viewport below `md`. */
  isMobile: boolean;
  breakpoint: Breakpoint;
  openNavbar: () => void;
  closeNavbar: () => void;
  toggleNavbar: () => void;
  navbarOpen: boolean;
  /** Effective transition length in ms (`0` while reduced motion is on). */
  transitionDuration: number;
  /**
   * Emit the shell's geometry as `var(--plocks-shell-*)` references instead of
   * resolved numbers. See `shellCssVars.ts`; web only, and only correct when
   * the app inlines the matching stylesheet.
   */
  cssGeometry: boolean;
  /**
   * The three values above as they should be *written into a style*: the same
   * numbers, or the `var()` references that stand in for them under
   * `cssGeometry`. Kept beside the numbers rather than replacing them because
   * the shell still does arithmetic with the numbers.
   */
  headerHeightStyle: number | string;
  navbarWidthStyle: number | string;
  contentBottomStyle: number | string;
  /**
   * `asideWidth` / `footerHeight` as style values: the numbers, or `var()`
   * references while those sections are resizable on web (see `resize`).
   */
  asideWidthStyle: number | string;
  footerHeightStyle: number | string;
}

// Configuration object consumed by layout calculator
export interface AppShellConfig {
  header?: HeaderConfig;
  navbar?: NavbarConfig;
  aside?: AsideConfig;
  footer?: FooterConfig;
  bottomNav?: BottomNavConfig;
  showHeader?: boolean;
  layoutSections?: LayoutVisibilityConfig;
}

/** Props shared by the shell's chrome sections. */
interface AppShellChromeProps extends BaseProps<ViewStyle> {
  children: React.ReactNode;
  /** Draw the hairline between this section and the content. @default AppShell `withBorder` */
  withBorder?: boolean;
  /** Stacking order; wins over the section config and the theme layer. */
  zIndex?: number;
  /** Accessible name of the section's landmark. */
  accessibilityLabel?: string;
}

/** `AppShell.Header` — rendered as the page's `banner` landmark. */
export type AppShellHeaderProps = AppShellChromeProps;

/** `AppShell.Navbar` — rendered as a `navigation` landmark. */
export interface AppShellNavbarProps extends AppShellChromeProps {
  /** Force the overlay drawer (`true`) or the inline rail (`false`). Defaults to the drawer below `navbar.breakpoint`. */
  drawerMode?: boolean;
  /** Accessible name of the navigation landmark. @default 'Main' */
  accessibilityLabel?: string;
}

/** `AppShell.Aside` — rendered as a `complementary` landmark. */
export type AppShellAsideProps = AppShellChromeProps;

/** `AppShell.Footer` — rendered as the page's `contentinfo` landmark. */
export type AppShellFooterProps = AppShellChromeProps;

/** An item icon, or a function that renders one in the item's current color. */
export type BottomAppBarIcon = React.ReactNode | ((state: { active: boolean; color: string }) => React.ReactNode);

export interface BottomAppBarItem {
  key: string;
  label: string;
  icon: BottomAppBarIcon;
  activeIcon?: BottomAppBarIcon;
  badgeCount?: number;
  onPress?: () => void; // per-item override
}

export interface AppShellBottomNavProps extends BaseProps<ViewStyle> {
  /** Content pinned to the bottom edge of the shell. */
  children?: React.ReactNode;
  withBorder?: boolean;
  zIndex?: number;
  /** Accessible name of the navigation landmark. */
  accessibilityLabel?: string;
}

export interface BottomAppBarProps extends AppShellBottomNavProps {
  /** Structured items definition for standard navigation bar */
  items?: BottomAppBarItem[];
  /** Currently active item key */
  activeKey?: string;
  /** Callback when an item is pressed (fires after per-item onPress) */
  onItemPress?: (key: string) => void;
  /** Show labels under icons (default true). Items are still named for screen readers when hidden. */
  showLabels?: boolean;
  /** Visual variant */
  variant?: 'solid' | 'surface' | 'elevated' | 'translucent';
  /** Shadow strength for the `elevated` variant (Android-style elevation, 0–24). @default 4 */
  elevation?: number;
  /** Optional floating action button rendered centered & elevated */
  fab?: React.ReactNode;
  /** Label (and function-icon) color of the active item. @default theme.colors.primary[5] */
  activeColor?: string;
  /** Label (and function-icon) color of inactive items. @default theme.text.secondary */
  inactiveColor?: string;
  /** Pill behind the active icon: `false` hides it, a color string tints it. @default true */
  indicator?: boolean | string;
  /** Color of the top border. */
  borderColor?: string;
  /** Background of item count badges; the count text picks a readable color. @default theme.colors.error[5] */
  badgeColor?: string;
}

export interface AppShellMainProps extends BaseProps<ViewStyle> {
  children: React.ReactNode;
  /** Element id (DOM `id` on web, `nativeID` on native). */
  id?: string;
  /** Landmark role. @default 'main' */
  role?: Role;
  /**
   * Maximum width of the content column inside the main area (the area itself
   * still fills the space between the chrome), to prevent stretching on wide screens.
   */
  maw?: number | string;
  /** Center content when `maw` is set */
  centerContent?: boolean;
  /** Table of contents content to show at the end side of the content */
  tableOfContents?: React.ReactNode;
  /** Hide table of contents on mobile */
  hideTocOnMobile?: boolean;
  /** Width of the table of contents sidebar */
  tocWidth?: number | string;
  /** Add border to table of contents */
  tocWithBorder?: boolean;
}

export interface AppShellSectionProps extends BaseProps<ViewStyle> {
  children: React.ReactNode;
  /** Take the remaining space of the navbar/aside. */
  grow?: boolean;
  /** Scroll the section's content when it overflows. */
  withScrollArea?: boolean;
}

export interface MobileMenuProps extends BaseProps<ViewStyle> {
  /** Whether the menu is open. */
  opened?: boolean;
  /** Called when the menu asks to close (backdrop press, Escape, Android back). */
  onClose: () => void;
  children?: React.ReactNode;
  config?: MobileMenuConfig;
  /** Accessible name of the menu dialog. @default 'Menu' */
  accessibilityLabel?: string;
}

export interface StatusBarManagerProps extends StatusBarConfig {
  children?: React.ReactNode;
}
