import React from 'react';
import { act, render } from '@testing-library/react';

import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { parseColor } from '../../../utils/colorScale';
import { Demo } from '../demos/basic';
import { SunburstChart } from '../SunburstChart';
import type { SunburstChartProps, SunburstNode } from '../types';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Disk usage');
});

const SIZE = 300;
const CENTER = SIZE / 2;

const TREE: SunburstNode[] = [
  {
    name: 'Alpha',
    children: [
      { name: 'A1', value: 30, children: [{ name: 'A1x', value: 20 }, { name: 'A1y', value: 10 }] },
      { name: 'A2', value: 10 },
    ],
  },
  { name: 'Beta', color: '#ff0000', children: [{ name: 'B1', value: 15 }, { name: 'B2', value: 5, color: '#00aa00', children: [{ name: 'B2x', value: 5 }] }] },
];

const renderChart = (props: Partial<SunburstChartProps> = {}) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>
        <SunburstChart w={SIZE} h={SIZE} data={TREE} disableAnimation {...props} />
      </ChartThemeProvider>
    </PlocksProvider>
  );

const segments = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<SVGPathElement>('path[data-testid^="sunburst-segment-"]'));
const segment = (container: HTMLElement, key: string) =>
  container.querySelector<SVGPathElement>(`path[data-testid="sunburst-segment-${key}"]`)!;

/** Canonical angle (0° at 12 o'clock, clockwise) of a point around the chart center. */
const angleOf = (x: number, y: number) => ((Math.atan2(x - CENTER, -(y - CENTER)) * 180) / Math.PI + 360) % 360;

/** Start and end of a segment's outer arc, read off its path. */
const sweepOf = (path: SVGPathElement) => {
  const nums = (path.getAttribute('d') ?? '').match(/-?[\d.]+(e-?\d+)?/g)!.map(Number);
  // M x0 y0 A rx ry rot large sweep x1 y1 …
  const start = angleOf(nums[0], nums[1]);
  const end = angleOf(nums[7], nums[8]);
  return ((end - start) + 360) % 360;
};

const hueOf = (color: string) => {
  const { r, g, b } = parseColor(color)!;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const lightnessOf = (color: string) => {
  const { r, g, b } = parseColor(color)!;
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};

test('draws one segment per node, down to maxDepth', () => {
  const all = renderChart();
  // Alpha, A1, A1x, A1y, A2, Beta, B1, B2, B2x
  expect(segments(all.container)).toHaveLength(9);
  all.unmount();

  const shallow = renderChart({ maxDepth: 2 });
  expect(segments(shallow.container).map((p) => p.getAttribute('data-testid'))).toEqual(
    ['0', '0/0', '0/1', '1', '1/0', '1/1'].map((key) => `sunburst-segment-${key}`)
  );
});

test('sizes each arc in proportion to its value', () => {
  const { container } = renderChart();
  // Alpha (40) and Beta (20) split the circle 2:1.
  expect(sweepOf(segment(container, '0'))).toBeCloseTo(240, 3);
  expect(sweepOf(segment(container, '1'))).toBeCloseTo(120, 3);
  // Siblings A1 (30) and A2 (10) split Alpha's arc 3:1.
  expect(sweepOf(segment(container, '0/0')) / sweepOf(segment(container, '0/1'))).toBeCloseTo(3, 3);
  // A parent without a value takes its children's sum; a leaf-summed parent fills its arc.
  expect(sweepOf(segment(container, '0/0/0')) + sweepOf(segment(container, '0/0/1'))).toBeCloseTo(
    sweepOf(segment(container, '0/0')),
    3
  );
});

test('leaves the rest of a parent arc empty when its value exceeds its children', () => {
  const { container } = renderChart({
    data: [{ name: 'Whole', value: 100, children: [{ name: 'Part', value: 25 }] }, { name: 'Other', value: 100 }],
  });
  expect(sweepOf(segment(container, '0'))).toBeCloseTo(180, 3);
  expect(sweepOf(segment(container, '0/0'))).toBeCloseTo(45, 3);
});

test('children inherit their parent hue, lighter per ring, unless they set a color', () => {
  const { container } = renderChart();
  const fill = (key: string) => segment(container, key).getAttribute('fill')!;

  expect(fill('1')).toBe('#ff0000');
  // B1 takes Beta's hue, tinted toward the (light) background.
  expect(hueOf(fill('1/0'))).toBeCloseTo(hueOf('#ff0000'), 0);
  expect(lightnessOf(fill('1/0'))).toBeGreaterThan(lightnessOf('#ff0000'));
  // Alpha's palette hue carries down two rings.
  expect(hueOf(fill('0/0'))).toBeCloseTo(hueOf(fill('0')), 0);
  expect(hueOf(fill('0/0/0'))).toBeCloseTo(hueOf(fill('0')), 0);
  expect(lightnessOf(fill('0/0/0'))).toBeGreaterThan(lightnessOf(fill('0/0')));
  // B2 overrides its color, and its child inherits the override, not Beta's red.
  expect(fill('1/1')).toBe('#00aa00');
  expect(hueOf(fill('1/1/0'))).toBeCloseTo(hueOf('#00aa00'), 0);
});

test('labels segments where the name fits and omits slivers', () => {
  const { container } = renderChart({
    data: [{ name: 'Big', value: 500 }, { name: 'Sliver', value: 1 }],
  });
  expect(container.querySelector('[data-testid="sunburst-label-0"]')?.textContent).toBe('Big');
  expect(container.querySelector('[data-testid="sunburst-label-1"]')).toBeNull();
  expect(segments(container)).toHaveLength(2);
});

test('withLabels={false} draws no labels', () => {
  const { container } = renderChart({ withLabels: false });
  expect(container.querySelectorAll('[data-testid^="sunburst-label-"]')).toHaveLength(0);
});

test('describes its top-level branches and their shares to assistive technology', () => {
  const generated = renderChart();
  expect(generated.getByRole('img').getAttribute('aria-label')).toBe('Alpha 67%, Beta 33%');
  generated.unmount();

  const custom = renderChart({ accessibilityLabel: 'Team budget' });
  expect(custom.getByRole('img').getAttribute('aria-label')).toBe('Team budget');
});

/** A point in the middle of a segment, in container pixels. */
const centroid = (path: SVGPathElement) => {
  const nums = (path.getAttribute('d') ?? '').match(/-?[\d.]+(e-?\d+)?/g)!.map(Number);
  const outer = { x: nums[0], y: nums[1] };
  const r1 = Math.hypot(outer.x - CENTER, outer.y - CENTER);
  // … L x2 y2 (the inner arc's end) …
  const inner = Math.hypot(nums[9] - CENTER, nums[10] - CENTER);
  const angle = ((angleOf(nums[0], nums[1]) + sweepOf(path) / 2) * Math.PI) / 180;
  const r = (r1 + inner) / 2;
  return { clientX: CENTER + r * Math.sin(angle), clientY: CENTER - r * Math.cos(angle) };
};

/** jsdom has no PointerEvent, so send a MouseEvent under the pointer event's name. */
const pointer = (target: Element, type: 'pointerdown' | 'pointerup', point: { clientX: number; clientY: number }) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...point });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  act(() => {
    target.dispatchEvent(event);
  });
};
const surfaceOf = (container: HTMLElement) => container.querySelector('[data-testid="sunburst-gesture-surface"]')!;

const press = (container: HTMLElement, point: { clientX: number; clientY: number }) => {
  pointer(surfaceOf(container), 'pointerdown', point);
  pointer(surfaceOf(container), 'pointerup', point);
};

test('hovering a segment keeps it and its ancestors lit and dims the rest', () => {
  const { container } = renderChart();
  pointer(surfaceOf(container), 'pointerdown', centroid(segment(container, '0/0/1')));
  const opacity = (key: string) => Number(segment(container, key).getAttribute('opacity'));
  expect(opacity('0/0/1')).toBe(1);
  expect(opacity('0/0')).toBe(1);
  expect(opacity('0')).toBe(1);
  expect(opacity('0/0/0')).toBeLessThan(1);
  expect(opacity('1')).toBeLessThan(1);
});

test('reports a pressed segment with its node and path', () => {
  const onSegmentPress = jest.fn();
  const onDataPointPress = jest.fn();
  const { container } = renderChart({ onSegmentPress, onDataPointPress });
  press(container, centroid(segment(container, '0/0/1')));
  expect(onSegmentPress).toHaveBeenCalledTimes(1);
  const [node, path] = onSegmentPress.mock.calls[0];
  expect(node.name).toBe('A1y');
  expect(path.map((n: SunburstNode) => n.name)).toEqual(['Alpha', 'A1', 'A1y']);
  const segmentArg = onDataPointPress.mock.calls[0][0];
  expect(segmentArg).toMatchObject({ name: 'A1y', value: 10, depth: 3, parentValue: 30, total: 60 });
  expect(segmentArg.shareOfParent).toBeCloseTo(1 / 3);
});

test('zoomOnClick re-roots on a pressed segment and the center goes back up', () => {
  const { container } = renderChart({ zoomOnClick: true });
  expect(segments(container)).toHaveLength(9);

  press(container, centroid(segment(container, '0')));
  // Alpha's descendants now fill the rings: A1, A1x, A1y, A2.
  expect(segments(container).map((p) => p.getAttribute('data-testid')!.replace('sunburst-segment-', '')).sort()).toEqual(
    ['0/0', '0/0/0', '0/0/1', '0/1']
  );
  expect(sweepOf(segment(container, '0/0'))).toBeCloseTo(270, 3);
  expect(container.querySelector('[data-testid="sunburst-center"]')?.textContent).toBe('Alpha');

  press(container, { clientX: CENTER, clientY: CENTER });
  expect(segments(container)).toHaveLength(9);
  expect(container.querySelector('[data-testid="sunburst-center"]')).toBeNull();
});
