import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ChartThemeProvider } from '../../src/theme/ChartThemeContext';
import { ChartInteractionProvider, useChartInteractionContext, useChartInteractionVolatile } from '../../src/interaction/ChartInteractionContext';
import { CandlestickChart } from '../../src/components/CandlestickChart/CandlestickChart';

const InteractionSpy: React.FC<{ onRender?: (ctx: ReturnType<typeof useChartInteractionContext>) => void }> = ({ onRender }) => {
  const ctx = useChartInteractionContext();
  const __vol = useChartInteractionVolatile();
  onRender?.({ ...ctx, ...__vol });
  return <Text testID="interaction-spy" />;
};

const SERIES = [
  {
    id: 'ohlc',
    name: 'OHLC',
    data: [
      { x: 0, open: 100, high: 110, low: 95, close: 108 },
      { x: 1, open: 108, high: 115, low: 104, close: 112 },
      { x: 2, open: 112, high: 118, low: 109, close: 111 },
      { x: 3, open: 111, high: 120, low: 110, close: 119 },
    ],
  },
];

const renderChart = (onContext?: (ctx: ReturnType<typeof useChartInteractionContext>) => void) =>
  render(
    <ChartThemeProvider>
      <ChartInteractionProvider config={{ liveTooltip: true, multiTooltip: true, pointerRAF: false }}>
        <InteractionSpy onRender={onContext} />
        <CandlestickChart series={SERIES} w={420} h={320} />
      </ChartInteractionProvider>
    </ChartThemeProvider>
  );

describe('CandlestickChart (point engine-swap)', () => {
  it('renders (off the legacy crosshair/registerSeries path) with a gesture surface', () => {
    const { getByTestId } = renderChart();
    expect(getByTestId('interaction-spy')).toBeTruthy();
    expect(getByTestId('candlestick-gesture-surface')).toBeTruthy();
  });

  it('publishes the nearest candle as an ActiveTarget (OHLC) on responder move', async () => {
    let ctxRef: ReturnType<typeof useChartInteractionContext> | null = null;
    const { getByTestId } = renderChart((ctx) => { ctxRef = ctx; });
    const surface = getByTestId('candlestick-gesture-surface');

    // Nearest-x resolution has no threshold, so any in-plot point resolves to a candle.
    fireEvent(surface, 'responderGrant', { nativeEvent: { locationX: 150, locationY: 100 } });
    fireEvent(surface, 'responderMove', { nativeEvent: { locationX: 150, locationY: 100 } });

    await waitFor(() => {
      expect(ctxRef?.pointer?.inside).toBe(true);
      expect(ctxRef?.activeTarget?.kind).toBe('point');
      expect(ctxRef?.activeSlice?.length).toBeGreaterThan(0);
      // OHLC string is the default formattedValue.
      expect(String(ctxRef?.activeTarget?.formattedValue)).toContain('O ');
    });

    fireEvent(surface, 'responderRelease', { nativeEvent: {} });
    await waitFor(() => {
      expect(ctxRef?.activeTarget?.formattedValue).toContain('O ');
      expect(ctxRef?.activeSlice?.length).toBeGreaterThan(0);
    });
  });
});

describe('CandlestickChart domain padding', () => {
  // Pixel x (container space) of the candle nearest the plot's left edge.
  const firstCandleX = async (props: Partial<React.ComponentProps<typeof CandlestickChart>>) => {
    let ctxRef: ReturnType<typeof useChartInteractionContext> | null = null;
    const { getByTestId, unmount } = render(
      <ChartThemeProvider>
        <ChartInteractionProvider config={{ liveTooltip: true, multiTooltip: true, pointerRAF: false }}>
          <InteractionSpy onRender={(ctx) => { ctxRef = ctx; }} />
          <CandlestickChart series={SERIES} w={420} h={320} {...props} />
        </ChartInteractionProvider>
      </ChartThemeProvider>
    );
    const surface = getByTestId('candlestick-gesture-surface');
    fireEvent(surface, 'responderGrant', { nativeEvent: { locationX: 0, locationY: 10 } });
    let x = NaN;
    await waitFor(() => {
      expect(ctxRef?.activeTarget?.datum).toBeTruthy();
      expect((ctxRef?.activeTarget?.datum as any).x).toBe(0);
      x = ctxRef!.activeTarget!.pixel.x;
    });
    unmount();
    return x;
  };

  it('insets the first candle from the plot edge by default, and honours an explicit inset', async () => {
    const flush = await firstCandleX({ domainPadding: 0 });
    const auto = await firstCandleX({});
    const fixed = await firstCandleX({ domainPadding: { x: 30 } });
    // Default: half a candle slot, so the first body is never cut by the y axis.
    expect(auto - flush).toBeGreaterThan(20);
    expect(fixed - flush).toBeCloseTo(30, 5);
  });

  it('maps data through an explicit xDomain', async () => {
    const flush = await firstCandleX({ domainPadding: 0 });
    const widened = await firstCandleX({ domainPadding: 0, xDomain: [-3, 3] });
    // x=0 now sits mid-plot instead of on the left edge.
    expect(widened - flush).toBeGreaterThan(100);
  });
});
