import React from 'react';
import { render } from '@testing-library/react';

import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { Demo } from '../demos/basic';
import { MatrixChart } from '../MatrixChart';

test('renders its published demo as web SVG with visible marks', () => {
  expectChartDemo(Demo, 'Visitors by hour');
});

const renderChart = (ui: React.ReactElement) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>{ui}</ChartThemeProvider>
    </PlocksProvider>
  );

test('lays out a cell per x/y pair, fills gaps as empty, and honours getCellProps', () => {
  const { container, getByText } = renderChart(
    <MatrixChart
      w={300}
      data={[
        { x: 'a', y: 'r1', value: 0 },
        { x: 'b', y: 'r1', value: 10 },
        { x: 'a', y: 'r2', value: 5 },
      ]}
      colors={['#000000', '#ffffff']}
      emptyColor="#123456"
      getCellProps={(cell) => (cell.value === 10 ? { stroke: '#ff00ff' } : undefined)}
    />
  );
  const cells = Array.from(container.querySelectorAll('[data-testid^="matrix-cell-"]'));
  expect(cells).toHaveLength(4);
  const fills = cells.map((c) => c.getAttribute('fill'));
  expect(fills).toContain('#000000');
  expect(fills).toContain('#ffffff');
  expect(fills).toContain('#123456');
  expect(cells.find((c) => c.getAttribute('fill') === '#ffffff')?.getAttribute('stroke')).toBe('#ff00ff');
  expect(getByText('r1')).toBeTruthy();
  expect(getByText('b')).toBeTruthy();
});
