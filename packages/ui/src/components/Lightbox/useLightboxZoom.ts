import { useCallback, useMemo, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { announce } from '../../core/accessibility/announce';
import { useIsomorphicLayoutEffect } from '../../core/hooks/useIsomorphicLayoutEffect';

export interface ZoomSize {
  width: number;
  height: number;
}

/** A point relative to the center of the zoom viewport. */
export interface ZoomPoint {
  x: number;
  y: number;
}

export interface ZoomTransform {
  scale: number;
  x: number;
  y: number;
}

/** Scale a double-tap / double-click / `Z` zooms to (capped at `maxZoom`). */
export const TOGGLE_ZOOM_SCALE = 2;
/** How much `+` / `-` change the scale. */
export const ZOOM_STEP = 0.5;
/** Below this a gesture snaps back to the fitted image. */
const SNAP_TO_FIT = 1.01;
const ZOOM_DURATION = 200;
const CENTER: ZoomPoint = { x: 0, y: 0 };
const IDENTITY: ZoomTransform = { scale: 1, x: 0, y: 0 };

/** Size of an image of `natural` size fitted inside `box` (`resizeMode="contain"`); `box` when unknown. */
export function fitContain(box: ZoomSize, natural?: ZoomSize | null): ZoomSize {
  if (!natural || !(natural.width > 0) || !(natural.height > 0)) return box;
  const ratio = Math.min(box.width / natural.width, box.height / natural.height);
  return { width: natural.width * ratio, height: natural.height * ratio };
}

/**
 * Clamps a pan offset so content of size `content` at `scale` never shows its
 * edge inside a `viewport`-sized window (and stays centered while it fits).
 */
export function clampOffset(offset: number, scale: number, content: number, viewport: number): number {
  const max = Math.max(0, (content * scale - viewport) / 2);
  return Math.min(max, Math.max(-max, offset));
}

export function clampTransform(transform: ZoomTransform, content: ZoomSize, viewport: ZoomSize): ZoomTransform {
  if (transform.scale <= 1) return IDENTITY;
  return {
    scale: transform.scale,
    x: clampOffset(transform.x, transform.scale, content.width, viewport.width),
    y: clampOffset(transform.y, transform.scale, content.height, viewport.height),
  };
}

/**
 * Scales to `nextScale` (kept within 1…`maxZoom`) so the image point under
 * `focal` stays put, then clamps the pan offset.
 */
export function zoomTowards(
  current: ZoomTransform,
  nextScale: number,
  focal: ZoomPoint,
  content: ZoomSize,
  viewport: ZoomSize,
  maxZoom: number
): ZoomTransform {
  const scale = Math.min(Math.max(nextScale, 1), Math.max(1, maxZoom));
  if (scale <= 1) return IDENTITY;
  const ratio = scale / current.scale;
  return clampTransform(
    { scale, x: focal.x - ratio * (focal.x - current.x), y: focal.y - ratio * (focal.y - current.y) },
    content,
    viewport
  );
}

/** The polite announcement for a zoom level. */
export function getZoomAnnouncement(scale: number): string {
  return scale > 1 ? `Zoom ${Math.round(scale * 100)}%` : 'Zoom reset';
}

function distance(a: ZoomPoint, b: ZoomPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: ZoomPoint, b: ZoomPoint): ZoomPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

interface GestureBaseline {
  transform: ZoomTransform;
  points: ZoomPoint[];
}

export interface UseLightboxZoomOptions {
  /** Whether the current slide can zoom. */
  enabled: boolean;
  maxZoom: number;
  /** Size of the fitted image at scale 1. */
  content: ZoomSize;
  /** Size of the window the image is panned within. */
  viewport: ZoomSize;
  reducedMotion: boolean;
}

export interface LightboxZoom {
  /** Committed scale (updated when a gesture ends or a discrete zoom happens). */
  scale: number;
  zoomed: boolean;
  /** Transform style for the zoomed view. */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Live zoomed state, readable from gesture callbacks between renders. */
  isZoomed: () => boolean;
  /** Fit ↔ 2×, zooming toward `focal` (relative to the viewport center). */
  toggle: (focal?: ZoomPoint) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Multiplies the scale (wheel / trackpad pinch); `announce` is left to the caller. */
  zoomBy: (factor: number, focal?: ZoomPoint) => void;
  reset: (options?: { animate?: boolean; announce?: boolean }) => void;
  /** Touch points (relative to the viewport center) at the start of a pinch / pan. */
  gestureStart: (points: ZoomPoint[]) => void;
  gestureMove: (points: ZoomPoint[]) => void;
  gestureEnd: () => void;
  announceCurrent: () => void;
}

/**
 * Zoom and pan state for the lightbox's current image: reanimated shared
 * values drive the transform (gesture moves write them directly, without a
 * React render), and the committed scale is React state for the chrome.
 */
export function useLightboxZoom({ enabled, maxZoom, content, viewport, reducedMotion }: UseLightboxZoomOptions): LightboxZoom {
  const scaleValue = useSharedValue(1);
  const xValue = useSharedValue(0);
  const yValue = useSharedValue(0);
  const transformRef = useRef<ZoomTransform>(IDENTITY);
  const baselineRef = useRef<GestureBaseline | null>(null);
  const [scale, setScale] = useState(1);

  const settings = useRef({ enabled, maxZoom, content, viewport, reducedMotion });
  useIsomorphicLayoutEffect(() => {
    settings.current = { enabled, maxZoom, content, viewport, reducedMotion };
  });

  const write = useCallback(
    (next: ZoomTransform, animate: boolean) => {
      transformRef.current = next;
      if (animate && !settings.current.reducedMotion) {
        const config = { duration: ZOOM_DURATION };
        scaleValue.value = withTiming(next.scale, config);
        xValue.value = withTiming(next.x, config);
        yValue.value = withTiming(next.y, config);
      } else {
        scaleValue.value = next.scale;
        xValue.value = next.x;
        yValue.value = next.y;
      }
    },
    [scaleValue, xValue, yValue]
  );

  // `announce`: tell screen readers about a new level; `silent`: the new level
  // needs no announcement (slide change); `defer`: a wheel tick — announced
  // once the wheel goes idle, through `announceCurrent`.
  const lastAnnounced = useRef(1);
  const commit = useCallback((mode: 'announce' | 'silent' | 'defer') => {
    const next = transformRef.current.scale;
    setScale(next);
    if (mode === 'silent') {
      lastAnnounced.current = next;
    } else if (mode === 'announce' && lastAnnounced.current !== next) {
      lastAnnounced.current = next;
      announce(getZoomAnnouncement(next));
    }
  }, []);

  const zoomTo = useCallback(
    (nextScale: number, focal: ZoomPoint = CENTER) => {
      const { enabled: on, content: c, viewport: v, maxZoom: max } = settings.current;
      if (!on) return;
      write(zoomTowards(transformRef.current, nextScale, focal, c, v, max), true);
      commit('announce');
    },
    [write, commit]
  );

  const reset = useCallback(
    ({ animate = false, announce: shouldAnnounce = false }: { animate?: boolean; announce?: boolean } = {}) => {
      baselineRef.current = null;
      const t = transformRef.current;
      if (t.scale === 1 && t.x === 0 && t.y === 0) return;
      write(IDENTITY, animate);
      commit(shouldAnnounce ? 'announce' : 'silent');
    },
    [write, commit]
  );

  const toggle = useCallback(
    (focal?: ZoomPoint) => {
      if (transformRef.current.scale > 1) {
        if (settings.current.enabled) reset({ animate: true, announce: true });
      } else {
        zoomTo(TOGGLE_ZOOM_SCALE, focal);
      }
    },
    [reset, zoomTo]
  );

  const zoomIn = useCallback(() => zoomTo(transformRef.current.scale + ZOOM_STEP), [zoomTo]);
  const zoomOut = useCallback(() => zoomTo(transformRef.current.scale - ZOOM_STEP), [zoomTo]);

  const zoomBy = useCallback(
    (factor: number, focal: ZoomPoint = CENTER) => {
      const { enabled: on, content: c, viewport: v, maxZoom: max } = settings.current;
      if (!on) return;
      const current = transformRef.current;
      write(zoomTowards(current, current.scale * factor, focal, c, v, max), false);
      commit('defer');
    },
    [write, commit]
  );

  const gestureStart = useCallback((points: ZoomPoint[]) => {
    baselineRef.current = { transform: transformRef.current, points };
  }, []);

  const gestureMove = useCallback(
    (points: ZoomPoint[]) => {
      const { enabled: on, content: c, viewport: v, maxZoom: max } = settings.current;
      const baseline = baselineRef.current;
      if (!on || points.length === 0) return;
      // A finger was added or lifted: continue from where the image is now.
      if (!baseline || baseline.points.length !== Math.min(points.length, 2)) {
        baselineRef.current = { transform: transformRef.current, points: points.slice(0, 2) };
        return;
      }
      const start = baseline.transform;
      if (points.length >= 2) {
        const [a0, b0] = baseline.points;
        const startDistance = distance(a0, b0);
        if (startDistance < 1) return;
        const startMid = midpoint(a0, b0);
        const mid = midpoint(points[0], points[1]);
        const scaled = zoomTowards(start, (start.scale * distance(points[0], points[1])) / startDistance, startMid, c, v, max);
        // Follow the fingers' midpoint as well as their spread.
        write(
          clampTransform({ scale: scaled.scale, x: scaled.x + mid.x - startMid.x, y: scaled.y + mid.y - startMid.y }, c, v),
          false
        );
      } else if (start.scale > 1) {
        const [p0] = baseline.points;
        write(clampTransform({ scale: start.scale, x: start.x + points[0].x - p0.x, y: start.y + points[0].y - p0.y }, c, v), false);
      }
    },
    [write]
  );

  const gestureEnd = useCallback(() => {
    baselineRef.current = null;
    if (transformRef.current.scale < SNAP_TO_FIT) write(IDENTITY, true);
    commit('announce');
  }, [write, commit]);

  const announceCurrent = useCallback(() => commit('announce'), [commit]);
  const isZoomed = useCallback(() => transformRef.current.scale > 1, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: xValue.value }, { translateY: yValue.value }, { scale: scaleValue.value }],
  }));

  return useMemo(
    () => ({
      scale,
      zoomed: scale > 1,
      animatedStyle,
      isZoomed,
      toggle,
      zoomIn,
      zoomOut,
      zoomBy,
      reset,
      gestureStart,
      gestureMove,
      gestureEnd,
      announceCurrent,
    }),
    [scale, animatedStyle, isZoomed, toggle, zoomIn, zoomOut, zoomBy, reset, gestureStart, gestureMove, gestureEnd, announceCurrent]
  );
}
