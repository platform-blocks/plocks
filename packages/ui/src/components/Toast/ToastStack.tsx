import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Toast } from './Toast';
import type { ToastStackPosition as ToastScreenPosition, ToastItem, ToastLayout } from './ToastProvider';
import type { ToastDirection } from './types';
import { useReducedMotion } from '../../core/motion/useReducedMotion';
import { webProps } from '../../core/platform';
import { pointerEventsStyles } from '../../core/platform/pointerEvents';

/**
 * Height assumed for a toast that has not reported its layout yet. It is only
 * ever read for a single frame, and only for the toast that just mounted, since
 * every toast behind it in the stack has already been measured.
 */
const ESTIMATED_TOAST_HEIGHT = 64;

/**
 * Repositioning spring. Critically-ish damped: the stack closes a gap decisively
 * and stops, because a toast that wobbles into place reads as a glitch rather
 * than as polish.
 */
const REFLOW_SPRING = {
  damping: 26,
  stiffness: 240,
  mass: 0.85,
  overshootClamping: false,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
} as const;

/**
 * Stacked layout. Older toasts sit behind the newest one as a deck: each one
 * peeks out by `STACK_PEEK` px and shrinks by `STACK_SCALE_STEP`, and anything
 * deeper than `STACK_MAX_PEEK` is hidden until the stack expands. Two peeking
 * edges are enough to say "there are more"; a third adds height, not meaning.
 */
const STACK_PEEK = 8;
const STACK_MAX_PEEK = 2;
const STACK_SCALE_STEP = 0.05;
const STACK_FADE_DURATION = 160;

type StackAnchor = 'top' | 'bottom';

interface ToastStackItemProps {
  /** Distance from the anchored edge, in px. */
  offset: number;
  anchor: StackAnchor;
  zIndex: number;
  animate: boolean;
  /** Position in a collapsed deck: 0 is the toast in front. */
  depth: number;
  /** Height a toast behind the front one is clipped to (collapsed deck only). */
  clipHeight: number | null;
  testID?: string;
  onMeasure: (height: number) => void;
  onHoverChange: (hovered: boolean) => void;
  onFocusChange: (focused: boolean) => void;
  children: React.ReactNode;
}

/**
 * One slot in the stack. Owns nothing but its position: the toast inside runs
 * its own enter/exit transition, and this wrapper only slides the slot when the
 * toasts around it change.
 */
function ToastStackItem({
  offset,
  anchor,
  zIndex,
  animate,
  depth,
  clipHeight,
  testID,
  onMeasure,
  onHoverChange,
  onFocusChange,
  children,
}: ToastStackItemProps) {
  // A bottom-anchored stack grows upward, so its offsets run negative.
  const target = anchor === 'top' ? offset : -offset;
  const translate = useSharedValue(target);
  const hidden = depth > STACK_MAX_PEEK;
  const targetScale = 1 - Math.min(depth, STACK_MAX_PEEK) * STACK_SCALE_STEP;
  const targetOpacity = hidden ? 0 : 1;
  const scale = useSharedValue(targetScale);
  const opacity = useSharedValue(targetOpacity);

  useEffect(() => {
    // The initial value is already `target`, so the first pass is a no-op and a
    // freshly mounted toast never slides in from a stale slot.
    translate.value = animate ? withSpring(target, REFLOW_SPRING) : target;
  }, [target, animate, translate]);

  useEffect(() => {
    scale.value = animate ? withSpring(targetScale, REFLOW_SPRING) : targetScale;
    opacity.value = animate ? withTiming(targetOpacity, { duration: STACK_FADE_DURATION }) : targetOpacity;
  }, [targetScale, targetOpacity, animate, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }, { scale: scale.value }],
    opacity: opacity.value,
  }), []);
  // A toast behind the front of a collapsed deck is clipped to the front one's
  // height so the deck reads as cards of one size whatever each toast says.
  const clipStyle: ViewStyle | null = depth > 0 && clipHeight != null
    ? { height: clipHeight, overflow: 'hidden' }
    : null;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    onMeasure(event.nativeEvent.layout.height);
  }, [onMeasure]);

  // Focus bubbles from the toast's buttons (react-native-web View forwards
  // onFocus/onBlur); pointer rest pauses the stack on web.
  const focusProps = {
    onFocus: () => onFocusChange(true),
    onBlur: () => onFocusChange(false),
  } as Pick<React.ComponentProps<typeof Animated.View>, 'onFocus' | 'onBlur'>;
  const hoverProps = webProps({
    onMouseEnter: () => onHoverChange(true),
    onMouseLeave: () => onHoverChange(false),
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          start: 0,
          end: 0,
          [anchor]: 0,
          zIndex,
        } as ViewStyle,
        clipStyle,
        animatedStyle,
      ]}
      // Deliberately hit-testable: `box-none` puts an element out of reach of
      // the pointer, so the hover handlers here would never fire and the stack
      // would never pause. The slot is exactly as wide and tall as the toast it
      // holds, so leaving it hit-testable costs no extra hit area. A toast
      // hidden at the back of a collapsed deck takes no pointer at all.
      pointerEvents={hidden ? 'none' : 'auto'}
      testID={testID}
      {...hoverProps}
      {...focusProps}
    >
      {/* Measured on the toast itself, not the slot: a clipped slot would
          otherwise report the clip height and feed it back into the layout. */}
      <View onLayout={handleLayout}>{children}</View>
    </Animated.View>
  );
}

export interface ToastStackLayout {
  /** Distance from the anchored edge for each toast id. */
  offsets: Record<string, number>;
  /** Bounds the stack needs so no toast sits outside its container. */
  stackHeight: number;
  /** Offsets to reuse for toasts that are on their way out. */
  pinned: Record<string, number>;
  /** Position of each toast in a collapsed deck (0 = in front); all 0 when listed. */
  depths: Record<string, number>;
  /** Height toasts behind the front one are clipped to; `null` when listed. */
  clipHeight: number | null;
}

/**
 * Places every toast in a stack as a distance from the anchored edge.
 *
 * Two rules produce the whole behaviour:
 *
 * - The newest toast is at offset 0. Older toasts sit further from the edge, in
 *   the order they arrived.
 * - A toast that is leaving does not advance the cursor and keeps the offset it
 *   held while visible. The toasts behind it therefore move into its slot the
 *   moment it starts leaving, instead of waiting for it to unmount.
 *
 * `collapsed` (the stacked layout at rest) replaces the first rule: the newest
 * toast is still at 0, but each older one is tucked behind it at a `STACK_PEEK`
 * step — capped at `STACK_MAX_PEEK` — and clipped to the front toast's height.
 *
 * Exported for testing: this is where a stack looks broken or correct, and it
 * is pure, so it can be checked without driving animations.
 */
export function computeStackLayout(
  items: Pick<ToastItem, 'id' | 'visible'>[],
  heights: Record<string, number>,
  spacing: number,
  previousPinned: Record<string, number>,
  collapsed = false,
): ToastStackLayout {
  // Newest first: index 0 sits against the anchored edge.
  const ordered = [...items].reverse();
  const offsets: Record<string, number> = {};
  const pinned: Record<string, number> = {};
  const depths: Record<string, number> = {};
  const front = ordered.find(item => item.visible);
  const frontHeight = front ? heights[front.id] ?? ESTIMATED_TOAST_HEIGHT : ESTIMATED_TOAST_HEIGHT;
  let cursor = 0;
  let extent = 0;
  let depth = 0;

  ordered.forEach(item => {
    const height = heights[item.id] ?? ESTIMATED_TOAST_HEIGHT;
    if (item.visible) {
      const offset = collapsed ? Math.min(depth, STACK_MAX_PEEK) * STACK_PEEK : cursor;
      offsets[item.id] = offset;
      pinned[item.id] = offset;
      depths[item.id] = collapsed ? depth : 0;
      depth += 1;
      cursor += height + spacing;
      extent = Math.max(extent, collapsed ? offset + frontHeight : cursor - spacing);
      return;
    }
    // Leaving: hold position, and don't advance the cursor so the toasts behind
    // it slide into the space it is vacating. In a collapsed deck a toast that
    // was tucked behind stays tucked (and clipped) while it fades.
    const held = previousPinned[item.id] ?? (collapsed ? 0 : cursor);
    const tucked = collapsed && held > 0;
    offsets[item.id] = held;
    pinned[item.id] = held;
    depths[item.id] = tucked ? 1 : 0;
    extent = Math.max(extent, held + (tucked ? frontHeight : height));
  });

  return { offsets, stackHeight: extent, pinned, depths, clipHeight: collapsed ? frontHeight : null };
}

export interface ToastStackProps {
  /** Screen position this stack is anchored to, e.g. `top-right`. */
  position: ToastScreenPosition;
  /** Toasts for this position, oldest first. */
  items: ToastItem[];
  /** Absolute/fixed placement style for the stack container. */
  containerStyle: ViewStyle;
  /** Vertical gap between toasts. */
  spacing: number;
  /** `stacked` collapses the position into a deck until hovered or pressed. */
  layout?: ToastLayout;
  onClose: (id: string) => void;
  onExited: (id: string) => void;
}

const directionFor = (position: ToastScreenPosition): ToastDirection => {
  if (position.endsWith('-left')) return 'left';
  if (position.endsWith('-right')) return 'right';
  return position.startsWith('bottom') ? 'bottom' : 'top';
};

/**
 * Renders one screen position's toasts.
 *
 * The stack is laid out by hand rather than by flexbox because the two things
 * that make a multi-toast stack feel broken both happen at the moment the list
 * changes, and neither is expressible in flow layout:
 *
 * 1. A leaving toast has to keep the position it is leaving from while the
 *    toasts behind it close the gap. In flow layout the gap only closes when the
 *    element unmounts, which is why the stack used to snap.
 * 2. An arriving toast must not disturb the toasts already on screen until it
 *    has a measured height, or every message on screen jumps by one frame.
 *
 * So each toast is absolutely positioned at a measured offset from the anchored
 * edge, and only the offsets animate. Toasts that are on their way out are
 * dropped from the offset run immediately and pinned to their last position, so
 * the gap closes underneath them while they fade.
 *
 * The newest toast always takes the slot nearest the anchored edge, in both top-
 * and bottom-anchored stacks: the most recent message is the one worth reading,
 * so it belongs in the one place the user's eye can learn.
 *
 * With `layout="stacked"` the same offsets collapse into a deck: only the newest
 * toast shows in full and the older ones peek out behind it, until the pointer
 * rests on the stack (or focus enters it, or it is pressed), when it expands
 * into the list above.
 */
export function ToastStack({
  position,
  items,
  containerStyle,
  spacing,
  layout = 'default',
  onClose,
  onExited,
}: ToastStackProps) {
  const anchor: StackAnchor = position.startsWith('bottom') ? 'bottom' : 'top';
  const direction = directionFor(position);
  const reducedMotion = useReducedMotion();
  const stacked = layout === 'stacked';

  const [heights, setHeights] = useState<Record<string, number>>({});
  // Last offset each toast held while it was still visible, so a leaving toast
  // can stay put while the rest of the stack moves.
  const pinnedOffsets = useRef<Record<string, number>>({});

  const setHeight = useCallback((id: string, height: number) => {
    setHeights(prev => (
      Math.abs((prev[id] ?? 0) - height) < 0.5 ? prev : { ...prev, [id]: height }
    ));
  }, []);

  // Pausing is per stack, not per toast: reaching across one toast to press the
  // button on another must not cost you the one you were reaching for.
  //
  // Tracked as sets of ids rather than as a counter, because a toast removed
  // while the pointer is on it never gets to fire its leave event — with a
  // counter that leaks one "still hovered" forever and the stack stays frozen
  // for the rest of the session.
  const hoveredIds = useRef<Set<string>>(new Set());
  const focusedIds = useRef<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);

  const syncPaused = useCallback(() => {
    setPaused(hoveredIds.current.size > 0 || focusedIds.current.size > 0);
  }, []);

  const handleHoverChange = useCallback((id: string, hovered: boolean) => {
    if (hovered) hoveredIds.current.add(id);
    else hoveredIds.current.delete(id);
    syncPaused();
  }, [syncPaused]);

  const handleFocusChange = useCallback((id: string, focused: boolean) => {
    if (focused) focusedIds.current.add(id);
    else focusedIds.current.delete(id);
    syncPaused();
  }, [syncPaused]);

  // Stacked layout: the deck opens while the pointer rests anywhere on the
  // stack (gaps included, or expanding would move a toast out from under the
  // pointer and snap the deck shut again), while focus is inside it, or after
  // a press — the touch equivalent of hover. A press toggles so it can be put
  // away again; it resets by itself once there is nothing left to stack.
  const [stackHovered, setStackHovered] = useState(false);
  const [pressedOpen, setPressedOpen] = useState(false);
  const visibleCount = items.filter(item => item.visible).length;
  useEffect(() => {
    if (visibleCount <= 1) setPressedOpen(false);
  }, [visibleCount]);
  const expanded = stackHovered || paused || pressedOpen;
  const collapsed = stacked && visibleCount > 1 && !expanded;
  // Hovering the gaps of an expanded deck pauses the countdown like hovering a
  // toast does; otherwise the list would close under a pointer that is still on it.
  const stackPaused = paused || (stacked && stackHovered);

  const { offsets, stackHeight, pinned, depths, clipHeight } = useMemo(
    () => computeStackLayout(items, heights, spacing, pinnedOffsets.current, collapsed),
    [items, heights, spacing, collapsed]
  );
  pinnedOffsets.current = pinned;

  // Forget everything about toasts that have left the tree: their measured
  // height, and any pointer or focus they were holding when they went. (Pins
  // need no cleanup — `computeStackLayout` rebuilds them from the live list.)
  useEffect(() => {
    const live = new Set(items.map(item => item.id));

    let released = false;
    [hoveredIds, focusedIds].forEach(ref => {
      ref.current.forEach(id => {
        if (live.has(id)) return;
        ref.current.delete(id);
        released = true;
      });
    });
    if (released) syncPaused();

    setHeights(prev => {
      const stale = Object.keys(prev).filter(id => !live.has(id));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      stale.forEach(id => delete next[id]);
      return next;
    });
  }, [items, syncPaused]);

  if (items.length === 0) return null;

  const ordered = [...items].reverse();

  const slots = ordered.map((item, index) => {
    // Queue bookkeeping is the provider's business; only presentation props
    // reach the toast.
    const { id, visible, timestamp, priority, groupId, message, ...toastProps } = item;

    return (
      <ToastStackItem
        key={id}
        offset={offsets[id] ?? 0}
        anchor={anchor}
        // Newest paints above the toasts it is arriving in front of.
        zIndex={ordered.length - index}
        animate={!reducedMotion}
        depth={depths[id] ?? 0}
        clipHeight={clipHeight}
        testID={toastProps.testID ? `${toastProps.testID}-slot` : undefined}
        onMeasure={height => setHeight(id, height)}
        onHoverChange={hovered => handleHoverChange(id, hovered)}
        onFocusChange={focused => handleFocusChange(id, focused)}
      >
        <Toast
          {...toastProps}
          visible={visible}
          position={direction}
          paused={stackPaused}
          onClose={() => onClose(id)}
          onExited={() => onExited(id)}
        />
      </ToastStackItem>
    );
  });

  if (!stacked) {
    return (
      <View style={[containerStyle, { height: stackHeight }, pointerEventsStyles.boxNone]}>
        {slots}
      </View>
    );
  }

  // The deck itself is hit-testable (unlike the list, whose container is
  // `box-none`): the whole stack is one hover target, and a press anywhere on it
  // that no toast control claims toggles it open. Not a tab stop — the toasts'
  // own buttons are — and not a button either: its children are the controls.
  return (
    <Pressable
      onPress={() => setPressedOpen(open => !open)}
      tabIndex={-1}
      style={[containerStyle, { height: stackHeight }]}
      {...webProps({
        onMouseEnter: () => setStackHovered(true),
        onMouseLeave: () => setStackHovered(false),
      })}
    >
      {slots}
    </Pressable>
  );
}
