import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlocksProvider } from '../../../../../ui/src/core/theme/PlocksProvider';
import { ChartThemeProvider } from '../../../theme/ChartThemeContext';
import { ChartBrush } from '../ChartBrush';
import type { ChartBrushProps } from '../types';
import { Demo } from '../demos/basic';
import { expectChartDemo } from '../../../__web_tests__/chartDemoHarness';

// jsdom has no PointerEvent, so React would see pointer events without clientX.
const OriginalPointerEvent = (window as any).PointerEvent;
beforeAll(() => {
  if (OriginalPointerEvent) return;
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  (window as any).PointerEvent = PointerEventPolyfill;
});
afterAll(() => {
  (window as any).PointerEvent = OriginalPointerEvent;
});

const SERIES = [{ id: 'a', data: Array.from({ length: 101 }, (_, i) => ({ x: i, y: Math.sin(i / 8) })) }];

// w 208 with 8px handles leaves a 200px track: 1px = half a unit of the 0–100 domain.
const renderBrush = (props: Partial<ChartBrushProps> = {}) =>
  render(
    <PlocksProvider>
      <ChartThemeProvider>
        <ChartBrush testID="brush" w={208} h={40} series={SERIES} {...props} />
      </ChartThemeProvider>
    </PlocksProvider>
  );

const handles = () => screen.getAllByRole('slider');

test('renders its published demo', () => {
  expectChartDemo(Demo);
});

test('spans the series extent with two labelled slider handles', () => {
  renderBrush();
  const [start, end] = handles();
  expect(start.getAttribute('aria-label')).toBe('Range start');
  expect(end.getAttribute('aria-label')).toBe('Range end');
  expect(start.getAttribute('aria-valuemin')).toBe('0');
  expect(start.getAttribute('aria-valuenow')).toBe('0');
  expect(end.getAttribute('aria-valuenow')).toBe('100');
  expect(end.getAttribute('aria-valuemax')).toBe('100');
  // The handles never cross: each one's range ends at the other's value less a step.
  expect(start.getAttribute('aria-valuemax')).toBe('99');
  expect(end.getAttribute('aria-valuemin')).toBe('1');
});

test('dragging the end handle resizes the window and settles on release', () => {
  const onChange = jest.fn();
  const onChangeEnd = jest.fn();
  renderBrush({ onChange, onChangeEnd });
  const end = screen.getByTestId('brush-end');
  fireEvent.pointerDown(end, { clientX: 300, pointerId: 1 });
  fireEvent.pointerMove(end, { clientX: 200, pointerId: 1 });
  expect(onChange).toHaveBeenLastCalledWith([0, 50]);
  expect(onChangeEnd).not.toHaveBeenCalled();
  fireEvent.pointerUp(end, { clientX: 200, pointerId: 1 });
  expect(onChangeEnd).toHaveBeenCalledWith([0, 50]);
  expect(handles()[1].getAttribute('aria-valuenow')).toBe('50');
});

test('dragging the window pans it and stops at the data edge', () => {
  const onChange = jest.fn();
  renderBrush({ defaultValue: [0, 20], onChange });
  const windowEl = screen.getByTestId('brush-window');
  fireEvent.pointerDown(windowEl, { clientX: 10 });
  fireEvent.pointerMove(windowEl, { clientX: 60 });
  expect(onChange).toHaveBeenLastCalledWith([25, 45]);
  fireEvent.pointerMove(windowEl, { clientX: 1000 });
  expect(onChange).toHaveBeenLastCalledWith([80, 100]);
  fireEvent.pointerUp(windowEl, { clientX: 1000 });
});

test('pressing the strip centers the window there', () => {
  const onChange = jest.fn();
  renderBrush({ defaultValue: [0, 20], onChange });
  // jsdom lays the strip out at the origin, so clientX is the strip x: 4 + 100 = value 50.
  fireEvent.pointerDown(screen.getByTestId('brush'), { clientX: 104 });
  expect(onChange).toHaveBeenLastCalledWith([40, 60]);
});

test('keyboard: arrows step, Shift steps ten, Home/End jump, handles never cross', () => {
  const onChange = jest.fn();
  renderBrush({ step: 1, onChange });
  const [start, end] = handles();
  fireEvent.keyDown(start, { key: 'ArrowRight' });
  expect(onChange).toHaveBeenLastCalledWith([1, 100]);
  fireEvent.keyDown(start, { key: 'ArrowRight', shiftKey: true });
  expect(onChange).toHaveBeenLastCalledWith([11, 100]);
  fireEvent.keyDown(end, { key: 'Home' });
  expect(onChange).toHaveBeenLastCalledWith([11, 12]);
  fireEvent.keyDown(start, { key: 'End' });
  expect(onChange).toHaveBeenLastCalledWith([11, 12]);
  expect(onChange).toHaveBeenCalledTimes(3);
  fireEvent.keyDown(end, { key: 'End' });
  fireEvent.keyDown(start, { key: 'Home' });
  expect(onChange).toHaveBeenLastCalledWith([0, 100]);
});

test('band mode selects inclusive category indices', () => {
  const onChange = jest.fn();
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  renderBrush({ band: true, domain: [0, 5], previewType: 'bar', formatValue: (i) => labels[i], onChange, series: [] });
  const [start, end] = handles();
  expect(end.getAttribute('aria-valuenow')).toBe('5');
  expect(end.getAttribute('aria-valuetext')).toBe('Jun');
  fireEvent.keyDown(end, { key: 'ArrowLeft' });
  expect(onChange).toHaveBeenLastCalledWith([0, 4]);
  fireEvent.keyDown(start, { key: 'End' });
  // A single category is the smallest window.
  expect(onChange).toHaveBeenLastCalledWith([4, 4]);
  expect(handles()[0].getAttribute('aria-valuetext')).toBe('May');
});

test('a controlled value only changes when the prop does', () => {
  const onChange = jest.fn();
  renderBrush({ value: [10, 30], onChange, step: 1 });
  fireEvent.keyDown(handles()[1], { key: 'ArrowRight' });
  expect(onChange).toHaveBeenLastCalledWith([10, 31]);
  expect(handles()[1].getAttribute('aria-valuenow')).toBe('30');
});

test('disabled ignores keys and leaves the handles out of the tab order', () => {
  const onChange = jest.fn();
  renderBrush({ disabled: true, onChange });
  fireEvent.keyDown(handles()[0], { key: 'ArrowRight' });
  expect(onChange).not.toHaveBeenCalled();
  expect(handles()[0].getAttribute('tabindex')).toBe('-1');
});
