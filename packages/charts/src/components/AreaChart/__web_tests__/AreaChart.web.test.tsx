import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { AreaChart } from '../AreaChart';
import type { AreaChartLayout, AreaChartProps } from '../types';
import { Demo as ReferenceMarksDemo } from '../demos/referenceMarks';
import { Demo as StackedReferenceMarksDemo } from '../demos/stackedReferenceMarks';
import { Demo as StreamDemo } from '../demos/stream';
import { Demo } from '../demos/basic';
import { Demo as BrushDemo } from '../demos/brush';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

const renderWithTheme = (node: React.ReactElement) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>{node}</ChartThemeProvider>
    </PlocksProvider>
  );

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Weekly signups');
  expect(document.body.textContent).toContain('Week 1');
});

test('renders reference areas, lines and dots as SVG marks', () => {
  const { container } = renderWithTheme(<ReferenceMarksDemo />);
  expect(container.querySelectorAll('svg rect[fill="#8b5cf6"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg line[stroke="#f59e0b"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg circle[r="6"]')).toHaveLength(1);
  expect(container.textContent).toContain('Goal 4M');
});

test('renders reference marks on its stacked demo', () => {
  const { container } = renderWithTheme(<StackedReferenceMarksDemo />);
  expect(container.querySelectorAll('svg rect[fill="#8b5cf6"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg line[stroke="#ef4444"]')).toHaveLength(1);
  expect(container.querySelectorAll('svg circle[r="6"]')).toHaveLength(1);
  expect(container.textContent).toContain('Target 40k');
});

const SERIES: AreaChartProps['series'] = [
  { id: 'a', name: 'A', data: [{ x: 0, y: 2 }, { x: 1, y: 4 }, { x: 2, y: 3 }] },
  { id: 'b', name: 'B', data: [{ x: 0, y: 6 }, { x: 1, y: 2 }, { x: 2, y: 5 }] },
];

// One y per layout that sits inside the drawn scale: stack totals (max 8),
// the 0–1 stack fraction, and the offset from the stream's centerline.
test.each<[AreaChartLayout, number]>([
  ['stacked', 5],
  ['stackedPercentage', 0.5],
  ['stream', 0],
])('forwards reference marks to the %s layout', (layout, y) => {
  const { container } = renderWithTheme(
    <AreaChart
      w={400}
      h={300}
      disabled
      layout={layout}
      series={SERIES}
      referenceAreas={[{ x1: 0.5, x2: 1.5, color: '#123456' }]}
      referenceLines={[{ y, color: '#abcdef', label: 'Ref line' }]}
      referenceDots={[{ x: 1, y, r: 7, color: '#fedcba' }]}
    />
  );
  // The layer paths prove the stacked chart (not the overlap LineChart) rendered.
  expect(container.querySelectorAll('svg path').length).toBeGreaterThanOrEqual(SERIES.length);
  expect(container.querySelectorAll('svg rect[fill="#123456"]')).toHaveLength(1);
  const line = container.querySelector('svg line[stroke="#abcdef"]');
  expect(line).not.toBeNull();
  expect(line!.getAttribute('y1')).toBe(line!.getAttribute('y2'));
  expect(container.querySelectorAll('svg circle[r="7"][fill="#fedcba"]')).toHaveLength(1);
  expect(container.textContent).toContain('Ref line');
});

test('places a stream reference line at y = 0 on the plot mid-line', () => {
  const { container } = renderWithTheme(
    <AreaChart w={400} h={300} disabled layout="stream" series={SERIES} referenceLines={[{ y: 0, color: '#abcdef' }]} />
  );
  const line = container.querySelector('svg line[stroke="#abcdef"]')!;
  const plotHeight = Number(line.closest('svg')!.getAttribute('height'));
  expect(Number(line.getAttribute('y1'))).toBeCloseTo(plotHeight / 2, 3);
});

test('renders its stream demo', () => {
  expectChartDemo(StreamDemo, 'Listening hours by genre');
  expect(document.body.textContent).toContain('Jan');
});

describe('withBrush', () => {
  const SERIES = [
    { id: 'a', name: 'A', color: '#4C6EF5', data: Array.from({ length: 21 }, (_, i) => ({ x: i, y: i === 20 ? 900 : 10 })) },
    { id: 'b', name: 'B', color: '#20C997', data: Array.from({ length: 21 }, (_, i) => ({ x: i, y: 5 })) },
  ];
  const renderChart = (props: Partial<AreaChartProps> = {}) =>
    render(
      <PlocksProvider>
        <ChartThemeProvider>
          <AreaChart w={480} h={320} series={SERIES} legend={{ show: false }} {...props} />
        </ChartThemeProvider>
      </PlocksProvider>
    );
  const shows = (label: string) => screen.queryAllByText(label).length > 0;

  test('renders its brush demo', () => {
    expectChartDemo(BrushDemo);
  });

  test('stacked layouts render the brush through StackedAreaChart', () => {
    const onChange = jest.fn();
    renderChart({ layout: 'stacked', withBrush: true, brushProps: { onChange } });
    expect(screen.getByTestId('stacked-area-brush')).toBeTruthy();
    const end = screen.getAllByRole('slider')[1];
    expect(end.getAttribute('aria-valuenow')).toBe('20');
    expect(shows('20')).toBe(true);
    fireEvent.keyDown(end, { key: 'ArrowLeft', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith([0, 10]);
    // x = 20 left the window, and the y axis refit away from its 905 total.
    expect(shows('20')).toBe(false);
    expect(shows('900')).toBe(false);
  });

  test('a controlled range is respected by stacked layouts', () => {
    renderChart({ layout: 'stacked', withBrush: true, brushRange: [2, 6] });
    const [start, end] = screen.getAllByRole('slider');
    expect(start.getAttribute('aria-valuenow')).toBe('2');
    expect(end.getAttribute('aria-valuenow')).toBe('6');
  });

  test('stacked reference marks follow the window', () => {
    const { container } = renderChart({
      layout: 'stacked',
      withBrush: true,
      brushRange: [0, 10],
      referenceLines: [{ x: 5, color: '#0ea5e9' }, { x: 15, color: '#f43f5e' }],
    });
    expect(container.querySelectorAll('line[stroke="#0ea5e9"]')).toHaveLength(1);
    expect(container.querySelectorAll('line[stroke="#f43f5e"]')).toHaveLength(0);
  });

  test('the overlap layout renders the brush through LineChart', () => {
    renderChart({ withBrush: true });
    expect(screen.getByTestId('line-chart-brush')).toBeTruthy();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  test('renders nothing extra without withBrush', () => {
    renderChart({ layout: 'stacked' });
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });
});
