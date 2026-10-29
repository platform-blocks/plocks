import React from 'react';
import { render } from '@testing-library/react';

import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo } from '../demos/basic';
import { BulletChart } from '../BulletChart';
import { bulletBarFrame } from '../AnimatedBulletBar';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Revenue');
});

const renderChart = (ui: React.ReactElement) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>{ui}</ChartThemeProvider>
    </PlocksProvider>
  );

const box = (el: Element | null) => {
  expect(el).not.toBeNull();
  return {
    x: Number(el!.getAttribute('x')),
    y: Number(el!.getAttribute('y')),
    width: Number(el!.getAttribute('width')),
    height: Number(el!.getAttribute('height')),
  };
};

const byId = (container: HTMLElement, id: string) => container.querySelector(`[data-testid="${id}"]`);

test('draws the bar in proportion to value over the scale and the target marker at the target', () => {
  const { container } = renderChart(<BulletChart w={400} value={50} target={80} max={100} withAxis={false} disableAnimation />);
  const track = box(byId(container, 'bullet-track-0'));
  const bar = box(byId(container, 'bullet-bar-0'));
  const target = box(byId(container, 'bullet-target-0'));
  expect(bar.x).toBeCloseTo(track.x);
  expect(bar.width / track.width).toBeCloseTo(0.5);
  expect(target.x + target.width / 2).toBeCloseTo(track.x + track.width * 0.8);
  // Default thickness is about a third of the band; the marker is taller than the bar.
  expect(bar.height / track.height).toBeCloseTo(0.33);
  expect(target.height).toBeGreaterThan(bar.height);
});

test('rounds the default max up to a nice tick', () => {
  const { container, getByText } = renderChart(<BulletChart w={400} value={230000} target={150000} disableAnimation />);
  const track = box(byId(container, 'bullet-track-0'));
  const bar = box(byId(container, 'bullet-bar-0'));
  expect(bar.width / track.width).toBeCloseTo(230 / 250);
  expect(getByText('250K')).toBeTruthy();
});

test('draws one band per range, custom colors as given and default shades darkest first', () => {
  const { container } = renderChart(
    <BulletChart
      w={400}
      value={40}
      ranges={[{ value: 30 }, { value: 60 }, { value: 100, color: '#00ff00' }]}
      disableAnimation
    />
  );
  const bands = Array.from(container.querySelectorAll('[data-testid^="bullet-range-0-"]'));
  expect(bands).toHaveLength(3);
  const fills = bands.map((b) => b.getAttribute('fill')!);
  expect(fills[2]).toBe('#00ff00');
  expect(fills[0]).not.toBe(fills[1]);
  // Default background is light, so the darker shade has the smaller channel sum.
  const sum = (hex: string) => [1, 3, 5].reduce((acc, i) => acc + parseInt(hex.slice(i, i + 2), 16), 0);
  expect(sum(fills[0])).toBeLessThan(sum(fills[1]));
  const widths = bands.map((b) => box(b).width);
  const track = box(byId(container, 'bullet-track-0'));
  expect(widths[0] / track.width).toBeCloseTo(0.3);
  expect(widths[1] / track.width).toBeCloseTo(0.3);
  expect(widths[2] / track.width).toBeCloseTo(0.4);
});

test('describes value, target and the range the value falls in', () => {
  const { getByRole, getByText } = renderChart(
    <BulletChart
      w={400}
      label="Revenue"
      value={230000}
      target={150000}
      ranges={[
        { value: 100000, label: 'Poor' },
        { value: 200000, label: 'Average' },
        { value: 300000, label: 'Good' },
      ]}
      valueFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
      disableAnimation
    />
  );
  expect(getByRole('img').getAttribute('aria-label')).toBe('Revenue: $230k, target $150k, range Good up to $300k');
  expect(getByText('Revenue')).toBeTruthy();
  expect(getByText('$300k')).toBeTruthy();
});

test('vertical orientation grows the bar upward and swaps its dimensions', () => {
  const { container } = renderChart(
    <BulletChart w={300} h={260} orientation="vertical" value={25} target={75} max={100} disableAnimation />
  );
  const track = box(byId(container, 'bullet-track-0'));
  const bar = box(byId(container, 'bullet-bar-0'));
  const target = box(byId(container, 'bullet-target-0'));
  expect(track.height).toBeGreaterThan(track.width);
  expect(bar.height / track.height).toBeCloseTo(0.25);
  expect(bar.width / track.width).toBeCloseTo(0.33);
  // Anchored at the bottom of the track.
  expect(bar.y + bar.height).toBeCloseTo(track.y + track.height);
  expect(target.y + target.height / 2).toBeCloseTo(track.y + track.height * 0.25);
  expect(target.width).toBeGreaterThan(target.height);
});

test('renders one bullet per data row on a shared scale', () => {
  const { container, getByRole } = renderChart(
    <BulletChart
      w={400}
      data={[
        { label: 'A', value: 50 },
        { label: 'B', value: 100, target: 80 },
      ]}
      max={200}
      disableAnimation
    />
  );
  const a = box(byId(container, 'bullet-bar-0'));
  const b = box(byId(container, 'bullet-bar-1'));
  expect(b.width / a.width).toBeCloseTo(2);
  expect(b.y).toBeGreaterThan(a.y);
  expect(byId(container, 'bullet-target-0')).toBeNull();
  expect(byId(container, 'bullet-target-1')).not.toBeNull();
  expect(getByRole('img').getAttribute('aria-label')).toBe('A: 50; B: 100, target 80');
});

test('an animation frame never draws a negative or overlong value bar', () => {
  // On web the first withTiming frame can land before the animation's start time;
  // the ease-out curve then yields a large negative length (seen as -78px).
  const rect = { x: 20, y: 10, width: 150, height: 12 };
  expect(bulletBarFrame(-78.6, rect, true)).toEqual({ x: 20, y: 10, width: 0, height: 12 });
  expect(bulletBarFrame(75, rect, true).width).toBe(75);
  expect(bulletBarFrame(150.4, rect, true).width).toBe(150);
  const column = { x: 30, y: 40, width: 20, height: 100 };
  expect(bulletBarFrame(-5, column, false)).toEqual({ x: 30, y: 140, width: 20, height: 0 });
  expect(bulletBarFrame(40, column, false)).toEqual({ x: 30, y: 100, width: 20, height: 40 });
});
