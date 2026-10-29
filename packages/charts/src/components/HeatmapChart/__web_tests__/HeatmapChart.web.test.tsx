import React from 'react';
import { render } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { HeatmapChart } from '../HeatmapChart';
import { Demo } from '../demos/basic';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Support ticket load');
});

describe('cell label font', () => {
  const data = { rows: ['A', 'B'], cols: ['X', 'Y'], values: [[12, 7], [3, 25]] };
  const renderHeatmap = (fontFamily?: string) =>
    render(
      <PlocksProvider>
        <ChartThemeProvider value={fontFamily ? { fontFamily } : undefined}>
          <HeatmapChart w={320} h={240} data={data} cellSize={{ width: 60, height: 50 }} animationDuration={0} />
        </ChartThemeProvider>
      </PlocksProvider>
    );
  const labelFonts = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('svg text'))
      .filter((node) => node.textContent === '12' || node.textContent === '25')
      .map((node) => (node as SVGTextElement).style.fontFamily || node.getAttribute('font-family'));

  it('draws cell labels in the chart theme font', () => {
    const { container } = renderHeatmap('Inter');
    const fonts = labelFonts(container);
    expect(fonts.length).toBeGreaterThan(0);
    fonts.forEach((font) => expect(font).toBe('Inter'));
  });

  it("maps the default 'System' family to a sans-serif stack instead of the browser serif", () => {
    const { container } = renderHeatmap();
    const fonts = labelFonts(container);
    expect(fonts.length).toBeGreaterThan(0);
    fonts.forEach((font) => {
      expect(font).not.toBe('System');
      expect(font).toContain('sans-serif');
    });
  });
});
