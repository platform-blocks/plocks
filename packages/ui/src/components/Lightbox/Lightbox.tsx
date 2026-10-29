import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Modal, Image, StatusBar, StyleSheet, Pressable, PanResponder } from 'react-native';
import type { GestureResponderEvent, ImageLoadEventData, NativeSyntheticEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { factory } from '../../core/factory/factory';
import { a11yProps } from '../../core/accessibility/a11yProps';
import { announce } from '../../core/accessibility/announce';
import { useScreenReaderEnabled } from '../../core/accessibility/context';
import { useIsomorphicLayoutEffect } from '../../core/hooks/useIsomorphicLayoutEffect';
import { useLatestCallback } from '../../core/hooks/useLatestCallback';
import { useReducedMotion } from '../../core/motion/useReducedMotion';
import { handleModalRequestClose } from '../../core/overlay/layerStack';
import { LayerScope, useLayer } from '../../core/overlay/useLayer';
import { OverlayHost } from '../../core/overlay/OverlayHost';
import { hasDOM, isWeb, webProps, webStyle } from '../../core/platform';
import type { WebKeyboardEvent } from '../../core/platform';
import { useDirection } from '../../core/providers/DirectionProvider';
import { useViewport } from '../../core/responsive';
import { useTheme } from '../../core/theme/ThemeProvider';
import { resolveScrim } from '../../core/theme/tokens';
import { useStyleProps } from '../../core/utils/spacing';
import { useMergedRef } from '../../core/utils/mergeRefs';
import { Text } from '../Text';
import { LightboxControls } from './LightboxControls';
import { LightboxThumbnails, getLightboxImageLabel, getLightboxSlideLabel } from './LightboxThumbnails';
import { LightboxMetadata } from './LightboxMetadata';
import { LightboxVideo } from './LightboxVideo';
import type { LightboxModalProps } from './types';
import { fitContain, useLightboxZoom } from './useLightboxZoom';
import type { ZoomPoint, ZoomSize } from './useLightboxZoom';
import { resolveImageSource } from '../../utils/imageSource';

const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_VELOCITY_THRESHOLD = 500;
const CONTROLS_HIDE_DELAY = 3000;
/** Share of the screen height the slide box takes. */
const SLIDE_HEIGHT_RATIO = 0.8;
/** Two taps within this many ms and px of each other are a double tap. */
const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_SLOP = 40;
/** Movement (px) before a drag on a zoomed image starts panning. */
const PAN_SLOP = 4;
/** ctrl/⌘ + wheel: scale factor per pixel of wheel delta. */
const WHEEL_ZOOM_SPEED = 0.01;
/** The wheel has no end event: announce the zoom level once it's been idle this long. */
const WHEEL_ANNOUNCE_DELAY = 300;

interface TouchLike {
  pageX: number;
  pageY: number;
}

/** Whether a web event comes from a `<video>` (its controls own their keys and drags). */
function fromMediaElement(target: unknown): boolean {
  if (!isWeb || !target || typeof target !== 'object') return false;
  const tag = (target as { tagName?: unknown }).tagName;
  return tag === 'VIDEO' || tag === 'AUDIO';
}

function activeTouches(event: GestureResponderEvent | undefined): TouchLike[] {
  const touches = event?.nativeEvent?.touches;
  return Array.isArray(touches) ? (touches as TouchLike[]) : [];
}

/**
 * Full-screen media viewer in a modal: swipe, arrow keys (web) and on-screen
 * buttons move between slides; a thumbnail strip (tab list) jumps to one.
 * Images zoom (double-tap / double-click, pinch, ctrl/⌘ + wheel, `+` `-` `0`
 * `Z`, the zoom button) and pan while zoomed; video slides play in the
 * platform's player.
 *
 * It is a modal layer: focus moves into it and is trapped while open and
 * restored on close; Escape (web) and the Android back button close only the
 * topmost layer. Slide and zoom changes are announced to screen readers, and
 * the controls don't auto-hide while focus is inside them or a screen reader is on.
 */
export const Lightbox = factory<{ props: LightboxModalProps; ref: View }>((props, ref) => {
  const {
    opened = false,
    images,
    initialIndex = 0,
    onClose,
    onImageChange,
    onDownload,
    showMetadata = false,
    showThumbnails = true,
    showDownloadButton = true,
    allowKeyboardNavigation = true,
    allowSwipeNavigation = true,
    allowZoom = true,
    maxZoom = 3,
    thumbnailSize,
    renderSlide,
    onVideoPress,
    overlayOpacity = 0.9,
    animationDuration = 250,
    accessibilityLabel,
    style,
    testID,
  } = props;

  const theme = useTheme();
  const spacingStyles = useStyleProps(props);
  const { width: screenWidth, height: screenHeight } = useViewport();
  const { isRTL } = useDirection();
  const reducedMotion = useReducedMotion();
  const screenReaderEnabled = useScreenReaderEnabled();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [metadataVisible, setMetadataVisible] = useState(false);
  const [thumbnailsVisible, setThumbnailsVisible] = useState(true);
  const [focusWithin, setFocusWithin] = useState(false);
  /** Natural size of the current image once loaded, keyed by the item id. */
  const [loadedSize, setLoadedSize] = useState<(ZoomSize & { id: string }) | null>(null);
  const [stageNode, setStageNode] = useState<View | null>(null);

  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<(ZoomPoint & { time: number }) | null>(null);
  const gestureMode = useRef<'none' | 'zoom' | 'swipe'>('none');
  const dialogRef = useRef<View>(null);
  const mergedDialogRef = useMergedRef<View>(dialogRef, ref);

  const handleClose = useLatestCallback(onClose);
  const emitImageChange = useLatestCallback(onImageChange);

  const currentItem = images[currentIndex];
  const isImageSlide = !!currentItem && currentItem.type !== 'video';
  // `undefined` from renderSlide means "render this item the default way".
  const customSlide = opened && currentItem && renderSlide ? renderSlide(currentItem, { index: currentIndex, active: true }) : undefined;
  const zoomEnabled = allowZoom && maxZoom > 1 && isImageSlide && customSlide === undefined;

  const viewport = useMemo<ZoomSize>(() => ({ width: screenWidth, height: screenHeight }), [screenWidth, screenHeight]);
  const slideBox = useMemo<ZoomSize>(
    () => ({ width: screenWidth, height: screenHeight * SLIDE_HEIGHT_RATIO }),
    [screenWidth, screenHeight]
  );
  const knownSize = loadedSize && currentItem && loadedSize.id === currentItem.id ? loadedSize : currentItem?.metadata?.dimensions;
  const content = useMemo(() => fitContain(slideBox, knownSize), [slideBox, knownSize]);

  const zoom = useLightboxZoom({ enabled: zoomEnabled, maxZoom, content, viewport, reducedMotion });
  const { reset: resetZoom, isZoomed, zoomBy, announceCurrent: announceZoom } = zoom;

  // Latest values for the pan responder, which is created once.
  const latest = useRef({ zoomEnabled, swipeEnabled: allowSwipeNavigation, viewport });
  useIsomorphicLayoutEffect(() => {
    latest.current = { zoomEnabled, swipeEnabled: allowSwipeNavigation, viewport };
  });

  const { id: layerId } = useLayer({
    active: opened && images.length > 0,
    onDismiss: () => handleClose(),
    modal: true,
    containerRef: dialogRef,
  });

  // Reset to initial index when modal opens
  useEffect(() => {
    if (opened) {
      setCurrentIndex(initialIndex);
    }
  }, [opened, initialIndex]);

  // A new slide (or reopening, or zoom being turned off) starts at fit.
  useEffect(() => {
    resetZoom();
    lastTap.current = null;
  }, [currentIndex, opened, zoomEnabled, resetZoom]);

  // Auto-hide controls — never while a screen reader is on or focus is inside.
  const keepControls = screenReaderEnabled || focusWithin;
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    setControlsVisible(true);
    controlsTimeout.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (opened) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [opened, resetControlsTimeout]);

  const goToImage = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return;
    // Reset now, not after the commit, so the next slide never shows zoomed.
    resetZoom();
    setCurrentIndex(index);
    emitImageChange(index, images[index]);
    announce(getLightboxSlideLabel(images[index], index, images.length));
    resetControlsTimeout();
  }, [images, emitImageChange, resetControlsTimeout, resetZoom]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) goToImage(currentIndex - 1);
  }, [currentIndex, goToImage]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) goToImage(currentIndex + 1);
  }, [currentIndex, images.length, goToImage]);

  /** A page coordinate as a point relative to the center of the stage (the full-screen slide area). */
  const toStagePoint = useCallback((pageX: number, pageY: number): ZoomPoint => {
    const { width, height } = latest.current.viewport;
    // The modal is fixed to the window; on web, page coordinates include the document scroll.
    const scrollX = hasDOM ? window.scrollX : 0;
    const scrollY = hasDOM ? window.scrollY : 0;
    return { x: pageX - scrollX - width / 2, y: pageY - scrollY - height / 2 };
  }, []);

  // Pan responder for swipe, pinch and pan. Created once; reads the latest
  // handlers and settings through refs and these stable callbacks.
  const swipe = useLatestCallback((swipedRight: boolean) => {
    // LTR: a rightward swipe reveals the previous image. RTL lays images out
    // right-to-left, so there a rightward swipe goes forward.
    if (swipedRight !== isRTL) goToPrevious();
    else goToNext();
  });
  const touchControls = useLatestCallback(resetControlsTimeout);
  const { gestureStart, gestureMove, gestureEnd } = zoom;
  const panResponder = useMemo(() => {
    const stagePoints = (event: GestureResponderEvent) =>
      activeTouches(event).map((touch) => toStagePoint(touch.pageX, touch.pageY));
    const wantsZoomGesture = (event: GestureResponderEvent, moved: number) =>
      latest.current.zoomEnabled && (activeTouches(event).length >= 2 || (isZoomed() && moved > PAN_SLOP));
    const endZoomGesture = () => {
      if (gestureMode.current === 'zoom') gestureEnd();
      gestureMode.current = 'none';
    };
    return PanResponder.create({
      // Two fingers down at once: a pinch from the start.
      onStartShouldSetPanResponder: (event) => latest.current.zoomEnabled && activeTouches(event).length >= 2,
      onMoveShouldSetPanResponder: (event, gestureState) => {
        // Drags on a <video>'s own controls (scrubbing) stay with the video.
        if (fromMediaElement(event?.nativeEvent?.target)) return false;
        const moved = Math.abs(gestureState.dx) + Math.abs(gestureState.dy);
        if (wantsZoomGesture(event, moved)) return true;
        return latest.current.swipeEnabled && !isZoomed() && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: (event) => {
        touchControls();
        if (latest.current.zoomEnabled && (activeTouches(event).length >= 2 || isZoomed())) {
          gestureMode.current = 'zoom';
          gestureStart(stagePoints(event));
        } else {
          gestureMode.current = 'swipe';
        }
      },
      onPanResponderMove: (event) => {
        const points = stagePoints(event);
        // A second finger joined a swipe: it becomes a pinch.
        if (gestureMode.current === 'swipe' && latest.current.zoomEnabled && points.length >= 2) {
          gestureMode.current = 'zoom';
          gestureStart(points);
          return;
        }
        if (gestureMode.current === 'zoom') gestureMove(points);
      },
      // Don't hand a pinch / pan to a parent mid-gesture.
      onPanResponderTerminationRequest: () => gestureMode.current !== 'zoom',
      onPanResponderRelease: (_, gestureState) => {
        const mode = gestureMode.current;
        endZoomGesture();
        // While zoomed a drag pans; slides change only at fit.
        if (mode === 'zoom' || !latest.current.swipeEnabled || isZoomed()) return;
        const { dx, vx } = gestureState;
        if (Math.abs(dx) > latest.current.viewport.width * SWIPE_DISTANCE_RATIO || Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD) {
          swipe(dx > 0);
        }
      },
      onPanResponderTerminate: endZoomGesture,
    });
  }, [toStagePoint, isZoomed, gestureStart, gestureMove, gestureEnd, swipe, touchControls]);

  // Tap: show the controls. Double tap / double click: toggle zoom at that point.
  const handleStagePress = useCallback((event?: GestureResponderEvent) => {
    resetControlsTimeout();
    if (!zoomEnabled) return;
    const native = event?.nativeEvent as Partial<TouchLike> | undefined;
    const point =
      native && typeof native.pageX === 'number' && typeof native.pageY === 'number'
        ? toStagePoint(native.pageX, native.pageY)
        : { x: 0, y: 0 };
    const now = Date.now();
    const previous = lastTap.current;
    if (
      previous &&
      now - previous.time < DOUBLE_TAP_DELAY &&
      Math.hypot(point.x - previous.x, point.y - previous.y) < DOUBLE_TAP_SLOP
    ) {
      lastTap.current = null;
      zoom.toggle(point);
    } else {
      lastTap.current = { ...point, time: now };
    }
  }, [resetControlsTimeout, zoomEnabled, toStagePoint, zoom]);

  // ctrl/⌘ + wheel and trackpad pinch (which browsers send as ctrl + wheel) on web.
  // A native listener, since React's wheel listener is passive and the browser
  // would zoom the page.
  useEffect(() => {
    if (!isWeb || !zoomEnabled || !stageNode) return;
    const node = stageNode as unknown as HTMLElement;
    if (typeof node.addEventListener !== 'function') return;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight || 800 : 1;
      const delta = Math.max(-50, Math.min(50, event.deltaY * unit));
      const rect = node.getBoundingClientRect();
      zoomBy(Math.exp(-delta * WHEEL_ZOOM_SPEED), {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      });
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(announceZoom, WHEEL_ANNOUNCE_DELAY);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', onWheel);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [stageNode, zoomEnabled, zoomBy, announceZoom]);

  // Keys (web), scoped to the dialog. The thumbnail strip handles its own
  // arrows (and stops them), so this only sees keys from elsewhere in the dialog.
  // A focused <video> keeps its own keys (seek, volume).
  const handleKeyDown = useCallback((event: WebKeyboardEvent) => {
    if (event.defaultPrevented || fromMediaElement(event.target)) return;
    const { key } = event;
    if (allowKeyboardNavigation) {
      const back = isRTL ? 'ArrowRight' : 'ArrowLeft';
      const forward = isRTL ? 'ArrowLeft' : 'ArrowRight';
      if (key === back) {
        event.preventDefault();
        goToPrevious();
        return;
      }
      if (key === forward) {
        event.preventDefault();
        goToNext();
        return;
      }
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (zoomEnabled) {
      if (key === '+' || key === '=') {
        event.preventDefault();
        zoom.zoomIn();
        return;
      }
      if (key === '-' || key === '_') {
        event.preventDefault();
        zoom.zoomOut();
        return;
      }
      if (key === '0') {
        event.preventDefault();
        zoom.reset({ animate: true, announce: true });
        return;
      }
      if (key === 'z' || key === 'Z') {
        event.preventDefault();
        zoom.toggle();
        return;
      }
    }
    if (showThumbnails && (key === 't' || key === 'T')) {
      event.preventDefault();
      setThumbnailsVisible((visible) => !visible);
    }
  }, [allowKeyboardNavigation, isRTL, goToPrevious, goToNext, zoomEnabled, zoom, showThumbnails]);

  const handleDownload = useCallback(() => {
    onDownload?.(images[currentIndex]);
  }, [currentIndex, images, onDownload]);

  const toggleMetadata = useCallback(() => {
    setMetadataVisible(prev => !prev);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const toggleZoom = useCallback(() => {
    zoom.toggle();
    resetControlsTimeout();
  }, [zoom, resetControlsTimeout]);

  const currentId = currentItem?.id;
  const handleImageLoad = useCallback((event: NativeSyntheticEvent<ImageLoadEventData>) => {
    const source = event?.nativeEvent?.source;
    if (currentId && source && source.width > 0 && source.height > 0) {
      setLoadedSize({ id: currentId, width: source.width, height: source.height });
    }
  }, [currentId]);

  const currentUri = currentItem && currentItem.type !== 'video' ? currentItem.uri : undefined;
  const currentImageSource = useMemo(() => (currentUri ? resolveImageSource(currentUri) : undefined), [currentUri]);

  if (!opened || images.length === 0 || !currentItem) {
    return null;
  }
  // An image slide without a usable source has nothing to show.
  if (isImageSlide && !currentImageSource && customSlide === undefined) {
    return null;
  }

  const showControls = controlsVisible || keepControls;
  const slideLabel = currentItem.title ?? currentItem.description ?? getLightboxImageLabel(
    currentIndex,
    images.length,
    undefined,
    currentItem.type === 'video' ? 'video' : 'image'
  );
  const noAnimation = reducedMotion || animationDuration === 0;
  const slideTestID = testID ? `${testID}-slide` : undefined;

  let slide: React.ReactNode;
  if (customSlide !== undefined) {
    slide = customSlide;
  } else if (currentItem.type === 'video') {
    slide = (
      <LightboxVideo
        key={currentItem.id}
        item={currentItem}
        active
        width={slideBox.width}
        height={slideBox.height}
        label={slideLabel}
        onVideoPress={onVideoPress}
      />
    );
  } else {
    slide = (
      <Animated.View style={zoom.animatedStyle} testID={testID ? `${testID}-zoom` : undefined}>
        <Image
          source={currentImageSource}
          style={{ width: slideBox.width, height: slideBox.height }}
          resizeMode="contain"
          onLoad={handleImageLoad}
          {...a11yProps({ role: 'img', label: slideLabel, accessible: true })}
        />
      </Animated.View>
    );
  }

  return (
    <Modal
      visible={opened}
      transparent
      animationType={noAnimation ? 'none' : 'fade'}
      // Android back goes to the layer stack (topmost layer only); on web the
      // stack already handled Escape on keydown.
      onRequestClose={handleModalRequestClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <OverlayHost>
        <LayerScope id={layerId}>
          <View
            ref={mergedDialogRef}
            style={[styles.container, spacingStyles, style]}
            testID={testID}
            {...a11yProps({ role: 'dialog', modal: true, label: accessibilityLabel ?? 'Image gallery' })}
            onFocus={() => setFocusWithin(true)}
            onBlur={() => setFocusWithin(false)}
            {...webProps({ onKeyDown: handleKeyDown })}
          >
            {/* The theme scrim's color at `overlayOpacity` (dark enough for the light media chrome). */}
            <View style={[styles.overlay, { backgroundColor: resolveScrim(theme, overlayOpacity) }]}>
              {/* Current slide */}
              <View
                ref={setStageNode}
                style={[
                  styles.stage,
                  { width: screenWidth, height: screenHeight },
                  zoomEnabled && webStyle({ touchAction: 'none', cursor: zoom.zoomed ? 'grab' : 'zoom-in' }),
                ]}
                testID={testID ? `${testID}-stage` : undefined}
                {...panResponder.panHandlers}
              >
                <Pressable style={styles.imageWrapper} onPress={handleStagePress} accessible={false} testID={slideTestID}>
                  {slide}
                </Pressable>
              </View>

              {/* Controls */}
              {showControls && (
                <LightboxControls
                  currentIndex={currentIndex}
                  totalImages={images.length}
                  onPrevious={goToPrevious}
                  onNext={goToNext}
                  onClose={() => handleClose()}
                  onDownload={showDownloadButton ? handleDownload : undefined}
                  showDownloadButton={showDownloadButton}
                  image={currentItem}
                  zoomed={zoom.zoomed}
                  onToggleZoom={zoomEnabled ? toggleZoom : undefined}
                />
              )}

              {/* Thumbnails */}
              {showThumbnails && thumbnailsVisible && showControls && (
                <View style={styles.thumbnailsContainer}>
                  <LightboxThumbnails
                    images={images}
                    currentIndex={currentIndex}
                    onThumbnailPress={goToImage}
                    thumbnailSize={thumbnailSize}
                  />
                </View>
              )}

              {/* Metadata */}
              {showMetadata && <LightboxMetadata image={currentItem} visible={metadataVisible} />}

              {/* Metadata Toggle */}
              {showMetadata && showControls && currentItem.metadata && (
                <Pressable
                  style={styles.metadataToggle}
                  onPress={toggleMetadata}
                  {...a11yProps({ role: 'button', expanded: metadataVisible })}
                >
                  <Text style={styles.metadataToggleText}>{metadataVisible ? 'Hide Info' : 'Show Info'}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </LayerScope>
      </OverlayHost>
    </Modal>
  );
}, { displayName: 'Lightbox' });

// Media chrome: the photo sits on a dark scrim with light controls.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrapper: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  metadataToggle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    bottom: 20,
    end: 20,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
  },
  metadataToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stage: {
    overflow: 'hidden',
  },
  thumbnailsContainer: {
    bottom: 0,
    end: 0,
    position: 'absolute',
    start: 0,
  },
});
