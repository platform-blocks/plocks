import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo as ReferenceMarksDemo } from '../demos/referenceMarks';
import { Demo } from '../demos/basic';
import { BarChart } from '../BarChart';
import { Demo as BrushDemo } from '../demos/brush';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Quarterly revenue');
});

test('renders reference areas, lines and dots as SVG marks', () => {
  const { container } = render(
    <PlocksProvider>
      <ChartThemeProvider>
        <ReferenceMarksDemo />
      </ChartThemeProvider>
    </PlocksProvider>
  );
  expect(container.querySelectorAll('svg rect[fill="#8b5cf6"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg line[stroke="#f59e0b"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg circle[r="6"]')).toHaveLength(1);
  expect(container.textContent).toContain('Target 1,200');
});

describe('withBrush', () => {
  const DATA = Array.from({ length: 12 }, (_, i) => ({ category: `C${i}`, value: 10 + i }));
  const renderChart = (props: Partial<React.ComponentProps<typeof BarChart>> = {}) =>
    render(
      <PlocksProvider>
        <ChartThemeProvider>
          <BarChart w={480} h={320} data={DATA} legend={{ show: false }} {...props} />
        </ChartThemeProvider>
      </PlocksProvider>
    );
  const shows = (label: string) => screen.queryAllByText(label).length > 0;
  // The plot is the first Svg outside the brush strip; each bar is one path.
  const barCount = (container: HTMLElement) => {
    const plot = Array.from(container.querySelectorAll('svg')).find((svg) => !svg.closest('[data-testid="bar-chart-brush"]'));
    return plot?.querySelectorAll('path').length ?? 0;
  };

  test('renders its brush demo', () => {
    expectChartDemo(BrushDemo);
  });

  test('renders nothing extra without withBrush', () => {
    renderChart();
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(screen.queryByTestId('bar-chart-brush')).toBeNull();
  });

  test('handles are sliders over category indices named by their category', () => {
    renderChart({ withBrush: true });
    const [start, end] = screen.getAllByRole('slider');
    expect(start.getAttribute('aria-valuenow')).toBe('0');
    expect(start.getAttribute('aria-valuetext')).toBe('C0');
    expect(end.getAttribute('aria-valuenow')).toBe('11');
    expect(end.getAttribute('aria-valuemax')).toBe('11');
    expect(end.getAttribute('aria-valuetext')).toBe('C11');
  });

  test('a key step on the end handle drops categories from the plot', () => {
    const onChange = jest.fn();
    const { container } = renderChart({ withBrush: true, brushProps: { onChange } });
    expect(barCount(container)).toBe(12);
    const end = screen.getAllByRole('slider')[1];
    fireEvent.keyDown(end, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith([0, 10]);
    expect(barCount(container)).toBe(11);
    expect(shows('C11')).toBe(false);
    fireEvent.keyDown(end, { key: 'ArrowLeft', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith([0, 0]);
    expect(barCount(container)).toBe(1);
    expect(shows('C0')).toBe(true);
    expect(shows('C1')).toBe(false);
  });

  test('brushProps.start/end and a controlled brushRange select by index', () => {
    const first = renderChart({ withBrush: true, brushProps: { start: 3, end: 5 } });
    expect(barCount(first.container)).toBe(3);
    expect(shows('C3')).toBe(true);
    expect(shows('C2')).toBe(false);
    first.unmount();

    const onBrushChange = jest.fn();
    const { container } = renderChart({ withBrush: true, brushRange: [6, 9], onBrushChange });
    expect(barCount(container)).toBe(4);
    fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'Home' });
    expect(onBrushChange).toHaveBeenLastCalledWith([0, 9]);
    expect(barCount(container)).toBe(4);
  });

  test('reference marks index into the full category list', () => {
    const { container } = renderChart({
      withBrush: true,
      brushRange: [6, 9],
      referenceLines: [
        { x: 7, color: '#0ea5e9' },
        { x: 2, color: '#f43f5e' },
        { x: 'C8', color: '#22c55e' },
      ],
    });
    expect(container.querySelectorAll('line[stroke="#0ea5e9"]')).toHaveLength(1);
    expect(container.querySelectorAll('line[stroke="#f43f5e"]')).toHaveLength(0);
    expect(container.querySelectorAll('line[stroke="#22c55e"]')).toHaveLength(1);
  });
});
