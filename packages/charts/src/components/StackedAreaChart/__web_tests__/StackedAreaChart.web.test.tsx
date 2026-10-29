import React from 'react';
import { render } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { ChartInteractionProvider, useChartInteractionContext } from '../../../interaction/ChartInteractionContext';
import type { ActiveTarget } from '../../../core/hittest/types';
import { StackedAreaChart } from '../StackedAreaChart';
import type { StackedAreaChartProps } from '../types';
import { Demo } from '../demos/basic';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Active users by surface');
});

const SERIES: StackedAreaChartProps['series'] = [
  { id: 'a', name: 'A', data: [{ x: 0, y: 2 }, { x: 1, y: 4 }, { x: 2, y: 3 }] },
  { id: 'b', name: 'B', data: [{ x: 0, y: 6 }, { x: 1, y: 2 }, { x: 2, y: 5 }] },
  { id: 'c', name: 'C', data: [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 7 }] },
];

const renderChart = (props: Partial<StackedAreaChartProps>) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>
        <StackedAreaChart w={400} h={300} series={SERIES} disabled {...props} />
      </ChartThemeProvider>
    </PlocksProvider>
  );

/** The plot Svg is the one holding the layer paths. */
const plotSvg = (container: HTMLElement) => container.querySelector('path')!.closest('svg')!;
const layerPaths = (container: HTMLElement) => Array.from(plotSvg(container).querySelectorAll('path'));

/** Vertices of a linear (`smooth={false}`) layer path: top edge left→right, then bottom edge right→left. */
const vertices = (d: string) =>
  Array.from(d.matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g), (m) => ({ x: Number(m[1]), y: Number(m[2]) }));

describe('stream mode', () => {
  test('renders one smooth layer path per series', () => {
    const { container } = renderChart({ stackMode: 'stream' });
    const paths = layerPaths(container);
    expect(paths).toHaveLength(SERIES.length);
    paths.forEach((path) => {
      expect(path.getAttribute('d')).toMatch(/^M .* C .*Z$/);
    });
  });

  test('centers the stack on the plot mid-line at every x', () => {
    const { container } = renderChart({ stackMode: 'stream', smooth: false });
    const plotHeight = Number(plotSvg(container).getAttribute('height'));
    const paths = layerPaths(container);
    const n = SERIES[0].data.length;
    // First drawn layer carries the stack's bottom edge, the last one its top edge.
    const bottom = vertices(paths[0].getAttribute('d')!).slice(n).reverse();
    const top = vertices(paths[paths.length - 1].getAttribute('d')!).slice(0, n);
    for (let i = 0; i < n; i++) {
      expect(top[i].x).toBeCloseTo(bottom[i].x, 3);
      expect((top[i].y + bottom[i].y) / 2).toBeCloseTo(plotHeight / 2, 3);
    }
    // The stack is thicker where the total is larger (x=2 total 15 vs x=1 total 9).
    expect(bottom[2].y - top[2].y).toBeGreaterThan(bottom[1].y - top[1].y);
  });

  test('hides the y axis and its gridlines unless yAxis.show is true', () => {
    const axisProps = {
      stackMode: 'stream' as const,
      grid: { show: true },
      xAxis: { labelFormatter: (value: number) => `X${value}` },
    };
    const horizontalGridLines = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('line')).filter((line) => line.getAttribute('y1') === line.getAttribute('y2'));

    const hidden = renderChart({ ...axisProps, yAxis: { labelFormatter: (value: number) => `Y${value}` } });
    expect(hidden.container.textContent).toContain('X0');
    expect(hidden.container.textContent).not.toMatch(/Y-?\d/);
    expect(horizontalGridLines(hidden.container)).toHaveLength(0);
    hidden.unmount();

    const shown = renderChart({ ...axisProps, yAxis: { show: true, labelFormatter: (value: number) => `Y${value}` } });
    expect(shown.container.textContent).toMatch(/Y-?\d/);
    expect(horizontalGridLines(shown.container).length).toBeGreaterThan(0);
  });

  test('reports each series raw value to the tooltip, not the offset coordinates', () => {
    let ctx: ReturnType<typeof useChartInteractionContext> | null = null;
    const Probe = () => {
      ctx = useChartInteractionContext();
      return null;
    };
    render(
      <PlocksProvider>
        <ChartThemeProvider>
          <ChartInteractionProvider config={{ liveTooltip: true }}>
            <StackedAreaChart w={400} h={300} series={SERIES} stackMode="stream" />
            <Probe />
          </ChartInteractionProvider>
        </ChartThemeProvider>
      </PlocksProvider>
    );
    const probes = [[0, 0], [400, 0], [0, 300], [400, 300], [200, 150]];
    const targets = probes.map(([px, py]) => ctx!.hitTest({ px, py, maxDistance: Infinity }) as ActiveTarget);
    targets.forEach((target) => {
      expect(target).toBeTruthy();
      const raw = SERIES.find((s) => s.id === target.seriesId)!.data.find((p) => p.x === target.dataX)!.y;
      expect(target.value).toBe(raw);
      expect(target.formattedValue).toBe(String(raw));
    });
    // The probes hit marks whose drawn (offset) y differs from the raw value.
    expect(targets.some((target) => target.dataY !== target.value)).toBe(true);
  });
});
