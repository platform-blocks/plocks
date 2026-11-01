---
title: useViewport
category: layout
order: 20
tags: [responsive, viewport, breakpoints, dimensions]
status: stable
since: 0.1.0
hidden: false
---

Read the current viewport `{ width, height, breakpoint }` from one shared, hydration-safe store, re-rendering on every resize. Reach for `useBreakpoint` instead when only the breakpoint matters. A statically rendered web page has no window, so it renders and hydrates at a default size — desktop unless you pass `useViewport({ serverViewport })` or set `serverViewport` on `PlocksProvider` (a phone size for a phone-first app) — then switches to the real one without a hydration mismatch.
