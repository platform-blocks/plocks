import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react';

import { AppShell } from '../AppShell';
import { useAppShellResize } from '../hooks/useAppShellResize';
import type { UseAppShellResizeOptions } from '../types';
import { PlocksProvider } from '../../../core/theme/PlocksProvider';
import { resetViewportStore } from '../../../core/responsive/viewportStore';
import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

beforeEach(() => {
  resetViewportStore();
  __resetLayerStackForTests();
  setWidth(1024);
  window.localStorage.clear();
  // DirectionProvider mirrors the direction onto <html dir>, and reads it back.
  document.documentElement.removeAttribute('dir');
});

afterEach(() => resetViewportStore());

type ShellProps = Partial<React.ComponentProps<typeof AppShell>> & {
  options?: UseAppShellResizeOptions;
  direction?: 'ltr' | 'rtl';
  withResize?: boolean;
};

function Shell({ options = { navbar: { min: 200, max: 300 } }, direction, withResize = true, ...props }: ShellProps) {
  const resize = useAppShellResize(options);
  return (
    <PlocksProvider direction={direction ? { initialDirection: direction } : undefined}>
      <AppShell
        withSafeArea={false}
        header={{ height: 60 }}
        navbar={{ width: 240 }}
        aside={{ width: 200 }}
        footer={{ height: 40 }}
        transitionDuration={0}
        testID="shell"
        resize={withResize ? resize : undefined}
        {...props}
      >
        <AppShell.Header>
          <Text>Header</Text>
        </AppShell.Header>
        <AppShell.Navbar testID="navbar">
          <Text>Nav</Text>
        </AppShell.Navbar>
        <AppShell.Aside testID="aside" accessibilityLabel="Details">
          <Text>Aside</Text>
        </AppShell.Aside>
        <AppShell.Main testID="main">
          <Text>Content</Text>
        </AppShell.Main>
        <AppShell.Footer testID="footer">
          <Text>Footer</Text>
        </AppShell.Footer>
      </AppShell>
    </PlocksProvider>
  );
}

const handle = (name = 'Resize navigation') => screen.getByRole('separator', { name });
const valueOf = (name?: string) => Number(handle(name).getAttribute('aria-valuenow'));
const shellVar = (name: string) => screen.getByTestId('shell').style.getPropertyValue(name);

/** A drag through react-native-web's responder system (it listens for mouse events on the document). */
function drag(target: HTMLElement, from: { x: number; y: number }, ...to: { x: number; y: number }[]) {
  fireEvent.mouseDown(target, { clientX: from.x, clientY: from.y, pageX: from.x, pageY: from.y, buttons: 1 });
  for (const point of to) {
    fireEvent.mouseMove(target, { clientX: point.x, clientY: point.y, pageX: point.x, pageY: point.y, buttons: 1 });
  }
  const last = to[to.length - 1] ?? from;
  fireEvent.mouseUp(target, { clientX: last.x, clientY: last.y, pageX: last.x, pageY: last.y });
}

describe('AppShell resize (react-native-web DOM)', () => {
  it('renders no handles without `resize`', () => {
    render(<Shell withResize={false} />);
    expect(screen.queryByRole('separator')).toBeNull();
    // The geometry stays plain px.
    expect(screen.getByTestId('main').style.left).toBe('240px');
  });

  it('renders a labelled separator with its range and value on the navbar edge', () => {
    render(<Shell />);
    const separator = handle();
    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    expect(separator.getAttribute('aria-valuemin')).toBe('200');
    expect(separator.getAttribute('aria-valuemax')).toBe('300');
    expect(separator.getAttribute('aria-valuenow')).toBe('240');
    expect(separator.getAttribute('tabindex')).toBe('0');
    // Only the sections named in the options get a handle.
    expect(screen.getAllByRole('separator')).toHaveLength(1);
    // The geometry is a variable on the shell root, falling back to the px.
    expect(shellVar('--plocks-shell-navbar-w')).toBe('240px');
    expect(screen.getByTestId('main').style.left).toBe('var(--plocks-shell-navbar-w, 240px)');
    expect(screen.getByTestId('navbar').style.width).toBe('var(--plocks-shell-navbar-w, 240px)');
  });

  it('steps the navbar with the arrow keys (Shift: 50px), clamped to max', () => {
    const onSizeChange = jest.fn();
    const onResizeEnd = jest.fn();
    render(<Shell options={{ navbar: { min: 200, max: 300 }, onSizeChange, onResizeEnd }} />);

    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(valueOf()).toBe(250);
    expect(onSizeChange).toHaveBeenLastCalledWith('navbar', 250);
    expect(onResizeEnd).toHaveBeenLastCalledWith('navbar', 250);
    expect(screen.getByTestId('main').style.left).toBe('var(--plocks-shell-navbar-w, 250px)');
    expect(shellVar('--plocks-shell-navbar-w')).toBe('250px');

    fireEvent.keyDown(handle(), { key: 'ArrowRight', shiftKey: true });
    expect(valueOf()).toBe(300);
    fireEvent.keyDown(handle(), { key: 'ArrowRight', shiftKey: true });
    expect(valueOf()).toBe(300);

    fireEvent.keyDown(handle(), { key: 'ArrowLeft' });
    expect(valueOf()).toBe(290);
  });

  it('jumps to min and max with Home and End, and resets with Enter or a double-click', () => {
    render(<Shell />);
    fireEvent.keyDown(handle(), { key: 'Home' });
    expect(valueOf()).toBe(200);
    fireEvent.keyDown(handle(), { key: 'End' });
    expect(valueOf()).toBe(300);
    fireEvent.keyDown(handle(), { key: 'Enter' });
    expect(valueOf()).toBe(240);

    fireEvent.keyDown(handle(), { key: 'End' });
    fireEvent.click(handle(), { detail: 2 });
    expect(valueOf()).toBe(240);
  });

  it('flips the horizontal direction in RTL', () => {
    render(<Shell direction="rtl" />);
    // The navbar is on the right, so its inner edge grows toward the left.
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' });
    expect(valueOf()).toBe(250);
    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(valueOf()).toBe(240);
    // The handle sits on the navbar's start (right) side.
    expect(handle().style.right).toBe('calc(var(--plocks-shell-navbar-w, 240px) - 4px)');

    // Dragging left grows it.
    drag(handle(), { x: 800, y: 300 }, { x: 760, y: 300 });
    expect(valueOf()).toBe(280);
  });

  it('follows a pointer drag live through the shell-root variable, and commits on release', () => {
    const onSizeChange = jest.fn();
    const onResizeEnd = jest.fn();
    render(<Shell options={{ navbar: { min: 200, max: 300 }, onSizeChange, onResizeEnd }} />);
    const separator = handle();

    fireEvent.mouseDown(separator, { clientX: 240, clientY: 300, pageX: 240, pageY: 300, buttons: 1 });
    fireEvent.mouseMove(separator, { clientX: 270, clientY: 300, pageX: 270, pageY: 300, buttons: 1 });
    // Mid-drag: the variable moved, the committed fallback did not.
    expect(shellVar('--plocks-shell-navbar-w')).toBe('270px');
    expect(screen.getByTestId('main').style.left).toBe('var(--plocks-shell-navbar-w, 240px)');
    expect(valueOf()).toBe(270);
    expect(onSizeChange).toHaveBeenLastCalledWith('navbar', 270);
    expect(onResizeEnd).not.toHaveBeenCalled();

    // Past max: clamped.
    fireEvent.mouseMove(separator, { clientX: 400, clientY: 300, pageX: 400, pageY: 300, buttons: 1 });
    expect(shellVar('--plocks-shell-navbar-w')).toBe('300px');

    fireEvent.mouseUp(separator, { clientX: 400, clientY: 300, pageX: 400, pageY: 300 });
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
    expect(onResizeEnd).toHaveBeenLastCalledWith('navbar', 300);
    expect(screen.getByTestId('main').style.left).toBe('var(--plocks-shell-navbar-w, 300px)');
    expect(valueOf()).toBe(300);
  });

  it('follows a touch drag', () => {
    render(<Shell />);
    const separator = handle();
    const touch = (x: number) => [{ identifier: 1, target: separator, pageX: x, pageY: 300, clientX: x, clientY: 300 }];
    fireEvent.touchStart(separator, { touches: touch(240), changedTouches: touch(240) });
    fireEvent.touchMove(separator, { touches: touch(220), changedTouches: touch(220) });
    expect(shellVar('--plocks-shell-navbar-w')).toBe('220px');
    fireEvent.touchEnd(separator, { touches: [], changedTouches: touch(220) });
    expect(valueOf()).toBe(220);
    expect(screen.getByTestId('main').style.left).toBe('var(--plocks-shell-navbar-w, 220px)');
  });

  it('collapses the navbar to its rail below collapseThreshold, and expands when dragged back out', () => {
    const onCollapse = jest.fn();
    render(
      <Shell
        navbar={{ width: 240, collapsedWidth: 60, expandOnHover: false }}
        options={{ navbar: { min: 200, max: 300, collapseThreshold: 120, onCollapse } }}
      />
    );

    fireEvent.mouseDown(handle(), { clientX: 240, clientY: 300, pageX: 240, pageY: 300, buttons: 1 });
    fireEvent.mouseMove(handle(), { clientX: 100, clientY: 300, pageX: 100, pageY: 300, buttons: 1 });
    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(valueOf()).toBe(60);
    expect(shellVar('--plocks-shell-navbar-w')).toBe('60px');

    fireEvent.mouseMove(handle(), { clientX: 230, clientY: 300, pageX: 230, pageY: 300, buttons: 1 });
    expect(valueOf()).toBe(230);
    fireEvent.mouseMove(handle(), { clientX: 90, clientY: 300, pageX: 90, pageY: 300, buttons: 1 });
    fireEvent.mouseUp(handle(), { clientX: 90, clientY: 300, pageX: 90, pageY: 300 });
    expect(onCollapse).toHaveBeenCalledTimes(2);
    expect(valueOf()).toBe(60);
    expect(screen.getByTestId('main').style.left).toBe('var(--plocks-shell-navbar-w, 60px)');

    // The keyboard brings it back.
    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(valueOf()).toBe(240);
  });

  it('collapses the aside and keeps its handle on the edge to bring it back', () => {
    const onCollapse = jest.fn();
    render(<Shell options={{ aside: { label: 'Resize details', collapseThreshold: 100, onCollapse } }} />);
    const separator = handle('Resize details');
    // LTR: the aside's inner edge is its left side, so ArrowLeft grows it.
    fireEvent.keyDown(separator, { key: 'ArrowLeft' });
    expect(valueOf('Resize details')).toBe(210);

    drag(handle('Resize details'), { x: 800, y: 300 }, { x: 1000, y: 300 });
    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('aside')).toBeNull();
    expect(valueOf('Resize details')).toBe(0);
    // Kept on-screen at the shell's edge.
    expect(handle('Resize details').style.right).toBe('0px');

    drag(handle('Resize details'), { x: 1020, y: 300 }, { x: 800, y: 300 });
    expect(screen.getByTestId('aside')).toBeTruthy();
    expect(valueOf('Resize details')).toBe(220);
  });

  it('resizes the header and footer vertically', () => {
    render(<Shell options={{ header: true, footer: { max: 100 } }} />);
    const header = handle('Resize header');
    const footer = handle('Resize footer');
    expect(header.getAttribute('aria-orientation')).toBe('horizontal');
    expect(footer.getAttribute('aria-orientation')).toBe('horizontal');

    fireEvent.keyDown(header, { key: 'ArrowDown' });
    expect(valueOf('Resize header')).toBe(70);
    expect(screen.getByTestId('main').style.top).toBe('var(--plocks-shell-header-h, 70px)');

    fireEvent.keyDown(footer, { key: 'ArrowUp', shiftKey: true });
    expect(valueOf('Resize footer')).toBe(90);
    expect(screen.getByTestId('footer').style.height).toBe('var(--plocks-shell-footer-h, 90px)');

    // Dragging the footer's top edge up grows it; the content's bottom edge follows live.
    fireEvent.mouseDown(handle('Resize footer'), { clientX: 400, clientY: 700, pageX: 400, pageY: 700, buttons: 1 });
    fireEvent.mouseMove(handle('Resize footer'), { clientX: 400, clientY: 695, pageX: 400, pageY: 695, buttons: 1 });
    expect(shellVar('--plocks-shell-footer-h')).toBe('95px');
    expect(shellVar('--plocks-shell-content-bottom')).toBe('95px');
    fireEvent.mouseUp(handle('Resize footer'), { clientX: 400, clientY: 695, pageX: 400, pageY: 695 });
    expect(valueOf('Resize footer')).toBe(95);
  });

  it('disables navbar and aside resizing below their breakpoints (drawer / mobile)', () => {
    setWidth(600);
    render(<Shell options={{ navbar: true, aside: true, header: true }} aside={{ width: 200, collapsed: { mobile: false } }} />);
    expect(screen.queryByRole('separator', { name: 'Resize navigation' })).toBeNull();
    expect(screen.queryByRole('separator', { name: 'Resize aside' })).toBeNull();
    expect(handle('Resize header')).toBeTruthy();
  });

  it('persists sizes under storageKey', () => {
    const view = render(<Shell options={{ navbar: true, storageKey: 'shell-sizes' }} />);
    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(JSON.parse(window.localStorage.getItem('shell-sizes') ?? '{}')).toEqual({ navbar: 250 });
    view.unmount();

    render(<Shell options={{ navbar: true, storageKey: 'shell-sizes' }} />);
    expect(valueOf()).toBe(250);
  });
});
