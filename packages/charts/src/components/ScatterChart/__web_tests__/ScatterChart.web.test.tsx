import React from 'react';
import { Demo } from '../demos/basic';
import { render } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo as ReferenceMarksDemo } from '../demos/referenceMarks';
import { Demo as RightYAxisDemo } from '../demos/rightYAxis';
import { ScatterChart } from '../ScatterChart';
import type { ScatterChartProps } from '../types';
import {
  ChartInteractionProvider,
  useChartInteractionContext,
} from '../../../interaction/ChartInteractionContext';

test('renders its HTML plot with named axes on web', () => {
  const { container } = render(<PlocksProvider><ChartThemeProvider><Demo /></ChartThemeProvider></PlocksProvider>);
  expect(container.textContent).toContain('Spend vs. qualified leads');
  expect(container.textContent).toContain('Spend (USD thousands)');
  expect(container.textContent).toContain('Qualified leads');
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
  expect(container.querySelectorAll('svg line[stroke-dasharray="4 4"]')).toHaveLength(2);
  expect(container.querySelectorAll('svg circle[r="6"]')).toHaveLength(1);
  expect(container.textContent).toContain('Median leads');
});

// Left and right series share a raw value (30) so their placement can be compared.
const DUAL_AXIS_SERIES: ScatterChartProps['series'] = [
  { id: 'units', name: 'Units', data: [{ id: 'u1', x: 1, y: 10 }, { id: 'u2', x: 2, y: 30 }, { id: 'u3', x: 3, y: 50 }] },
  { id: 'revenue', name: 'Revenue', yAxis: 'right', data: [{ id: 'r1', x: 2.5, y: 30 }, { id: 'r2', x: 1, y: 3000 }, { id: 'r3', x: 3, y: 5000 }] },
];

const renderInTheme = (node: React.ReactElement) =>
  render(<PlocksProvider><ChartThemeProvider>{node}</ChartThemeProvider></PlocksProvider>);

const tickValues = (container: HTMLElement, prefix: string) =>
  Array.from(container.querySelectorAll('div'))
    .filter((el) => el.childElementCount === 0 && new RegExp(`^${prefix}-?[\\d.]+$`).test(el.textContent ?? ''))
    .map((el) => Number(el.textContent!.slice(prefix.length)));

/** Container-origin center of a rendered point (plot offset + point box + radius). */
const pointCenter = (point: HTMLElement) => {
  const plot = point.parentElement!.parentElement as HTMLElement;
  const radius = parseFloat(point.style.width) / 2;
  return {
    x: parseFloat(plot.style.left) + parseFloat(point.style.left) + radius,
    y: parseFloat(plot.style.top) + parseFloat(point.style.top) + radius,
  };
};

test('renders the right-axis demo with both axis titles', () => {
  const { container } = renderInTheme(<RightYAxisDemo />);
  expect(container.textContent).toContain('Units sold');
  expect(container.textContent).toContain('Revenue (USD)');
  expect(container.textContent).toMatch(/\$\d+k/);
});

test('right axis draws its own tick values from the right-bound series', () => {
  const { container } = renderInTheme(
    <ScatterChart
      w={400}
      h={300}
      data={[]}
      series={DUAL_AXIS_SERIES}
      yAxis={{ labelFormatter: (v) => `L${v}` }}
      yAxisRight={{ title: 'Revenue', labelFormatter: (v) => `R${v}` }}
    />
  );
  const left = tickValues(container, 'L');
  const right = tickValues(container, 'R');
  expect(left.length).toBeGreaterThan(1);
  expect(right.length).toBeGreaterThan(1);
  expect(Math.max(...left)).toBeLessThanOrEqual(60);
  expect(Math.max(...right)).toBeGreaterThanOrEqual(5000);
  expect(container.textContent).toContain('Revenue');
});

test('right axis mirrors the left domain when no series binds to it', () => {
  const { container } = renderInTheme(
    <ScatterChart
      w={400}
      h={300}
      data={[]}
      series={[DUAL_AXIS_SERIES[0]]}
      yAxis={{ labelFormatter: (v) => `L${v}` }}
      yAxisRight={{ labelFormatter: (v) => `R${v}` }}
    />
  );
  expect(tickValues(container, 'R')).toEqual(tickValues(container, 'L'));
});

test('places right-bound points by the right domain and hit-tests them as that series', () => {
  let interaction: ReturnType<typeof useChartInteractionContext> | null = null;
  const Probe = () => {
    interaction = useChartInteractionContext();
    return null;
  };
  const { container } = renderInTheme(
    <ChartInteractionProvider>
      <ScatterChart w={400} h={300} data={[]} series={DUAL_AXIS_SERIES} yAxisRight={{ title: 'Revenue' }} />
      <Probe />
    </ChartInteractionProvider>
  );
  const points = Array.from(container.querySelectorAll<HTMLElement>('[data-testid="scatter-point"]'));
  expect(points).toHaveLength(6);
  // Series order, then point order: units u1..u3, revenue r1..r3.
  const leftThirty = pointCenter(points[1]);
  const rightThirty = pointCenter(points[3]);
  // 30 is mid-range on the left (10–50) but the floor of the right (30–5000).
  expect(rightThirty.y - leftThirty.y).toBeGreaterThan(80);

  const hitRight = interaction!.hitTest({ px: rightThirty.x, py: rightThirty.y, maxDistance: 4 });
  expect(hitRight?.seriesId).toBe('revenue');
  expect(hitRight?.datum).toMatchObject({ id: 'r1', y: 30 });
  expect(hitRight?.label).toBe('Revenue');

  const hitLeft = interaction!.hitTest({ px: leftThirty.x, py: leftThirty.y, maxDistance: 4 });
  expect(hitLeft?.seriesId).toBe('units');
  expect(hitLeft?.datum).toMatchObject({ id: 'u2', y: 30 });
});
