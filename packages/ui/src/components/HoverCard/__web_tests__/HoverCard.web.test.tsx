import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { HoverCard } from '../HoverCard';
import { OverlayProvider } from '../../../core/providers/OverlayProvider';
import { OverlayRenderer } from '../../../core/providers/OverlayRenderer';
import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';
import { getTabbableElements } from '../../../core/overlay/focus';

const originalRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { x: 20, y: 40, top: 40, left: 20, right: 140, bottom: 72, width: 120, height: 32, toJSON: () => ({}) } as DOMRect;
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = originalRect;
});

beforeEach(() => __resetLayerStackForTests());

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
}

function Profile(props: Partial<React.ComponentProps<typeof HoverCard>>) {
  return (
    <OverlayProvider>
      <HoverCard
        openDelay={0}
        closeDelay={0}
        target={<Pressable role="link" accessibilityLabel="@plocks"><Text>@plocks</Text></Pressable>}
        {...props}
      >
        <Text>Cross-platform UI blocks</Text>
      </HoverCard>
      <OverlayRenderer />
    </OverlayProvider>
  );
}

/** A hover card with a button inside, plus a control after it to tab out to. */
function Actions(props: Partial<React.ComponentProps<typeof HoverCard>>) {
  return (
    <OverlayProvider>
      <HoverCard
        openDelay={0}
        closeDelay={0}
        target={<Pressable role="link" accessibilityLabel="@plocks"><Text>@plocks</Text></Pressable>}
        {...props}
      >
        <Text>Cross-platform UI blocks</Text>
        <Pressable role="button" accessibilityLabel="Follow"><Text>Follow</Text></Pressable>
      </HoverCard>
      <Pressable role="button" accessibilityLabel="Elsewhere"><Text>Elsewhere</Text></Pressable>
      <OverlayRenderer />
    </OverlayProvider>
  );
}

async function openWithKeyboard() {
  const target = screen.getByRole('link', { name: '@plocks' });
  act(() => target.focus());
  await settle();
  expect(screen.getByRole('dialog')).toBeTruthy();
  return target;
}

describe('HoverCard (react-native-web DOM)', () => {
  it('stays open when focus moves from the target onto a button inside the card', async () => {
    render(<Actions />);
    const target = await openWithKeyboard();
    const follow = screen.getByRole('button', { name: 'Follow' });

    act(() => follow.focus());
    await settle();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.activeElement).toBe(follow);

    // Back to the target keeps it open too; leaving both closes it.
    act(() => target.focus());
    await settle();
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() => follow.focus());
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('returns focus to the target when closed from inside; not with returnFocus={false}', async () => {
    const { unmount } = render(<Actions />);
    const target = await openWithKeyboard();
    const follow = screen.getByRole('button', { name: 'Follow' });
    act(() => follow.focus());
    fireEvent.keyDown(follow, { key: 'Escape' });
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(target);
    unmount();

    render(<Actions returnFocus={false} />);
    const target2 = await openWithKeyboard();
    const follow2 = screen.getByRole('button', { name: 'Follow' });
    act(() => follow2.focus());
    fireEvent.keyDown(follow2, { key: 'Escape' });
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).not.toBe(target2);
  });


  it('adds no extra tab stop around the target', () => {
    const { container } = render(<Profile />);
    expect(getTabbableElements(container)).toHaveLength(1);
  });

  it('opens on keyboard focus, wires aria-expanded / aria-controls, and closes on Escape', async () => {
    render(<Profile />);
    const target = screen.getByRole('link', { name: '@plocks' });
    expect(target.getAttribute('aria-expanded')).toBe('false');

    act(() => target.focus());
    await settle();
    const card = screen.getByRole('dialog');
    expect(card.textContent).toBe('Cross-platform UI blocks');
    expect(target.getAttribute('aria-expanded')).toBe('true');
    expect(target.getAttribute('aria-controls')).toBe(card.id);
    // Hover/focus cards never steal focus.
    expect(document.activeElement).toBe(target);

    fireEvent.keyDown(target, { key: 'Escape' });
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on pointer hover and stays open while the pointer is on the card', async () => {
    render(<Profile closeDelay={50} />);
    const target = screen.getByRole('link', { name: '@plocks' });
    fireEvent.mouseEnter(target);
    await settle();
    const card = screen.getByRole('dialog');
    fireEvent.mouseLeave(target);
    fireEvent.mouseEnter(card);
    await settle();
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.mouseLeave(card);
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
