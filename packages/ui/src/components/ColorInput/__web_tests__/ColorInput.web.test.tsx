import React from 'react';
import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';

import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';
import { PlocksProvider } from '../../../core/theme/PlocksProvider';
import { ColorInput } from '../ColorInput';

// Desktop web (anchored dropdown) unless a test flips it to the sheet.
let mockUseSheet = false;
jest.mock('../../../hooks/useOverlayMode', () => ({
  ...jest.requireActual('../../../hooks/useOverlayMode'),
  useOverlayMode: () => ({
    deviceInfo: {},
    isWeb: true,
    isMobileExperience: mockUseSheet,
    isDesktopExperience: !mockUseSheet,
    shouldUseModal: mockUseSheet,
    shouldUseOverlay: !mockUseSheet,
  }),
}));

// react-native-web drives `onLayout` from a ResizeObserver. The jest setup's
// no-op stub never fires it; this one reports as soon as an element is observed
// (react-native-web then measures it from `offsetWidth` / `offsetHeight`).
class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}
const resizeObserverWindow = window as unknown as { ResizeObserver?: unknown };
const originalResizeObserver = resizeObserverWindow.ResizeObserver;

// jsdom has no layout: give every element a box so the dropdown can be placed.
let rectWidth = 320;
const originalRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  resizeObserverWindow.ResizeObserver = ResizeObserverStub;
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 20,
      y: 40,
      top: 40,
      left: 20,
      right: 20 + rectWidth,
      bottom: 80,
      width: rectWidth,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect;
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = originalRect;
  resizeObserverWindow.ResizeObserver = originalResizeObserver;
});
beforeEach(() => {
  mockUseSheet = false;
  rectWidth = 320;
  __resetLayerStackForTests();
});

const render = (ui: React.ReactElement) => rtlRender(<PlocksProvider>{ui}</PlocksProvider>);

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
}

const SWATCHES = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

describe('ColorInput (react-native-web DOM)', () => {
  it('labels, describes and flags the hex input through the field frame', () => {
    render(
      <ColorInput
        label="Brand color"
        description="Used for buttons"
        error="Pick a brand color"
        required
        swatches={SWATCHES}
      />
    );
    const input = screen.getByRole('textbox', { name: 'Brand color' });
    expect(input.getAttribute('aria-labelledby')).toBe(`${input.id}-label`);
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description ${input.id}-error`);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    // The frame draws the focus ring, so the raw outline is opted out.
    expect(input.getAttribute('data-plocks-input')).toBe('true');

    const alert = screen.getByRole('alert');
    expect(alert.id).toBe(`${input.id}-error`);
    expect(alert.textContent).toBe('Pick a brand color');
  });

  it('has a labelled swatch toggle wired to the dropdown dialog', async () => {
    render(<ColorInput label="Brand color" swatches={SWATCHES} defaultValue="#45B7D1" />);
    const toggle = screen.getByRole('button', { name: 'Show color swatches' });
    expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    await settle();

    const openToggle = screen.getByRole('button', { name: 'Hide color swatches' });
    expect(openToggle).toBe(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const dialog = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-label')).toBe('Brand color');

    expect(screen.getByRole('radiogroup', { name: 'Color swatches' })).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual(SWATCHES);
    expect(screen.getByRole('radio', { name: '#45B7D1' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '#FF6B6B' }).getAttribute('aria-checked')).toBe('false');
    // Focus moves to the selected swatch, the palette's only tab stop.
    expect(document.activeElement).toBe(radios[2]);
  });

  it('moves between swatches with the arrow keys and picks with Enter', async () => {
    const onChange = jest.fn();
    render(<ColorInput label="Brand color" swatches={SWATCHES} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show color swatches' }));
    await settle();

    const radios = screen.getAllByRole('radio');
    expect(document.activeElement).toBe(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[1]);
    fireEvent.keyDown(radios[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(document.activeElement).toBe(radios[3]);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(radios[3], { key: 'Enter' });
    fireEvent.keyUp(radios[3], { key: 'Enter' });
    await settle();
    expect(onChange).toHaveBeenCalledWith('#96CEB4');
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect((screen.getByRole('textbox', { name: 'Brand color' }) as HTMLInputElement).value).toBe('#96CEB4');
  });

  it('closes on Escape', async () => {
    render(<ColorInput label="Brand color" swatches={SWATCHES} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show color swatches' }));
    await settle();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await settle();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show color swatches' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('normalizes typed hex on blur and clears with a labelled button', () => {
    const onChange = jest.fn();
    render(<ColorInput label="Brand color" swatches={SWATCHES} onChange={onChange} clearable />);
    const input = screen.getByRole('textbox', { name: 'Brand color' }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '#0af' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('#00AAFF');
    expect(input.value).toBe('#00AAFF');

    fireEvent.click(screen.getByRole('button', { name: 'Clear color' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(input.value).toBe('');
  });

  it('opens the palette in a modal sheet on small screens', async () => {
    mockUseSheet = true;
    render(<ColorInput label="Brand color" swatches={SWATCHES} />);
    const toggle = screen.getByRole('button', { name: 'Show color swatches' });
    fireEvent.click(toggle);
    await settle();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const sheet = screen.getByRole('dialog', { name: 'Brand color' });
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('radiogroup', { name: 'Color swatches' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(SWATCHES.length);
  });

  it('sizes the dropdown to the field with dropdownFullWidth, else at least 320px', async () => {
    rectWidth = 200;
    // onLayout measures with offsetWidth, which jsdom always reports as 0.
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => rectWidth });
    try {
      const openDropdown = async () => {
        const toggle = screen.getByRole('button', { name: 'Show color swatches' });
        fireEvent.click(toggle);
        await settle();
        return document.getElementById(toggle.getAttribute('aria-controls') ?? '') as HTMLElement;
      };

      const { unmount } = render(<ColorInput label="Brand color" swatches={SWATCHES} dropdownFullWidth />);
      expect((await openDropdown()).style.width).toBe('200px');
      unmount();

      render(<ColorInput label="Brand color" swatches={SWATCHES} />);
      expect((await openDropdown()).style.width).toBe('320px');
    } finally {
      if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
    }
  });
});
