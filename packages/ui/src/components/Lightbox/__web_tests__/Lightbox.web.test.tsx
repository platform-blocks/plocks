import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Lightbox } from '../Lightbox';
import { Popover } from '../../Popover';
import type { LightboxItem } from '../types';
import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';

const IMAGES: LightboxItem[] = [
  { id: 'a', uri: 'https://example.com/a.jpg', title: 'Lake' },
  { id: 'b', uri: 'https://example.com/b.jpg', title: 'Forest' },
  { id: 'c', uri: 'https://example.com/c.jpg', title: 'Dunes' },
];

const originalRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  // Popovers position from a measured anchor; jsdom measures everything as 0.
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { x: 20, y: 40, top: 40, left: 20, right: 180, bottom: 80, width: 160, height: 40, toJSON: () => ({}) } as DOMRect;
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = originalRect;
});

beforeEach(() => __resetLayerStackForTests());

describe('Lightbox (react-native-web DOM)', () => {
  it('is a modal dialog with labelled controls', () => {
    render(<Lightbox opened images={IMAGES} onDownload={jest.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Image gallery' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    for (const name of ['Close gallery', 'Download image', 'Previous image', 'Next image']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Previous image' }).getAttribute('aria-disabled')).toBe('true');
    // react-native-web's Image is a role=img box wrapping an <img alt> of the same name.
    expect(screen.getAllByRole('img', { name: 'Lake' }).length).toBeGreaterThan(0);
  });

  it('renders the thumbnails as a tab list with roving focus', () => {
    const onImageChange = jest.fn();
    render(<Lightbox opened images={IMAGES} onImageChange={onImageChange} />);
    expect(screen.getByRole('tablist', { name: 'Thumbnails' })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    act(() => tabs[0].focus());
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(onImageChange).toHaveBeenLastCalledWith(1, IMAGES[1]);
    const next = screen.getByRole('tab', { name: 'Image 2 of 3: Forest' });
    expect(next.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(next);
  });

  it('moves between images with the arrow keys', () => {
    const onImageChange = jest.fn();
    render(<Lightbox opened images={IMAGES} onImageChange={onImageChange} />);
    const close = screen.getByRole('button', { name: 'Close gallery' });
    fireEvent.keyDown(close, { key: 'ArrowRight' });
    expect(onImageChange).toHaveBeenLastCalledWith(1, IMAGES[1]);
    fireEvent.keyDown(close, { key: 'ArrowLeft' });
    expect(onImageChange).toHaveBeenLastCalledWith(0, IMAGES[0]);
  });

  it('closes on Escape through the layer stack', () => {
    const onClose = jest.fn();
    render(<Lightbox opened images={IMAGES} onClose={onClose} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps floating content opened from a slide inside the dialog element', async () => {
    render(
      <Lightbox
        opened
        images={IMAGES}
        renderSlide={() => (
          <Popover id="slide-help">
            <Popover.Target>
              <Pressable role="button" accessibilityLabel="Slide help"><Text>Help</Text></Pressable>
            </Popover.Target>
            <Popover.Dropdown>
              <Text>Slide notes</Text>
            </Popover.Dropdown>
          </Popover>
        )}
      />
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Slide help' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    const dropdown = document.getElementById('slide-help-dropdown');
    expect(dropdown).not.toBeNull();
    const dialog = screen.getByRole('dialog', { name: 'Image gallery' });
    expect(dialog.contains(dropdown)).toBe(true);
    // The modal window around it is a plain container: the only aria-modal
    // element is the dialog itself (the popover is its own non-modal dialog).
    expect(Array.from(document.querySelectorAll('[aria-modal]'))).toEqual([dialog]);
  });
});
