---
title: AppShell
category: layout
props:
  layout: "'default' | 'alt' — 'alt' lets the navbar and aside span the full height"
  header: Header config — `height`, `collapsed`, `offset`, `zIndex`
  navbar: Navbar config — `width`, `breakpoint`, `collapsed`, `collapsedWidth`, `expandOnHover`, `zIndex`
  aside: Aside config — `width`, `breakpoint`, `collapsed`, `zIndex`
  footer: Footer config — `height`, `collapsed`, `offset`, `zIndex`
  resize: Resizable sections — the result of `useAppShellResize({ navbar, aside, header, footer })`; each named section gets a drag handle (`role="separator"`, keyboard and pointer/touch) and its size comes from the hook. Off where the navbar/aside are drawers or mobile
  cssGeometry: Take the geometry from CSS custom properties (statically rendered web apps)
  transitionDuration: Navbar/content transition length in ms; `0` is instant
---

AppShell arranges an app’s header, navigation, aside, footer, and mobile navigation in a responsive frame.
