# AppShell

Application layout: a header, a navbar (inline rail on desktop, overlay drawer
on mobile), an aside, the main content area, a footer and a mobile bottom
navigation — positioned from one set of per-breakpoint sizes.

```tsx
import { AppShell, useAppShellApi } from '@plocks/ui';

function MenuButton() {
  const { toggleNavbar } = useAppShellApi();
  return <IconButton icon="menu" accessibilityLabel="Open navigation" onPress={toggleNavbar} />;
}

export function App() {
  return (
    <AppShell
      header={{ height: { base: 56, md: 64 } }}
      navbar={{ width: { base: 280, lg: 300 }, collapsedWidth: 72, expandOnHover: true }}
      aside={{ width: 260, collapsed: { mobile: true } }}
      footer={{ height: 48 }}
    >
      <AppShell.Header><MenuButton /></AppShell.Header>
      <AppShell.Navbar>{/* navigation */}</AppShell.Navbar>
      <AppShell.Aside accessibilityLabel="Details">{/* … */}</AppShell.Aside>
      <AppShell.Main maw={960}>{/* page */}</AppShell.Main>
      <AppShell.Footer>{/* … */}</AppShell.Footer>
    </AppShell>
  );
}
```

`autoLayout` renders the sections itself from `headerContent`, `navbarContent`,
`asideContent`, `footerContent` and `bottomNavItems`.

## Sections and landmarks

| Component | Landmark (web element) | Notes |
|---|---|---|
| `AppShell.Header` | `banner` (`<header>`) | Full width; between navbar and aside with `layout="alt"`. |
| `AppShell.Navbar` | `navigation` (`<nav>`), named `"Main"` by default | Rail ↔ expanded on desktop; drawer below `navbar.breakpoint` and on native. The open drawer closes on scrim press, Escape and Android back, keeps Tab inside, and returns focus to the opener. |
| `AppShell.Aside` | `complementary` (`<aside>`) | End side (right in LTR). |
| `AppShell.Main` | `main` (`<main>`) | `maw` (content column width), `centerContent`, optional table of contents column. |
| `AppShell.Footer` | `contentinfo` (`<footer>`) | Between navbar and aside. |
| `AppShell.BottomNav` | `navigation` when labelled | Mobile bottom container. |
| `AppShell.BottomAppBar` | `navigation` | Items with icons, labels, badges; active item is `aria-current="page"`. |
| `AppShell.Section` | — | `grow` / `withScrollArea` inside navbar or aside. |
| `AppShell.MobileMenu` | `dialog` (modal) | Native menu used with `mobileMenu`; `opened` / `onClose`. |

Each section takes `accessibilityLabel`, `withBorder`, `zIndex`, `style`,
`testID` and the spacing props.

## Responsive behaviour

Breakpoints come from the theme (`theme.breakpoints`: xs 480, sm 576, md 768,
lg 992, xl 1200; `base` is below xs) through the shared, hydration-safe
viewport store — the server and the hydration pass render the desktop layout,
then the client switches to the real width. Native apps are always "mobile".

- `ResponsiveSize` values (`{ base: 56, md: 64 }`) resolve to the nearest
  entry at or below the current breakpoint.
- `navbar.breakpoint` (default `md`): inline rail from there up, drawer below.
- `aside.breakpoint` (default `md`): which of `aside.collapsed.mobile/desktop` applies.
- `navbar.autoExpandBreakpoint`: start expanded from that width up.
- A viewport-relative navbar width (`'100%'`, `'80vw'`) sizes the drawer
  against the viewport.

## Stacking

Sections read `theme.zIndices`: header `header`, rail/aside/footer/bottom nav
`sticky`, drawer `overlay` (above the header), MobileMenu on web `modal`.
Precedence: section `zIndex` prop › section config `zIndex` › AppShell `zIndex`
› theme layer.

## RTL

Sections use logical insets (`start`/`end`, `borderStart*`), so the navbar is
on the start side and the aside on the end side in both directions. On web
AppShell passes the `DirectionProvider` direction to react-native-web as `dir`;
on native, `I18nManager` flips the layout.

## Resizable sections

`useAppShellResize` makes sections resizable; pass its result as `resize`.
The navbar and aside resize horizontally, the header and footer vertically.

```tsx
const resize = useAppShellResize({
  navbar: { min: 200, max: 400, collapseThreshold: 120, onCollapse: () => {} },
  aside: true,                          // defaults: 160–480 px
  footer: { label: 'Resize status bar' },
  storageKey: 'app-shell-sizes',        // optional, via usePersistedState
});

<AppShell navbar={{ width: 260 }} aside={{ width: 240 }} footer={{ height: 40 }} resize={resize}>…</AppShell>
```

- Section options: `min`, `max`, `defaultSize`, `collapseThreshold`,
  `onCollapse`, `label` (the handle's accessible name; default
  "Resize navigation" / "aside" / "header" / "footer"). Hook options: `step`
  (10), `shiftStep` (50), `storageKey`, `onSizeChange(section, size)` (every
  frame/key), `onResizeEnd(section, size)`.
- Returns `sizes`, `collapsed` (aside/header/footer), `setSize(section, px)`,
  `setCollapsed(section, bool)` and `reset(section?)`.
- Each handle is a `separator` with `aria-orientation` and
  `aria-valuenow/min/max`. Keys: arrows step 10 px (Shift 50), Home/End jump to
  min/max, Enter (or a double-click) resets. Native screen readers get
  increment/decrement actions. In RTL the navbar is on the right, so the
  horizontal drag and arrow keys flip.
- Dragging below `collapseThreshold` collapses the section and calls
  `onCollapse`: the navbar to its rail (`navbar.collapsedWidth`, the same
  state as `closeNavbar()`), the others to nothing — their handle stays on the
  edge. Dragging back out expands it.
- **Mobile:** resizing is off where the navbar is a drawer (below
  `navbar.breakpoint`, always on native) and where the aside is not inline
  (below `aside.breakpoint`, native); those sections keep their configured
  widths. The header and footer resize everywhere.
- **Live updates.** Web: resizable sections' geometry is a `var()` on
  custom properties set on the *shell root* (`--plocks-shell-navbar-w`,
  `-aside-w`, `-header-h`, `-footer-h`, `-content-bottom`), not `:root`; a
  drag writes them directly, so nothing re-renders per frame. Portalled
  content can't see them — use `useAppShellLayout()` there. Native: the shell
  subscribes to the drag's live size and re-renders its sections each frame;
  the page passed as children and the component owning the hook do not. The
  hook's `sizes` (and so its owner) update once, on release.

## Motion

`transitionDuration` (default 200 ms) and `transitionTimingFunction` drive the
rail, drawer and content transitions; reduced motion makes them instant.

## Statically rendered web

A prerender runs in Node, with no viewport and no reader, so the shell cannot
know what width to draw or which color scheme to draw it in — and both wrong
guesses reach the markup, where only the cascade can still correct them.

- **Geometry** is opt-in: set `cssGeometry` and inline the stylesheet
  `createAppShellCss(config, { theme })` builds from the same config. Its
  media queries use the same theme breakpoint table as the running shell.
- **Chrome colors** need no prop. The shell reads its header, navbar, aside,
  toc, footer, and bottom-bar fills through the variables
  `createThemeColorVariablesCss` publishes, so an app already inlining that
  stylesheet — the same one the rest of the theme's colors use — lands in the
  reader's scheme at first paint. Without it, or off the web, the shell falls
  back to literals from the resolved theme.

`shellChrome(theme)` and `shellChromeColors(theme)` return the same values, for
app chrome that has to sit flush against the shell's.

## Hooks

- `useAppShell()` — the resolved layout (sizes, `isMobile`, `breakpoint`, navbar state).
- `useAppShellApi()` — `openNavbar`, `closeNavbar`, `toggleNavbar` (stable; no re-render on layout changes).
- `useAppShellLayout()` — section sizes only.
- `useNavbarHover()` — whether the pointer is over the desktop rail.
- `useAppShellResize(options)` — resizable sections; pass the result as `resize`.
- `useBreakpoint()` — the current breakpoint name.
- `resolveResponsiveValue(value, breakpoint)` — a `ResponsiveSize` in px.

## Declarative layouts

`defineAppLayout` + `AppLayoutProvider` + `AppLayoutRenderer` build the shell
from a blueprint whose entries can depend on the route, query, platform,
breakpoint and orientation.
