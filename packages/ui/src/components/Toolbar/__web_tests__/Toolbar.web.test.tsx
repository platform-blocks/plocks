import React from 'react';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';

import { PlocksProvider } from '../../../core/theme/PlocksProvider';
import { Toolbar } from '../Toolbar';

const render = (ui: React.ReactElement) => rtlRender(<PlocksProvider>{ui}</PlocksProvider>);

function Formatting() {
  return (
    <Toolbar accessibilityLabel="Formatting">
      <Toolbar.ToggleGroup type="multiple" defaultValue={['bold']} accessibilityLabel="Style">
        <Toolbar.ToggleItem value="bold" accessibilityLabel="Bold">B</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="italic" accessibilityLabel="Italic" disabled>I</Toolbar.ToggleItem>
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.ToggleGroup type="single" defaultValue="left" accessibilityLabel="Alignment">
        <Toolbar.ToggleItem value="left" accessibilityLabel="Left">L</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="right" accessibilityLabel="Right">R</Toolbar.ToggleItem>
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.Toggle accessibilityLabel="Link">🔗</Toolbar.Toggle>
    </Toolbar>
  );
}

describe('Toolbar (react-native-web DOM)', () => {
  it('exposes a toolbar, groups, separators and pressed buttons', () => {
    render(<Formatting />);
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
    expect(screen.getByRole('group', { name: 'Style' })).toBeTruthy();
    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Left' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Right' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'Link' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shares one tab stop across groups and skips disabled toggles with arrow keys', () => {
    render(<Formatting />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    const left = screen.getByRole('button', { name: 'Left' });
    const right = screen.getByRole('button', { name: 'Right' });
    const link = screen.getByRole('button', { name: 'Link' });

    expect(bold.getAttribute('tabindex')).toBe('0');
    expect(left.getAttribute('tabindex')).toBe('-1');
    expect(link.getAttribute('tabindex')).toBe('-1');

    bold.focus();
    fireEvent.keyDown(bold, { key: 'ArrowRight' });
    // Italic is disabled, so focus crosses the divider into the next group.
    expect(document.activeElement).toBe(left);
    expect(italic.getAttribute('tabindex')).toBe('-1');
    fireEvent.keyDown(left, { key: 'End' });
    expect(document.activeElement).toBe(link);
    fireEvent.keyDown(link, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(bold);
    fireEvent.keyDown(bold, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(link);
    expect(right.getAttribute('tabindex')).toBe('-1');
  });

  it('a vertical toolbar moves with up and down', () => {
    render(
      <Toolbar orientation="vertical" accessibilityLabel="Tools">
        <Toolbar.Toggle accessibilityLabel="One">1</Toolbar.Toggle>
        <Toolbar.Toggle accessibilityLabel="Two">2</Toolbar.Toggle>
      </Toolbar>
    );
    expect(screen.getByRole('toolbar').getAttribute('aria-orientation')).toBe('vertical');
    const one = screen.getByRole('button', { name: 'One' });
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Two' }));
  });

  it('clicking toggles pressed state in a single group', () => {
    render(<Formatting />);
    const right = screen.getByRole('button', { name: 'Right' });
    fireEvent.click(right);
    expect(right.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Left' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(right);
    expect(right.getAttribute('aria-pressed')).toBe('false');
  });
});
