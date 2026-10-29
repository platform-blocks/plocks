import React, { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Dialog } from '../Dialog';
import { Popover } from '../../Popover';
import { OverlayProvider } from '../../../core/providers/OverlayProvider';
import { OverlayRenderer } from '../../../core/providers/OverlayRenderer';
import { __resetLayerStackForTests } from '../../../core/overlay/layerStack';

const originalRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { x: 20, y: 40, top: 40, left: 20, right: 180, bottom: 80, width: 160, height: 40, toJSON: () => ({}) } as DOMRect;
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

function Harness({ nested = false, onClose }: { nested?: boolean; onClose?: () => void }) {
  const [opened, setOpened] = useState(false);
  return (
    <OverlayProvider>
      <Pressable role="button" accessibilityLabel="Open settings" onPress={() => setOpened(true)}>
        <Text>Open settings</Text>
      </Pressable>
      <Dialog
        opened={opened}
        title="Settings"
        transitionDuration={0}
        onClose={() => {
          onClose?.();
          setOpened(false);
        }}
      >
        <TextInput accessibilityLabel="Name" />
        {nested ? (
          <Popover id="help">
            <Popover.Target>
              <Pressable role="button" accessibilityLabel="Help"><Text>Help</Text></Pressable>
            </Popover.Target>
            <Popover.Dropdown>
              <Text>Help content</Text>
            </Popover.Dropdown>
          </Popover>
        ) : (
          <Pressable role="button" accessibilityLabel="Save"><Text>Save</Text></Pressable>
        )}
      </Dialog>
      <OverlayRenderer />
    </OverlayProvider>
  );
}

async function openDialog() {
  const trigger = screen.getByRole('button', { name: 'Open settings' });
  act(() => trigger.focus());
  fireEvent.click(trigger);
  await settle();
  return trigger;
}

describe('Dialog (react-native-web DOM)', () => {
  it('is a modal dialog named by its title, with a labelled close button', async () => {
    render(<Harness />);
    await openDialog();
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeTruthy();
  });

  it('moves focus into the dialog, traps Tab, and restores focus on Escape', async () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);
    const trigger = await openDialog();
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Tab from the last tabbable wraps to the first; Shift+Tab from the first to the last.
    const save = screen.getByRole('button', { name: 'Save' });
    const close = screen.getByRole('button', { name: 'Close dialog' });
    act(() => save.focus());
    fireEvent.keyDown(save, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(save);

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await settle();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Escape closes only the innermost layer (a popover inside the dialog), then the dialog', async () => {
    const onClose = jest.fn();
    render(<Harness nested onClose={onClose} />);
    await openDialog();
    const help = screen.getByRole('button', { name: 'Help' });
    act(() => help.focus());
    fireEvent.click(help);
    await settle();
    const dropdown = document.getElementById('help-dropdown');
    expect(dropdown).not.toBeNull();
    // Hosted inside the dialog's modal (its OverlayHost), not the app-root renderer.
    const dialogEl = screen.getByRole('dialog', { name: 'Settings' });
    let common: HTMLElement | null = dropdown;
    while (common && !common.contains(dialogEl)) common = common.parentElement;
    expect(common).not.toBe(document.body);
    // ...and inside the dialog element itself, so its aria-modal boundary
    // doesn't hide the popover from assistive technology.
    expect(dialogEl.contains(dropdown)).toBe(true);

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await settle();
    expect(document.getElementById('help-dropdown')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(help);

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await settle();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is the only dialog: the modal window around it carries no role or aria-modal', async () => {
    render(<Harness />);
    await openDialog();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    const modalLayers = Array.from(document.querySelectorAll('[aria-modal]'));
    expect(modalLayers).toEqual([screen.getByRole('dialog', { name: 'Settings' })]);
  });

  it('keeps the window plain while a second dialog is stacked on top', async () => {
    render(
      <OverlayProvider>
        <Dialog opened title="Pad" transitionDuration={0} onClose={() => {}}>
          <Text>Pad settings</Text>
        </Dialog>
        <Dialog opened title="Sounds" transitionDuration={0} onClose={() => {}}>
          <Text>Sound list</Text>
        </Dialog>
        <OverlayRenderer />
      </OverlayProvider>
    );
    await settle();
    expect(screen.getAllByRole('dialog').map((el) => el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby') as string)?.textContent)).toEqual(['Pad', 'Sounds']);
    // react-native-web drops the role of the covered modal's window but keeps
    // aria-modal; neither may surface.
    for (const el of Array.from(document.querySelectorAll('[aria-modal]'))) {
      expect(el.getAttribute('role')).toBe('dialog');
    }
  });
});
