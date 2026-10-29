// A zone west of Greenwich: `new Date('2025-03-10')` here is March 9th, 4 PM, so
// any UTC parsing of keys would shift every day back by one. The range in these
// tests also spans the US DST change on 2025-03-09.
process.env.TZ = 'America/Los_Angeles';

import React from 'react';
import { render } from '@testing-library/react';

import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo } from '../demos/basic';
import { CalendarHeatmapChart } from '../CalendarHeatmapChart';
import type { CalendarHeatmapChartProps } from '../types';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Contributions');
});

const renderChart = (props: Partial<CalendarHeatmapChartProps>) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>
        <CalendarHeatmapChart w={800} data={{}} {...props} />
      </ChartThemeProvider>
    </PlocksProvider>
  );

const cells = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-testid^="calendar-heatmap-cell-"]'));
const cell = (container: HTMLElement, key: string) => {
  const el = container.querySelector(`[data-testid="calendar-heatmap-cell-${key}"]`);
  if (!el) throw new Error(`no cell for ${key}`);
  return el;
};
const num = (el: Element, attr: string) => Number(el.getAttribute(attr));
const STEP = 11; // default rectSize 10 + gap 1

test('draws one cell per day in range, plus the outside days of the edge weeks', () => {
  // 2025-01-01 is a Wednesday and 2025-01-31 a Friday: Monday weeks run Dec 30 – Feb 2.
  const inside = renderChart({ startDate: '2025-01-01', endDate: '2025-01-31', withOutsideDates: false });
  expect(cells(inside.container)).toHaveLength(31);
  inside.unmount();

  const outside = renderChart({ startDate: '2025-01-01', endDate: '2025-01-31' });
  expect(cells(outside.container)).toHaveLength(35);
  expect(outside.container.querySelector('[data-testid="calendar-heatmap-cell-2024-12-30"]')).not.toBeNull();
  expect(outside.container.querySelector('[data-testid="calendar-heatmap-cell-2025-02-02"]')).not.toBeNull();
});

test('places a day in its week column and weekday row for either first day of week', () => {
  // 2025-03-10 is a Monday. Monday weeks start Feb 24; Sunday weeks start Feb 23.
  const monday = renderChart({ startDate: '2025-03-01', endDate: '2025-03-31', firstDayOfWeek: 1 });
  const mOrigin = cell(monday.container, '2025-02-24');
  const mDay = cell(monday.container, '2025-03-10');
  expect(num(mDay, 'x') - num(mOrigin, 'x')).toBe(2 * STEP);
  expect(num(mDay, 'y') - num(mOrigin, 'y')).toBe(0);
  monday.unmount();

  const sunday = renderChart({ startDate: '2025-03-01', endDate: '2025-03-31', firstDayOfWeek: 0 });
  const sOrigin = cell(sunday.container, '2025-02-23');
  const sDay = cell(sunday.container, '2025-03-10');
  expect(num(sDay, 'x') - num(sOrigin, 'x')).toBe(2 * STEP);
  expect(num(sDay, 'y') - num(sOrigin, 'y')).toBe(1 * STEP);
});

test('buckets values into the color levels, max into the last; empty and zero days use emptyColor', () => {
  const { container } = renderChart({
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    data: { '2025-03-03': 1, '2025-03-04': 5, '2025-03-05': 10, '2025-03-06': 0 },
    colors: ['#000001', '#000002', '#000003', '#000004'],
    emptyColor: '#eeeeee',
  });
  expect(cell(container, '2025-03-03').getAttribute('fill')).toBe('#000001');
  // (5 - 1) / (10 - 1) = 0.44 of the way: the second of four levels.
  expect(cell(container, '2025-03-04').getAttribute('fill')).toBe('#000002');
  expect(cell(container, '2025-03-05').getAttribute('fill')).toBe('#000004');
  expect(cell(container, '2025-03-06').getAttribute('fill')).toBe('#eeeeee');
  expect(cell(container, '2025-03-07').getAttribute('fill')).toBe('#eeeeee');
});

test('reads keys as local calendar days, with no time zone drift', () => {
  // Guard: the zone took effect, so a UTC parse really would land on the 9th.
  expect(new Date('2025-03-10').getDate()).toBe(9);
  const { container } = renderChart({
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    withOutsideDates: false,
    data: [
      { date: '2025-03-10', value: 4 },
      { date: new Date(2025, 2, 10, 23, 30), value: 3 },
    ],
    colors: ['#000001', '#000002', '#000003', '#000004'],
    emptyColor: '#eeeeee',
  });
  const all = cells(container);
  // Every March day once, across the DST change — no duplicated or missing day.
  const keys = all.map((c) => c.getAttribute('data-testid')!.replace('calendar-heatmap-cell-', ''));
  expect(new Set(keys).size).toBe(31);
  expect(keys[0]).toBe('2025-03-01');
  expect(keys[30]).toBe('2025-03-31');
  // Both entries summed onto March 10th, a Monday (row 0 for Monday weeks).
  expect(cell(container, '2025-03-10').getAttribute('fill')).toBe('#000004');
  expect(cell(container, '2025-03-09').getAttribute('fill')).toBe('#eeeeee');
  expect(num(cell(container, '2025-03-10'), 'y')).toBe(num(cell(container, '2025-03-03'), 'y'));
  expect(num(cell(container, '2025-03-10'), 'y')).toBeLessThan(num(cell(container, '2025-03-09'), 'y'));
});

test('puts month labels above or below the grid', () => {
  const top = renderChart({ startDate: '2025-01-01', endDate: '2025-03-31' });
  const topLabel = top.container.querySelector('[data-testid^="calendar-heatmap-month-"]')!;
  expect(topLabel.textContent).toBe('Jan');
  expect(num(topLabel, 'y')).toBeLessThan(num(cell(top.container, '2025-01-06'), 'y'));
  top.unmount();

  const bottom = renderChart({ startDate: '2025-01-01', endDate: '2025-03-31', monthLabelsPosition: 'bottom', monthLabels: ['J', 'F', 'M'] });
  const labels = Array.from(bottom.container.querySelectorAll('[data-testid^="calendar-heatmap-month-"]'));
  expect(labels.map((l) => l.textContent)).toEqual(['J', 'F', 'M']);
  // Below the Sunday row (the last one for Monday weeks).
  expect(num(labels[0], 'y')).toBeGreaterThan(num(cell(bottom.container, '2025-01-05'), 'y') + 10);
});

test('splitMonths starts each month in a new column after a spacer', () => {
  // 2025-02-01 is a Saturday, in the week of Jan 27 (column 4 of Monday weeks).
  const plain = renderChart({ startDate: '2025-01-01', endDate: '2025-02-28' });
  expect(num(cell(plain.container, '2025-02-01'), 'x') - num(cell(plain.container, '2025-01-01'), 'x')).toBe(4 * STEP);
  plain.unmount();

  const split = renderChart({ startDate: '2025-01-01', endDate: '2025-02-28', splitMonths: true });
  expect(num(cell(split.container, '2025-02-01'), 'x') - num(cell(split.container, '2025-01-01'), 'x')).toBe(6 * STEP);
  // Feb 1 opens a column of its own, at the top of its weekday row.
  expect(num(cell(split.container, '2025-02-03'), 'x')).toBe(num(cell(split.container, '2025-02-01'), 'x') + STEP);
});

test('shrinks cells to fit a narrow box, and labels the chart for assistive tech', () => {
  const { container } = renderChart({
    w: 320,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    data: { '2025-03-10': 7, '2025-06-01': 2 },
  });
  const width = num(cell(container, '2025-01-01'), 'width');
  expect(width).toBeLessThan(10);
  expect(width).toBeGreaterThanOrEqual(4);
  const svg = container.querySelector('svg')!;
  expect(num(svg, 'width')).toBe(320);
  const labelled = container.querySelector('[aria-label^="Calendar heatmap"]');
  expect(labelled?.getAttribute('aria-label')).toMatch(/Total 9 across 2 days; highest 7 on/);
});

test('passes getRectProps the day and its value', () => {
  const calls: Array<[string, number | null]> = [];
  const { container } = renderChart({
    startDate: '2025-03-01',
    endDate: '2025-03-02',
    withOutsideDates: false,
    data: { '2025-03-02': 3 },
    getRectProps: (date, value) => {
      calls.push([date, value]);
      return value ? { stroke: '#ff00ff' } : undefined;
    },
  });
  expect(calls).toEqual([
    ['2025-03-01', null],
    ['2025-03-02', 3],
  ]);
  expect(cell(container, '2025-03-02').getAttribute('stroke')).toBe('#ff00ff');
});
