import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PlocksProvider } from '../../../core/theme/PlocksProvider';
import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';
import { Lightbox } from '../Lightbox';
import type { LightboxItem, LightboxModalProps } from '../types';

const IMAGES: LightboxItem[] = [
  { id: 'a', uri: 'https://example.com/a.jpg', title: 'Lake' },
  { id: 'b', uri: 'https://example.com/b.jpg', title: 'Forest' },
];

const MEDIA: LightboxItem[] = [
  { id: 'a', uri: 'https://example.com/a.jpg', title: 'Lake' },
  {
    id: 'v',
    type: 'video',
    src: 'https://example.com/clip.mp4',
    poster: 'https://example.com/poster.jpg',
    title: 'Clip',
    autoPlay: true,
    muted: true,
  },
  { id: 'c', uri: 'https://example.com/c.jpg', title: 'Dunes' },
];

function renderLightbox(props: Partial<LightboxModalProps> = {}) {
  return render(
    <PlocksProvider>
      <Lightbox opened images={IMAGES} testID="lb" {...props} />
    </PlocksProvider>
  );
}

const zoomButton = () => screen.getByRole('button', { name: /^(Zoom in|Reset zoom)$/ });
const isZoomed = () => zoomButton().getAttribute('aria-label') === 'Reset zoom';
const press = (key: string) => fireEvent.keyDown(screen.getByRole('button', { name: 'Close gallery' }), { key });

beforeEach(() => __resetLayerStackForTests());

describe('Lightbox zoom (react-native-web DOM)', () => {
  it('toggles zoom on double click', async () => {
    renderLightbox();
    const slide = screen.getByTestId('lb-slide');
    expect(isZoomed()).toBe(false);
    fireEvent.click(slide);
    fireEvent.click(slide);
    expect(isZoomed()).toBe(true);
    await waitFor(() => expect(screen.getByTestId('lb-zoom').style.transform).toContain('scale(2)'));
    fireEvent.click(slide);
    fireEvent.click(slide);
    expect(isZoomed()).toBe(false);
  });

  it('zooms with + - 0 and Z', async () => {
    renderLightbox();
    press('+');
    expect(isZoomed()).toBe(true);
    press('-');
    expect(isZoomed()).toBe(false);
    press('=');
    press('+');
    await waitFor(() => expect(screen.getByTestId('lb-zoom').style.transform).toContain('scale(2)'));
    press('0');
    expect(isZoomed()).toBe(false);
    press('z');
    expect(isZoomed()).toBe(true);
    press('Z');
    expect(isZoomed()).toBe(false);
  });

  it('zooms with ctrl + wheel and ignores a plain wheel', () => {
    renderLightbox();
    const stage = screen.getByTestId('lb-stage');
    fireEvent.wheel(stage, { deltaY: -40 });
    expect(isZoomed()).toBe(false);
    const event = new WheelEvent('wheel', { deltaY: -40, ctrlKey: true, bubbles: true, cancelable: true });
    act(() => {
      stage.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(isZoomed()).toBe(true);
  });

  it('resets zoom when the slide changes', () => {
    renderLightbox();
    press('z');
    expect(isZoomed()).toBe(true);
    press('ArrowRight');
    expect(screen.getAllByRole('img', { name: 'Forest' }).length).toBeGreaterThan(0);
    expect(isZoomed()).toBe(false);
  });

  it('toggles the thumbnails with T', () => {
    renderLightbox();
    expect(screen.getByRole('tablist', { name: 'Thumbnails' })).toBeTruthy();
    press('t');
    expect(screen.queryByRole('tablist', { name: 'Thumbnails' })).toBeNull();
    press('T');
    expect(screen.getByRole('tablist', { name: 'Thumbnails' })).toBeTruthy();
  });
});

describe('Lightbox video (react-native-web DOM)', () => {
  let play: jest.SpyInstance;
  let pause: jest.SpyInstance;
  beforeEach(() => {
    play = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pause = jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(() => {
    // Unmount (which pauses the video) while the media stubs are still installed.
    cleanup();
    play.mockRestore();
    pause.mockRestore();
  });

  it('renders a native <video> with src and poster, and pauses it when the slide is left', () => {
    const { baseElement } = renderLightbox({ images: MEDIA, initialIndex: 1 });
    const video = baseElement.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('src')).toBe('https://example.com/clip.mp4');
    expect(video?.getAttribute('poster')).toBe('https://example.com/poster.jpg');
    expect(video?.hasAttribute('controls')).toBe(true);
    expect(video?.getAttribute('aria-label')).toBe('Clip');
    expect(play).toHaveBeenCalled();
    // Video slides never zoom.
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Video 2 of 3: Clip' })).toBeTruthy();

    pause.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(pause).toHaveBeenCalled();
    expect(baseElement.querySelector('video')).toBeNull();
  });

  it('leaves the keys of a focused video to the video', () => {
    const onImageChange = jest.fn();
    const { baseElement } = renderLightbox({ images: MEDIA, initialIndex: 1, onImageChange });
    fireEvent.keyDown(baseElement.querySelector('video') as HTMLVideoElement, { key: 'ArrowRight' });
    expect(onImageChange).not.toHaveBeenCalled();
  });
});

describe('Lightbox custom slides (react-native-web DOM)', () => {
  it('renders renderSlide output and falls back on undefined', () => {
    renderLightbox({
      renderSlide: (item) => (item.id === 'b' ? <span>Custom slide</span> : undefined),
    });
    expect(screen.getAllByRole('img', { name: 'Lake' }).length).toBeGreaterThan(0);
    press('ArrowRight');
    expect(screen.getByText('Custom slide')).toBeTruthy();
  });

  it('sizes the thumbnails from thumbnailSize', () => {
    renderLightbox({ thumbnailSize: 72 });
    const tab = screen.getAllByRole('tab')[0];
    expect(getComputedStyle(tab).width).toBe('72px');
  });
});
