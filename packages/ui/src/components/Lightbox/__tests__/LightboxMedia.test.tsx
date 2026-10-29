import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Lightbox } from '../Lightbox';
import { Text } from '../../Text';
import type { LightboxItem } from '../types';
import { clampOffset, fitContain, zoomTowards } from '../useLightboxZoom';

const IMAGES: LightboxItem[] = [
  { id: 'a', uri: 'https://example.com/a.jpg', title: 'Lake' },
  { id: 'b', uri: 'https://example.com/b.jpg', title: 'Forest' },
  { id: 'c', uri: 'https://example.com/c.jpg', title: 'Dunes' },
];

const MEDIA: LightboxItem[] = [
  { id: 'a', uri: 'https://example.com/a.jpg', title: 'Lake' },
  { id: 'v', type: 'video', src: 'https://example.com/clip.mp4', poster: 'https://example.com/poster.jpg', title: 'Clip' },
];

type Transform = { scale?: number; translateX?: number; translateY?: number };

/** The current scale / offset of the zoomed image (reanimated's mock reads shared values lazily). */
function zoomOf(testID: string): Required<Transform> {
  const style = StyleSheet.flatten(screen.getByTestId(`${testID}-zoom`).props.style) as { transform?: Transform[] };
  const merged = Object.assign({}, ...(style.transform ?? [])) as Transform;
  return { scale: merged.scale ?? 1, translateX: merged.translateX ?? 0, translateY: merged.translateY ?? 0 };
}

function doubleTap(testID: string, pageX = 0, pageY = 0) {
  const slide = screen.getByTestId(`${testID}-slide`);
  const event = { nativeEvent: { pageX, pageY } };
  fireEvent.press(slide, event);
  fireEvent.press(slide, event);
}

let timestamp = 0;

/** A responder event with the given touches, as PanResponder reads it. */
function touchEvent(points: { x: number; y: number }[], start: { x: number; y: number }) {
  timestamp += 1;
  const current = points[0] ?? start;
  return {
    nativeEvent: { touches: points.map(({ x, y }) => ({ pageX: x, pageY: y })), pageX: current.x, pageY: current.y },
    touchHistory: {
      numberActiveTouches: points.length,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timestamp,
      touchBank: [
        {
          touchActive: points.length > 0,
          startPageX: start.x,
          startPageY: start.y,
          startTimeStamp: 0,
          currentPageX: current.x,
          currentPageY: current.y,
          currentTimeStamp: timestamp,
          previousPageX: start.x,
          previousPageY: start.y,
          previousTimeStamp: timestamp - 1,
        },
      ],
    },
  };
}

/** Drives the stage's pan responder directly: grant, one move per step, release. */
function drag(testID: string, steps: { x: number; y: number }[][]) {
  const stage = screen.getByTestId(`${testID}-stage`);
  const start = steps[0][0];
  act(() => {
    stage.props.onResponderGrant(touchEvent(steps[0], start));
  });
  for (const step of steps.slice(1)) {
    act(() => {
      stage.props.onResponderMove(touchEvent(step, start));
    });
  }
  act(() => {
    stage.props.onResponderRelease(touchEvent([], steps[steps.length - 1][0]));
  });
}

describe('Lightbox zoom', () => {
  it('toggles between fit and 2× on double tap', () => {
    render(<Lightbox opened images={IMAGES} testID="lb" />);
    expect(zoomOf('lb').scale).toBe(1);
    doubleTap('lb');
    expect(zoomOf('lb').scale).toBe(2);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeTruthy();
    doubleTap('lb');
    expect(zoomOf('lb').scale).toBe(1);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy();
  });

  it('zooms with the zoom button and resets on slide change', () => {
    render(<Lightbox opened images={IMAGES} testID="lb" />);
    fireEvent.press(screen.getByRole('button', { name: 'Zoom in' }));
    expect(zoomOf('lb').scale).toBe(2);
    fireEvent.press(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('image', { name: 'Forest' })).toBeTruthy();
    expect(zoomOf('lb').scale).toBe(1);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy();
  });

  it('pinches to zoom, capped at maxZoom', () => {
    render(<Lightbox opened images={IMAGES} testID="lb" maxZoom={2.5} />);
    drag('lb', [
      [{ x: 300, y: 400 }, { x: 400, y: 400 }],
      [{ x: 250, y: 400 }, { x: 450, y: 400 }],
    ]);
    expect(zoomOf('lb').scale).toBeCloseTo(2);
    drag('lb', [
      [{ x: 300, y: 400 }, { x: 400, y: 400 }],
      [{ x: 100, y: 400 }, { x: 600, y: 400 }],
    ]);
    expect(zoomOf('lb').scale).toBe(2.5);
  });

  it('swipes between slides at fit, but pans instead while zoomed', () => {
    const onImageChange = jest.fn();
    render(<Lightbox opened images={IMAGES} testID="lb" onImageChange={onImageChange} />);

    drag('lb', [[{ x: 600, y: 400 }], [{ x: 200, y: 400 }]]);
    expect(onImageChange).toHaveBeenLastCalledWith(1, IMAGES[1]);
    onImageChange.mockClear();

    fireEvent.press(screen.getByRole('button', { name: 'Zoom in' }));
    expect(zoomOf('lb')).toEqual({ scale: 2, translateX: 0, translateY: 0 });
    drag('lb', [[{ x: 600, y: 400 }], [{ x: 500, y: 400 }]]);
    expect(onImageChange).not.toHaveBeenCalled();
    expect(zoomOf('lb').translateX).toBe(-100);

    // Clamped: at 2× a full-width image has half a screen of slack each way.
    drag('lb', [[{ x: 600, y: 400 }], [{ x: -5000, y: 400 }]]);
    expect(onImageChange).not.toHaveBeenCalled();
    const { width } = StyleSheet.flatten(screen.getByTestId('lb-stage').props.style) as { width: number };
    expect(zoomOf('lb').translateX).toBe(-width / 2);
  });

  it('does not zoom when allowZoom is false', () => {
    render(<Lightbox opened images={IMAGES} testID="lb" allowZoom={false} />);
    doubleTap('lb');
    expect(zoomOf('lb').scale).toBe(1);
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
  });
});

describe('Lightbox zoom math', () => {
  it('fits the natural size inside the box', () => {
    expect(fitContain({ width: 400, height: 400 }, { width: 800, height: 400 })).toEqual({ width: 400, height: 200 });
    expect(fitContain({ width: 400, height: 400 }, null)).toEqual({ width: 400, height: 400 });
  });

  it('clamps the pan so the image edge stays outside the viewport', () => {
    // 400px content at 2× is 800px in a 400px viewport: 200px of slack each way.
    expect(clampOffset(500, 2, 400, 400)).toBe(200);
    expect(clampOffset(-500, 2, 400, 400)).toBe(-200);
    // Smaller than the viewport: stays centered.
    expect(clampOffset(50, 1.5, 200, 400)).toBe(0);
  });

  it('keeps the focal point in place while zooming', () => {
    const next = zoomTowards({ scale: 1, x: 0, y: 0 }, 2, { x: 100, y: 0 }, { width: 400, height: 400 }, { width: 400, height: 400 }, 3);
    // The image point under x=100 stays under x=100: 100 - 2 × 100 = -100.
    expect(next).toEqual({ scale: 2, x: -100, y: 0 });
  });
});

describe('Lightbox slides', () => {
  it('shows a video poster with a play button on native without expo-video', () => {
    // The one-time "expo-video not found" development warning.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onVideoPress = jest.fn();
    render(<Lightbox opened images={MEDIA} initialIndex={1} onVideoPress={onVideoPress} testID="lb" />);
    expect(screen.getByRole('image', { name: 'Clip' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Play video: Clip' }));
    expect(onVideoPress).toHaveBeenCalledWith(MEDIA[1]);
    // Video slides never zoom.
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
    expect(screen.queryByTestId('lb-zoom')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Video 2 of 2: Clip' })).toBeTruthy();
    warn.mockRestore();
  });

  it('renders custom slides from renderSlide, falling back on undefined', () => {
    render(
      <Lightbox
        opened
        images={IMAGES}
        testID="lb"
        renderSlide={(item, { index, active }) =>
          item.id === 'b' ? <Text>{`Custom ${index} ${active ? 'active' : 'idle'}`}</Text> : undefined
        }
      />
    );
    expect(screen.getByRole('image', { name: 'Lake' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('Custom 1 active')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
  });

  it('passes thumbnailSize to the thumbnail strip', () => {
    render(<Lightbox opened images={IMAGES} thumbnailSize={80} />);
    const tab = screen.getAllByRole('tab')[0];
    expect(StyleSheet.flatten(tab.props.style)).toMatchObject({ width: 80, height: 80 });
  });
});
