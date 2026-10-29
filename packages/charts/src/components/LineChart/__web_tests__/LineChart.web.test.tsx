import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LineChart } from '../LineChart';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo as ReferenceMarksDemo } from '../demos/referenceMarks';
import { Demo } from '../demos/basic';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Month');
});

test('renders reference areas, lines and dots as SVG marks', () => {
  const { container } = render(
    <PlocksProvider>
      <ChartThemeProvider>
        <ReferenceMarksDemo />
      </ChartThemeProvider>
    </PlocksProvider>
  );
  expect(container.querySelectorAll('svg rect[fill="#ef4444"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg line[stroke="#f59e0b"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg circle[r="6"]')).toHaveLength(1);
  expect(container.textContent).toContain('SLO 250 ms');
});

describe('withBrush', () => {
  const DATA = Array.from({ length: 21 }, (_, i) => ({ x: i, y: i === 20 ? 500 : 10 + (i % 5) }));
  const renderChart = (props: Partial<React.ComponentProps<typeof LineChart>> = {}) =>
    render(
      <PlocksProvider>
        <ChartThemeProvider>
          <LineChart w={480} h={320} data={DATA} disableAnimations showPoints {...props} />
        </ChartThemeProvider>
      </PlocksProvider>
    );
  const sliders = () => screen.queryAllByRole('slider');
  const shows = (label: string) => screen.queryAllByText(label).length > 0;
  const pointCount = (container: HTMLElement) =>
    container.querySelectorAll('[data-testid="line-gesture-surface"] svg circle').length;

  test('renders nothing extra without withBrush', () => {
    const { container } = renderChart();
    expect(sliders()).toHaveLength(0);
    expect(container.querySelector('[data-testid="line-chart-brush"]')).toBeNull();
  });

  test('reserves the brush band inside h', () => {
    const plain = renderChart();
    const plainHeight = Number(plain.container.querySelector('[data-testid="line-gesture-surface"] svg')?.getAttribute('height'));
    plain.unmount();
    const brushed = renderChart({ withBrush: true });
    const brushedHeight = Number(brushed.container.querySelector('[data-testid="line-gesture-surface"] svg')?.getAttribute('height'));
    expect(brushedHeight).toBe(plainHeight - 48);
  });

  test('handles are sliders carrying the range', () => {
    renderChart({ withBrush: true });
    const [start, end] = sliders();
    expect(start.getAttribute('aria-label')).toBe('Range start');
    expect(start.getAttribute('aria-valuemin')).toBe('0');
    expect(start.getAttribute('aria-valuenow')).toBe('0');
    expect(end.getAttribute('aria-valuenow')).toBe('20');
    expect(end.getAttribute('aria-valuemax')).toBe('20');
    expect(end.getAttribute('aria-valuetext')).toBe('20');
    expect(start.getAttribute('tabindex')).toBe('0');
  });

  test('a key step on the end handle shrinks the drawn domain and reports it', () => {
    const onChange = jest.fn();
    const onBrushChange = jest.fn();
    const { container } = renderChart({ withBrush: true, brushProps: { onChange }, onBrushChange });
    const before = pointCount(container);
    expect(shows('20')).toBe(true);
    const end = sliders()[1];
    fireEvent.keyDown(end, { key: 'ArrowLeft', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith([0, 10]);
    expect(onBrushChange).toHaveBeenLastCalledWith([0, 10]);
    expect(end.getAttribute('aria-valuenow')).toBe('10');
    // The x = 20 spike is out of the window: its point is gone and y refits.
    expect(pointCount(container)).toBeLessThan(before);
    expect(shows('20')).toBe(false);
    expect(shows('500')).toBe(false);
    fireEvent.keyDown(end, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith([0, 9]);
    fireEvent.keyDown(end, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith([0, 20]);
    fireEvent.keyDown(sliders()[0], { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith([19, 20]);
    fireEvent.keyDown(sliders()[0], { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith([0, 20]);
  });

  test('brushProps.start/end seed the window', () => {
    renderChart({ withBrush: true, brushProps: { start: 5, end: 12 } });
    const [start, end] = sliders();
    expect(start.getAttribute('aria-valuenow')).toBe('5');
    expect(end.getAttribute('aria-valuenow')).toBe('12');
  });

  test('a controlled brushRange is respected and changes are only reported', () => {
    const onBrushChange = jest.fn();
    const { container } = renderChart({ withBrush: true, brushRange: [4, 8], onBrushChange });
    const [start, end] = sliders();
    expect(start.getAttribute('aria-valuenow')).toBe('4');
    expect(end.getAttribute('aria-valuenow')).toBe('8');
    expect(shows('20')).toBe(false);
    fireEvent.keyDown(end, { key: 'ArrowRight' });
    expect(onBrushChange).toHaveBeenLastCalledWith([4, 9]);
    expect(sliders()[1].getAttribute('aria-valuenow')).toBe('8');
  });

  test('the tooltip resolves points in the brushed domain', () => {
    const { container } = renderChart({ withBrush: true, brushRange: [0, 10], liveTooltip: true });
    const plot = container.querySelector('[data-testid="line-gesture-surface"] svg')!;
    const plotWidth = Number(plot.getAttribute('width'));
    const plotHeight = Number(plot.getAttribute('height'));
    // The plot's right edge is x = 10 now (y refit to 10–14, so y = 10 is the bottom).
    fireEvent.mouseMove(screen.getByTestId('line-gesture-surface'), { clientX: plotWidth - 1, clientY: plotHeight - 1 });
    expect(screen.getByTestId('line-chart-tooltip').textContent).toBe('(10, 10)');
  });

  test('shift+drag box zoom moves the brush window (one x domain)', () => {
    const onBrushChange = jest.fn();
    const { container } = renderChart({ withBrush: true, enableBrushZoom: true, onBrushChange });
    const surface = screen.getByTestId('line-gesture-surface');
    const plotWidth = Number(container.querySelector('[data-testid="line-gesture-surface"] svg')?.getAttribute('width'));
    fireEvent.mouseDown(surface, { clientX: 0, clientY: 0, shiftKey: true });
    fireEvent.mouseMove(surface, { clientX: plotWidth / 2, clientY: 50 });
    fireEvent.mouseUp(surface, { clientX: plotWidth / 2, clientY: 50 });
    expect(onBrushChange).toHaveBeenLastCalledWith([0, 10]);
    const [start, end] = sliders();
    expect(start.getAttribute('aria-valuenow')).toBe('0');
    expect(end.getAttribute('aria-valuenow')).toBe('10');
  });

  test('reference marks follow the brushed domain', () => {
    const { container } = renderChart({
      withBrush: true,
      brushRange: [0, 10],
      referenceLines: [
        { x: 5, color: '#0ea5e9' },
        { x: 15, color: '#f43f5e' },
      ],
    });
    expect(container.querySelectorAll('line[stroke="#0ea5e9"]')).toHaveLength(1);
    expect(container.querySelectorAll('line[stroke="#f43f5e"]')).toHaveLength(0);
  });
});
