import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { makeMutable } from 'react-native-reanimated';

import { Waveform } from '../Waveform';

const PEAKS = [0.1, 0.6, 0.3, 0.9, 0.4, 0.2, 0.75, 0.5, 0.35, 0.65];

describe('Waveform (react-native-web DOM)', () => {
  it('is a named image when not interactive', () => {
    render(<Waveform peaks={PEAKS} accessibilityLabel="Track preview" />);
    const img = screen.getByRole('img', { name: 'Track preview' });
    expect(img.getAttribute('aria-valuenow')).toBeNull();
    expect(img.getAttribute('tabindex')).not.toBe('0');
  });

  it('is a focusable seek slider with aria-valuenow when interactive', () => {
    const onSeek = jest.fn();
    render(<Waveform peaks={PEAKS} interactive onSeek={onSeek} progress={0.5} duration={100} />);
    const slider = screen.getByRole('slider', { name: 'Audio waveform' });
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
    expect(slider.getAttribute('aria-valuetext')).toBe('0:50 of 1:40');
    expect(slider.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenLastCalledWith(0.55);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onSeek).toHaveBeenLastCalledWith(1);
  });

  it('dispatches the documented waveformSpacePress event on Space', () => {
    const listener = jest.fn();
    document.addEventListener('waveformSpacePress', listener);
    render(<Waveform peaks={PEAKS} interactive onSeek={jest.fn()} />);
    fireEvent.keyDown(screen.getByRole('slider'), { key: ' ' });
    expect(listener).toHaveBeenCalledTimes(1);
    document.removeEventListener('waveformSpacePress', listener);
  });

  it('lets a consumer onKeyDown handle keys first', () => {
    const onSeek = jest.fn();
    const onKeyDown = jest.fn((event: { key: string; preventDefault: () => void }) => {
      if (event.key === 'ArrowRight') event.preventDefault();
    });
    render(<Waveform peaks={PEAKS} interactive onSeek={onSeek} onKeyDown={onKeyDown} />);
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(onSeek).not.toHaveBeenCalled();
  });

  describe('regions', () => {
    const REGIONS = [
      { start: 0, end: 0.25 },
      { start: 0.25, end: 0.5, label: 'Kick slice' },
      { start: 0.5, end: 1, active: true },
    ];

    it('makes each region a named button inside a group, and reports presses by index', () => {
      const onRegionPress = jest.fn();
      render(
        <Waveform peaks={PEAKS} fullWidth regions={REGIONS} onRegionPress={onRegionPress} accessibilityLabel="Chop" />
      );
      const group = screen.getByRole('group', { name: 'Chop' });
      expect(screen.queryByRole('img')).toBeNull();
      const buttons = screen.getAllByRole('button');
      expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
        'Region 1 of 3',
        'Kick slice',
        'Region 3 of 3',
      ]);
      expect(group.contains(buttons[0])).toBe(true);
      expect(buttons[2].getAttribute('aria-current')).toBe('true');
      expect(buttons[0].getAttribute('aria-current')).toBeNull();
      expect(buttons[2].getAttribute('aria-selected')).toBeNull();
      // positioned as a share of the drawing
      expect(buttons[1].style.left).toBe('25%');
      expect(buttons[1].style.width).toBe('25%');

      fireEvent.click(screen.getByRole('button', { name: 'Kick slice' }));
      expect(onRegionPress).toHaveBeenCalledWith(1, REGIONS[1]);
    });

    it('activates a region from the keyboard and leaves Space to it', () => {
      const listener = jest.fn();
      document.addEventListener('waveformSpacePress', listener);
      const onRegionPress = jest.fn();
      render(<Waveform peaks={PEAKS} interactive onSeek={jest.fn()} regions={REGIONS} onRegionPress={onRegionPress} />);
      // pressable regions take over from the seek slider
      expect(screen.queryByRole('slider')).toBeNull();
      const first = screen.getByRole('button', { name: 'Region 1 of 3' });
      expect(first.getAttribute('tabindex')).toBe('0');
      fireEvent.keyDown(first, { key: ' ' });
      expect(listener).not.toHaveBeenCalled();
      document.removeEventListener('waveformSpacePress', listener);
    });

    it('draws regions without buttons when nothing handles presses', () => {
      render(<Waveform peaks={PEAKS} regions={REGIONS} accessibilityLabel="Preview" />);
      expect(screen.getByRole('img', { name: 'Preview' })).toBeTruthy();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('keeps region buttons on an empty waveform', () => {
      const onRegionPress = jest.fn();
      render(<Waveform peaks={[]} fullWidth regions={REGIONS} onRegionPress={onRegionPress} />);
      fireEvent.click(screen.getByRole('button', { name: 'Region 3 of 3' }));
      expect(onRegionPress).toHaveBeenCalledWith(2, REGIONS[2]);
    });

    it('marks a disabled region and ignores its presses', () => {
      const onRegionPress = jest.fn();
      render(<Waveform peaks={PEAKS} regions={[{ start: 0, end: 1, disabled: true }]} onRegionPress={onRegionPress} />);
      const button = screen.getByRole('button', { name: 'Region 1 of 1' });
      expect(button.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(button);
      expect(onRegionPress).not.toHaveBeenCalled();
    });
  });

  describe('playhead', () => {
    it('moves with a shared value without re-rendering the waveform', async () => {
      const playhead = makeMutable(-1);
      let renders = 0;
      function Probe() {
        renders += 1;
        return <Waveform peaks={PEAKS} w={290} barWidth={2} barGap={1} playhead={playhead} testID="wave" />;
      }
      const view = render(<Probe />);
      const line = () =>
        Array.from(view.getByTestId('wave').children).find(
          (child) => (child as HTMLElement).style.width === '2px'
        ) as HTMLElement;
      expect(line()).toBeTruthy();
      expect(line().style.opacity).toBe('0');

      const before = renders;
      await act(async () => {
        playhead.value = 0.5;
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(renders).toBe(before);
      expect(line().style.opacity).toBe('1');
      // 10 bars of 2px + 1px gap span 29px; centred on 14.5px
      expect(line().style.transform).toContain('translateX(13.5px)');
    });

    it('accepts a plain number', () => {
      const view = render(
        <Waveform peaks={PEAKS} w={290} barWidth={2} barGap={1} playhead={0} playheadStyle={{ width: 3 }} testID="wave" />
      );
      const line = Array.from(view.getByTestId('wave').children).find(
        (child) => (child as HTMLElement).style.width === '3px'
      ) as HTMLElement;
      expect(line.style.opacity).toBe('1');
      expect(line.style.transform).toContain('translateX(0px)');
    });
  });
});
