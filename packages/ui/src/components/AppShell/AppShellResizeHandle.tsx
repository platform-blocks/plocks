import React, { useRef, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import type { AccessibilityActionEvent, AccessibilityActionInfo, ViewStyle } from 'react-native';

import { a11yProps } from '../../core/accessibility/a11yProps';
import { consumeEvent, readKey } from '../../core/accessibility/keyboard';
import { useDragGesture } from '../../core/gestures/useDragGesture';
import { isWeb } from '../../core/platform/flags';
import { webProps, type WebKeyboardEvent, type WebMouseEvent } from '../../core/platform/webProps';
import { webStyle } from '../../core/platform/webStyle';
import { useTheme } from '../../core/theme/ThemeProvider';
import { useAppShell, useAppShellInternal, useNavbarHover, useNavbarPushOffset } from './AppShellContext';
import { asDimension, coerceNumber, offsetGeometry, useLayoutIsRTL } from './shellUtils';
import type { AppShellResizeSection, UseAppShellResizeReturn } from './types';

/** Width of the grab area, centred on the section's edge. */
const HIT_SIZE = 8;
const HALF = HIT_SIZE / 2;
const LINE_SIZE = 2;

const SECTIONS: readonly AppShellResizeSection[] = ['navbar', 'aside', 'header', 'footer'];

const ACTIONS: ReadonlyArray<AccessibilityActionInfo> = [
  { name: 'increment', label: 'Increase size' },
  { name: 'decrement', label: 'Decrease size' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A geometry value pulled back by half the grab area, so the handle straddles the edge (and stays on-screen at 0). */
const edgeOffset = (value: number | string): number | string =>
  typeof value === 'number' ? Math.max(0, value - HALF) : offsetGeometry(value, -HALF);

/** @internal The handles for every resizable section; AppShell renders it when `resize` is set. */
export function AppShellResizeHandles() {
  const internal = useAppShellInternal();
  const resize = internal?.resize;
  if (!internal || !resize) return null;
  return (
    <>
      {SECTIONS.map((section) =>
        internal.resizable[section] ? <ResizeHandle key={section} section={section} resize={resize} /> : null
      )}
    </>
  );
}

function ResizeHandle({ section, resize }: { section: AppShellResizeSection; resize: UseAppShellResizeReturn }) {
  const theme = useTheme();
  const shell = useAppShell();
  const internal = useAppShellInternal();
  const rtl = useLayoutIsRTL();
  const navbarHovered = useNavbarHover();
  const pushOffset = useNavbarPushOffset();
  const [hovered, setHovered] = useState(false);

  const options = resize.sections[section];
  const min = options?.min ?? 0;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  const collapseThreshold = options?.collapseThreshold;

  const horizontal = section === 'navbar' || section === 'aside';
  const collapsed = internal?.resizeCollapsed[section] ?? false;
  const collapsedSize = section === 'navbar' ? coerceNumber(shell.navbarCollapsedRailWidth, 72) : 0;
  const expandedSize = internal?.resizeExpandedSize[section] ?? 0;

  // The size mid-drag (the shell itself may not re-render per frame on web).
  const live = useSyncExternalStore(
    resize.store.subscribe,
    () => resize.store.getLive()[section],
    () => undefined
  );
  const dragging = useSyncExternalStore(
    resize.store.subscribe,
    () => resize.store.getActive() === section,
    () => false
  );
  const current = collapsed ? collapsedSize : live ?? expandedSize;

  // Which way the pointer moves to grow the section: the edge faces the
  // content, so the navbar grows toward the end side and the aside toward the
  // start side — physical right/left flip in RTL. The header grows down, the
  // footer up.
  const sign = section === 'navbar' ? (rtl ? -1 : 1) : section === 'aside' ? (rtl ? 1 : -1) : section === 'header' ? 1 : -1;
  const growKey = horizontal ? (sign > 0 ? 'ArrowRight' : 'ArrowLeft') : sign > 0 ? 'ArrowDown' : 'ArrowUp';
  const shrinkKey = horizontal ? (sign > 0 ? 'ArrowLeft' : 'ArrowRight') : sign > 0 ? 'ArrowUp' : 'ArrowDown';

  // Latest render values for the gesture callbacks (created once per gesture).
  const latest = useRef({ collapsed, collapsedSize, expandedSize });
  latest.current = { collapsed, collapsedSize, expandedSize };

  const setCollapsed = (next: boolean) => {
    if (section === 'navbar') {
      if (next) shell.closeNavbar();
      else shell.openNavbar();
    } else {
      resize.setCollapsed(section, next);
    }
    if (next) resize.getSectionOptions(section)?.onCollapse?.();
  };

  // ---------------------------------------------------------------- drag
  const drag = useRef({ origin: 0, startSize: 0, size: 0, collapsed: false, changed: false });
  const finish = () => {
    const state = drag.current;
    if (state.changed) {
      // (On native the shell's expanded size already *is* the live one, so
      // always commit; an unchanged size is a no-op.)
      if (!state.collapsed) resize.commitSize(section, state.size);
      resize.notifyResizeEnd(section, state.collapsed ? latest.current.collapsedSize : state.size);
    }
    resize.store.end();
  };
  const gesture = useDragGesture({
    axis: horizontal ? 'x' : 'y',
    cursor: horizontal ? 'col-resize' : 'row-resize',
    onStart: (point) => {
      const { collapsed: startCollapsed, collapsedSize: railSize, expandedSize: size } = latest.current;
      drag.current = {
        origin: horizontal ? point.pageX : point.pageY,
        startSize: startCollapsed ? railSize : size,
        size,
        collapsed: startCollapsed,
        changed: false,
      };
      resize.store.begin(section);
    },
    onMove: (point) => {
      const state = drag.current;
      // Page coordinates, not surface-relative ones: the handle itself moves
      // with the edge it is dragging.
      const raw = state.startSize + sign * ((horizontal ? point.pageX : point.pageY) - state.origin);
      if (state.collapsed) {
        // Collapsed: stay so until the pointer is back past the threshold (or `min`).
        if (raw < (collapseThreshold ?? min)) return;
        state.collapsed = false;
        state.changed = true;
        setCollapsed(false);
      } else if (collapseThreshold !== undefined && raw < collapseThreshold) {
        state.collapsed = true;
        state.changed = true;
        setCollapsed(true);
        resize.store.move(section, undefined);
        return;
      }
      const size = Math.round(clamp(raw, min, max));
      if (size === state.size && resize.store.getLive()[section] === size) return;
      state.size = size;
      state.changed = true;
      resize.store.move(section, size);
      resize.notifySizeChange(section, size);
    },
    onEnd: finish,
    onCancel: finish,
  });

  // ------------------------------------------------------------ keyboard
  const commit = (size: number) => {
    const next = clamp(size, min, max);
    if (next !== expandedSize) resize.setSize(section, next);
    resize.notifyResizeEnd(section, next);
  };
  const grow = (amount: number) => {
    if (collapsed) {
      setCollapsed(false);
      resize.notifyResizeEnd(section, expandedSize);
      return;
    }
    commit(expandedSize + amount);
  };
  const shrink = (amount: number) => {
    if (collapsed) return;
    if (collapseThreshold !== undefined && expandedSize <= min) {
      setCollapsed(true);
      resize.notifyResizeEnd(section, collapsedSize);
      return;
    }
    commit(expandedSize - amount);
  };
  const jumpTo = (size: number) => {
    if (collapsed) setCollapsed(false);
    commit(size);
  };
  const reset = () => {
    resize.reset(section);
    if (section === 'navbar' && collapsed) shell.openNavbar();
  };

  const onKeyDown = (event: WebKeyboardEvent) => {
    const { key, shift } = readKey(event);
    const amount = shift ? resize.shiftStep : resize.step;
    if (key === growKey) grow(amount);
    else if (key === shrinkKey) shrink(amount);
    else if (key === 'Home') jumpTo(min);
    else if (key === 'End') jumpTo(max);
    else if (key === 'Enter') reset();
    else return;
    consumeEvent(event);
  };

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') grow(resize.step);
    else if (event.nativeEvent.actionName === 'decrement') shrink(resize.step);
  };

  // ------------------------------------------------------------ geometry
  const alt = internal?.layout === 'alt';
  const z = (internal?.zIndices[section] ?? 0) + 1;
  // While a collapsed rail is hover-expanded over the content, the rail owns
  // that edge: step out of its way.
  const yieldToHoverRail =
    section === 'navbar' && collapsed && navbarHovered && shell.navbarExpandOnHover && !shell.navbarPushOnHover;
  // A collapsed aside/header/footer has no edge but the shell's own: keep the
  // handle inside it (a `var()` can't be clamped at 0 the way a number is).
  const edge = (value: number | string) => (collapsed && section !== 'navbar' ? 0 : edgeOffset(value));
  const sideTop = alt ? 0 : asDimension(shell.headerHeightStyle);
  const sideBottom = alt ? 0 : asDimension(shell.cssGeometry ? shell.contentBottomStyle : shell.footerHeightStyle);
  const position: ViewStyle =
    section === 'navbar'
      ? {
          top: sideTop,
          bottom: sideBottom,
          start: asDimension(edgeOffset(offsetGeometry(shell.navbarWidthStyle, pushOffset))),
          width: HIT_SIZE,
        }
      : section === 'aside'
        ? { top: sideTop, bottom: sideBottom, end: asDimension(edge(shell.asideWidthStyle)), width: HIT_SIZE }
        : section === 'header'
          ? {
              top: asDimension(edge(shell.headerHeightStyle)),
              start: alt ? asDimension(shell.navbarWidthStyle) : 0,
              end: alt ? asDimension(shell.asideWidthStyle) : 0,
              height: HIT_SIZE,
            }
          : {
              bottom: asDimension(edge(shell.footerHeightStyle)),
              start: asDimension(shell.navbarWidthStyle),
              end: asDimension(shell.asideWidthStyle),
              height: HIT_SIZE,
            };

  const active = dragging || hovered;
  const valueNow = Math.round(current);

  return (
    <View
      ref={gesture.ref}
      onLayout={gesture.onLayout}
      {...gesture.panHandlers}
      {...a11yProps({
        role: 'separator',
        label: options?.label,
        orientation: horizontal ? 'vertical' : 'horizontal',
        value: { min, max, now: valueNow },
        // Native: one element with the value and the increment/decrement actions.
        accessible: isWeb ? undefined : true,
        actions: ACTIONS,
        onAction: onAccessibilityAction,
      })}
      {...webProps({
        tabIndex: 0,
        onKeyDown,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        // Double-click resets, like Splitter's `resetOnDoubleClick`.
        onClick: (event: WebMouseEvent) => {
          if ((event.nativeEvent as { detail?: number } | undefined)?.detail === 2) reset();
        },
        dataSet: {
          plocksShellResize: section,
          // Under cssGeometry the stylesheet hides the inline rail/aside below
          // the mobile cutoff; their handles go with them.
          plocksShellDesktopOnly: shell.cssGeometry && horizontal ? 'true' : undefined,
        },
      })}
      testID={`app-shell-resize-${section}`}
      style={[
        { position: 'absolute', zIndex: z, alignItems: 'center', justifyContent: 'center' },
        position,
        gesture.surfaceStyle,
        yieldToHoverRail ? { opacity: 0, pointerEvents: 'none' } : null,
        isWeb ? webStyle({ outlineOffset: -2 }) : null,
      ]}
    >
      <View
        style={[
          horizontal ? { width: LINE_SIZE, height: '100%' } : { height: LINE_SIZE, width: '100%' },
          { backgroundColor: active ? theme.colors.primary[5] : 'transparent', pointerEvents: 'none' },
        ]}
      />
    </View>
  );
}
