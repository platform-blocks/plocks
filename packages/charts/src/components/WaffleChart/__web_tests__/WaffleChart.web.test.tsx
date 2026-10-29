import React from 'react';
import { render } from '@testing-library/react';

import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo } from '../demos/basic';
import { WaffleChart } from '../WaffleChart';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Browser share');
});

const renderChart = (ui: React.ReactElement) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>{ui}</ChartThemeProvider>
    </PlocksProvider>
  );

test('allocates cells in proportion to value and leaves the rest empty', () => {
  const { container } = renderChart(
    <WaffleChart
      w={300}
      data={[
        { name: 'A', value: 30, color: '#ff0000' },
        { name: 'B', value: 20, color: '#00ff00' },
      ]}
      total={100}
      emptyColor="#eeeeee"
      disableAnimation
    />
  );
  const rects = Array.from(container.querySelectorAll('rect'));
  const fills = rects.map((r) => r.getAttribute('fill'));
  expect(fills.filter((f) => f === '#ff0000')).toHaveLength(30);
  expect(fills.filter((f) => f === '#00ff00')).toHaveLength(20);
  expect(fills.filter((f) => f === '#eeeeee')).toHaveLength(50);
});

test('describes its segments to assistive technology and lists them in the legend', () => {
  const { getByRole, getByText } = renderChart(
    <WaffleChart w={300} data={[{ name: 'Done', value: 3 }, { name: 'Open', value: 1 }]} disableAnimation />
  );
  expect(getByRole('img').getAttribute('aria-label')).toBe('Done 3, Open 1');
  expect(getByText('Done')).toBeTruthy();
  expect(getByText('Open')).toBeTruthy();
});
