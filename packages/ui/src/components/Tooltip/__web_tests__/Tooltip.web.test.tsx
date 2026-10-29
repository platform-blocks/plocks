import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Tooltip } from '../Tooltip';
import { PlocksProvider } from '../../../core/theme/PlocksProvider';
import { OverlayProvider } from '../../../core/providers/OverlayProvider';
import { OverlayRenderer } from '../../../core/providers/OverlayRenderer';
import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';

const originalRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { x: 20, y: 140, top: 140, left: 20, right: 140, bottom: 172, width: 120, height: 32, toJSON: () => ({}) } as DOMRect;
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = originalRect;
});

beforeEach(() => __resetLayerStackForTests());

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
}

function Copy(props: Partial<React.ComponentProps<typeof Tooltip>>) {
  return (
    <OverlayProvider>
      <Tooltip label="Copy link to clipboard" {...props}>
        <Pressable role="button" accessibilityLabel="Copy">
          <Text>Copy</Text>
        </Pressable>
      </Tooltip>
      <OverlayRenderer />
    </OverlayProvider>
  );
}

describe('Tooltip (react-native-web DOM)', () => {
  it('shows on keyboard focus and describes the trigger (role="tooltip" + aria-describedby)', async () => {
    render(<Copy />);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    expect(screen.queryByRole('tooltip')).toBeNull();

    act(() => trigger.focus());
    await settle();
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toBe('Copy link to clipboard');
    expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
    // Showing a tooltip never moves focus.
    expect(document.activeElement).toBe(trigger);
  });

  it('does not describe a trigger whose accessible name already is the tooltip text', async () => {
    render(
      <OverlayProvider>
        <Tooltip label="Copy">
          <Pressable role="button" accessibilityLabel="Copy">
            <Text>⧉</Text>
          </Pressable>
        </Tooltip>
        <OverlayRenderer />
      </OverlayProvider>
    );
    const trigger = screen.getByRole('button', { name: 'Copy' });
    act(() => trigger.focus());
    await settle();
    expect(screen.getByRole('tooltip').textContent).toBe('Copy');
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  it('Escape dismisses it without moving focus (WCAG 1.4.13)', async () => {
    render(<Copy />);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    act(() => trigger.focus());
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('hides when focus leaves', async () => {
    render(<Copy />);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    act(() => trigger.focus());
    await settle();
    act(() => trigger.blur());
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('by default ignores the pointer and closes as soon as it leaves the trigger', async () => {
    render(<Copy />);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    fireEvent.mouseEnter(trigger);
    await settle();
    const tooltip = screen.getByRole('tooltip');
    expect(getComputedStyle(tooltip).pointerEvents).toBe('none');

    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('interactive: stays open while the pointer moves onto the bubble (WCAG 1.4.13 hoverable)', async () => {
    render(<Copy interactive />);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    fireEvent.mouseEnter(trigger);
    await settle();
    const tooltip = screen.getByRole('tooltip');
    expect(getComputedStyle(tooltip).pointerEvents).not.toBe('none');

    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.mouseLeave(tooltip);
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  // Regression: the renderer's full-screen container must let the pointer
  // through. An inline `pointerEvents: 'box-none'` is ignored by
  // react-native-web, so the container covered the trigger, fired mouseleave,
  // closed the tooltip, uncovered the trigger, reopened it — a flicker loop.
  it('opens on hover without the overlay layer capturing the pointer', async () => {
    render(<Copy />);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    fireEvent.mouseEnter(trigger);
    await settle();
    const tooltip = screen.getByRole('tooltip');

    const fullScreenLayers: HTMLElement[] = [];
    for (let el = tooltip.parentElement; el && el !== document.body; el = el.parentElement) {
      if (el.style.width === '100%' && el.style.height === '100%') fullScreenLayers.push(el);
    }
    expect(fullScreenLayers.length).toBeGreaterThan(0);
    for (const layer of fullScreenLayers) {
      expect(layer.style.pointerEvents).not.toBe('box-none');
      expect(getComputedStyle(layer).pointerEvents).toBe('none');
    }
  });
});

describe('Tooltip hideDetached (web)', () => {
  type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
  type ROCallback = (entries: Partial<ResizeObserverEntry>[]) => void;
  let intersection: { callback: IOCallback; targets: Element[] }[] = [];
  let resize: { callback: ROCallback; targets: Element[] }[] = [];
  const win = window as unknown as { IntersectionObserver?: unknown; ResizeObserver?: unknown };
  const originalIO = win.IntersectionObserver;
  const originalRO = win.ResizeObserver;

  beforeEach(() => {
    intersection = [];
    resize = [];
    win.IntersectionObserver = class {
      private entry: { callback: IOCallback; targets: Element[] };
      constructor(callback: IOCallback) {
        this.entry = { callback, targets: [] };
        intersection.push(this.entry);
      }
      observe(target: Element) { this.entry.targets.push(target); }
      unobserve() {}
      disconnect() { this.entry.targets = []; }
      takeRecords() { return []; }
    };
    win.ResizeObserver = class {
      private entry: { callback: ROCallback; targets: Element[] };
      constructor(callback: ROCallback) {
        this.entry = { callback, targets: [] };
        resize.push(this.entry);
      }
      observe(target: Element) { this.entry.targets.push(target); }
      unobserve() {}
      disconnect() { this.entry.targets = []; }
    };
  });
  afterEach(() => {
    win.IntersectionObserver = originalIO;
    win.ResizeObserver = originalRO;
  });

  /** Report the anchor (in)visible the way a browser's IntersectionObserver would. */
  function reportIntersecting(isIntersecting: boolean) {
    const observer = intersection.find((o) => o.targets.length > 0);
    if (!observer) throw new Error('anchor is not observed');
    act(() => observer.callback([{ isIntersecting, target: observer.targets[0] }]));
  }
  function reportResize() {
    const observer = resize.find((o) => o.targets.length > 0 && o.targets[0].getAttribute('role') === 'button');
    if (!observer) throw new Error('anchor is not resize-observed');
    act(() => observer.callback([{ target: observer.targets[0] }]));
  }

  function Item(props: Partial<React.ComponentProps<typeof Tooltip>>) {
    return (
      <PlocksProvider>
        <Tooltip label="Item details" opened {...props}>
          <Pressable role="button" accessibilityLabel="Item">
            <Text>Item</Text>
          </Pressable>
        </Tooltip>
      </PlocksProvider>
    );
  }

  it('hides while the anchor is scrolled / clipped out of view and returns when it is back', async () => {
    const onClose = jest.fn();
    render(<Item onClose={onClose} />);
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();

    reportIntersecting(false);
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
    // Detaching is not a close: a controlled `opened` is left alone.
    expect(onClose).not.toHaveBeenCalled();

    reportIntersecting(true);
    await settle();
    expect(screen.getByRole('tooltip').textContent).toBe('Item details');
  });

  it('hides while the anchor is removed from the document and returns when re-inserted', async () => {
    render(<Item />);
    await settle();
    const trigger = screen.getByRole('button', { name: 'Item' });
    const parent = trigger.parentElement!;
    const next = trigger.nextSibling;

    trigger.remove();
    reportResize();
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();

    parent.insertBefore(trigger, next);
    reportResize();
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides while the anchor measures 0x0', async () => {
    render(<Item />);
    await settle();
    const trigger = screen.getByRole('button', { name: 'Item' });

    trigger.getBoundingClientRect = () =>
      ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect;
    reportResize();
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();

    delete (trigger as Partial<HTMLElement>).getBoundingClientRect;
    reportResize();
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides while the anchor is display: none', async () => {
    render(<Item />);
    await settle();
    const trigger = screen.getByRole('button', { name: 'Item' });
    trigger.style.display = 'none';
    reportResize();
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('hideDetached={false} keeps the bubble while the anchor is out of view', async () => {
    render(<Item hideDetached={false} />);
    await settle();
    expect(intersection.some((o) => o.targets.length > 0)).toBe(false);

    const trigger = screen.getByRole('button', { name: 'Item' });
    trigger.style.display = 'none';
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('treats an anchor it cannot measure (no IntersectionObserver) as attached', async () => {
    win.IntersectionObserver = undefined;
    render(<Item />);
    await settle();
    const trigger = screen.getByRole('button', { name: 'Item' });
    trigger.getBoundingClientRect = () =>
      ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect;
    reportResize();
    await settle();
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });
});
