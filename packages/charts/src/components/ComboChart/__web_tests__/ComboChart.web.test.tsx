import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo as ReferenceMarksDemo } from '../demos/referenceMarks';
import { Demo } from '../demos/basic';
import { ComboChart } from '../ComboChart';
import { Demo as BrushDemo } from '../demos/brush';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Revenue vs. active users');
});

test('renders reference areas, lines and dots as SVG marks', () => {
  const { container } = render(
    <PlocksProvider>
      <ChartThemeProvider>
        <ReferenceMarksDemo />
      </ChartThemeProvider>
    </PlocksProvider>
  );
  expect(container.querySelectorAll('svg rect[fill="#10b981"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg line[stroke="#f59e0b"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg circle[r="6"]')).toHaveLength(1);
  expect(container.textContent).toContain('Target 500');
});

describe('withBrush', () => {
  const LAYERS = [
    { type: 'bar' as const, id: 'orders', name: 'Orders', data: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 100 + i })) },
    { type: 'line' as const, id: 'avg', name: 'Average', data: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 90 + i })) },
  ];
  const renderChart = (props: Partial<React.ComponentProps<typeof ComboChart>> = {}) =>
    render(
      <PlocksProvider>
        <ChartThemeProvider>
          <ComboChart w={520} h={320} layers={LAYERS} {...props} />
        </ChartThemeProvider>
      </PlocksProvider>
    );
  const plotPaths = (container: HTMLElement) => {
    const plot = Array.from(container.querySelectorAll('svg')).find((svg) => !svg.closest('[data-testid="combo-chart-brush"]') && svg.querySelector('path'));
    return plot?.querySelectorAll('path').length ?? 0;
  };

  test('renders its brush demo', () => {
    expectChartDemo(BrushDemo);
  });

  test('renders nothing extra without withBrush', () => {
    renderChart();
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });

  test('a key step on the end handle narrows the x domain', () => {
    const onBrushChange = jest.fn();
    const { container } = renderChart({ withBrush: true, onBrushChange, brushProps: { step: 1 } });
    const end = screen.getAllByRole('slider')[1];
    expect(end.getAttribute('aria-valuenow')).toBe('20');
    const before = plotPaths(container);
    fireEvent.keyDown(end, { key: 'ArrowLeft', shiftKey: true });
    expect(onBrushChange).toHaveBeenLastCalledWith([1, 10]);
    // Ten of the twenty bars remain (plus the line path).
    expect(plotPaths(container)).toBe(before - 10);
    expect(screen.queryAllByText('20')).toHaveLength(0);
  });

  test('a controlled brushRange drives the window', () => {
    const { container } = renderChart({ withBrush: true, brushRange: [5, 8] });
    // Four bars and the line.
    expect(plotPaths(container)).toBe(5);
    const [start, end] = screen.getAllByRole('slider');
    expect(start.getAttribute('aria-valuenow')).toBe('5');
    expect(end.getAttribute('aria-valuenow')).toBe('8');
  });
});
