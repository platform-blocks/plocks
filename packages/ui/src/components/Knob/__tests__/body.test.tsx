/**
 * Knob - the body engine (shapes, rotation, finishes, grip, cap, skirt, shadows), the
 * pointer shapes, and tick glow.
 *
 * Geometry is checked through the pure builders; rendering through the emitted SVG
 * primitives, each stubbed as a View tagged with its element name.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import * as bodyUtils from '../utils/body';

jest.mock('react-native-svg', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  const stub = (name: string) => {
    const Component = (props: Record<string, unknown>) =>
      ReactModule.createElement(View, { ...props, testID: props.testID ?? name });
    Component.displayName = name;
    return Component;
  };
  const names = ['Svg', 'Circle', 'Line', 'Path', 'Defs', 'LinearGradient', 'RadialGradient', 'Stop'];
  return {
    __esModule: true,
    default: stub('Svg'),
    ...Object.fromEntries(names.map((name) => [name, stub(name)])),
  };
});

// Wrapped (not replaced) so the cache tests below can count how often geometry is rebuilt.
jest.mock('../utils/body', () => {
  const actual = jest.requireActual('../utils/body');
  return {
    ...actual,
    buildBodyPath: jest.fn(actual.buildBodyPath),
    buildCirclePath: jest.fn(actual.buildCirclePath),
    buildGripMarks: jest.fn(actual.buildGripMarks),
  };
});

import { Knob } from '../Knob';
import type { KnobProps, KnobVariant } from '../types';
import {
  buildBodyPath,
  buildChickenheadPath,
  buildFlutedPath,
  buildGripMarks,
  buildPolygonPath,
  getShadingGradients,
} from '../utils/body';

const SIZE = 200;

const renderKnob = (props: Partial<KnobProps>) =>
  render(<Knob accessibilityLabel="knob" size={SIZE} min={0} max={100} {...props} />);

const pathsOf = (utils: ReturnType<typeof render>) =>
  utils.queryAllByTestId('Path').map((node) => node.props.d as string);

describe('body geometry', () => {
  it('draws a polygon with one vertex per side', () => {
    const path = buildPolygonPath(100, 100, 50, 6, 0);
    expect(path.match(/L/g)).toHaveLength(5);
    // The first vertex sits at 12 o'clock.
    expect(path.startsWith('M 100 50')).toBe(true);
  });

  it('draws one scalloped curve per flute', () => {
    expect(buildFlutedPath(100, 100, 50, 12, 0.08, 0).match(/Q/g)).toHaveLength(12);
  });

  it('aims the chickenhead tip at the given angle', () => {
    const up = buildChickenheadPath(100, 100, 50, 0);
    const right = buildChickenheadPath(100, 100, 50, 90);
    // The tip's control point (the second Q coordinate pair) reaches past the radius.
    const tip = (path: string) => path.split('Q ')[1].split(' ').slice(0, 2).map(Number);

    const [ux, uy] = tip(up);
    expect(ux).toBeCloseTo(100, 1);
    expect(uy).toBeLessThan(50);

    const [rx, ry] = tip(right);
    expect(rx).toBeGreaterThan(150);
    expect(ry).toBeCloseTo(100, 1);
  });

  it('turns grip marks with the rotation', () => {
    const still = buildGripMarks('knurl', 100, 100, 50, 4, 0.1, 0);
    const turned = buildGripMarks('knurl', 100, 100, 50, 4, 0.1, 45);
    expect(still[0]).not.toEqual(turned[0]);
    expect(buildGripMarks('dots', 100, 100, 50, 8, 0.1, 0)[0].kind).toBe('dot');
  });

  it('falls back to a circle and ignores rotation for it', () => {
    const opts = { sides: 8, fluteDepth: 0.08, rotation: 0 };
    expect(buildBodyPath('circle', 100, 100, 50, opts)).toBe(
      buildBodyPath('circle', 100, 100, 50, { ...opts, rotation: 90 })
    );
  });

  it('has lighting overlays for every finish but flat', () => {
    expect(getShadingGradients('flat')).toHaveLength(0);
    (['dome', 'concave', 'matte', 'metal', 'brushed'] as const).forEach((shading) => {
      expect(getShadingGradients(shading).length).toBeGreaterThan(0);
    });
  });
});

describe('body rendering', () => {
  it('turns a fluted body with the value', () => {
    const body = { shape: 'fluted' as const, sides: 10 };
    const low = pathsOf(renderKnob({ value: 0, appearance: { body } }));
    const high = pathsOf(renderKnob({ value: 50, appearance: { body } }));
    expect(low[0]).not.toEqual(high[0]);
  });

  it('holds a body still when rotation is turned off', () => {
    const body = { shape: 'polygon' as const, sides: 6, rotates: false };
    const low = pathsOf(renderKnob({ value: 0, appearance: { body } }));
    const high = pathsOf(renderKnob({ value: 50, appearance: { body } }));
    expect(low[0]).toEqual(high[0]);
  });

  it('defines a gradient for each lighting overlay', () => {
    const utils = renderKnob({ appearance: { body: { shading: 'dome', cap: { shading: 'concave' } } } });
    expect(utils.queryAllByTestId('RadialGradient')).toHaveLength(1);
    expect(utils.queryAllByTestId('LinearGradient')).toHaveLength(1);
  });

  it('draws the grip marks around the rim', () => {
    const utils = renderKnob({ appearance: { body: { grip: { style: 'knurl', count: 24 } }, ring: false } });
    expect(utils.queryAllByTestId('Line')).toHaveLength(24);
  });

  it('fakes a soft shadow with stacked layers, and none without blur', () => {
    const soft = renderKnob({ appearance: { body: { shadow: { blur: 8 } }, ring: false } });
    const hard = renderKnob({ appearance: { body: { shadow: { blur: 0 } }, ring: false } });
    // Shadow layers plus the body itself.
    expect(pathsOf(soft).length - pathsOf(hard).length).toBe(4);
  });

  it('draws nothing for `body: false`, and no track for `ring: false`', () => {
    const utils = renderKnob({ appearance: { body: false, ring: false } });
    expect(pathsOf(utils)).toHaveLength(0);
  });

  it('renders every variant without throwing', () => {
    const variants: KnobVariant[] = [
      'default', 'minimal', 'outline', 'material', 'studio', 'neumorphic', 'digital', 'segmented',
      'led-ring', 'gauge', 'retro', 'knurled', 'encoder', 'soft-touch', 'chickenhead', 'skirted', 'fluted',
    ];
    variants.forEach((variant) => {
      expect(() => renderKnob({ variant, value: 40 }).unmount()).not.toThrow();
    });
  });
});

describe('pointer shapes', () => {
  const pointerNodes = (shape: NonNullable<NonNullable<KnobProps['appearance']>['pointer']>) => {
    const utils = renderKnob({ value: 25, appearance: { body: false, ring: false, thumb: false, pointer: shape } });
    return {
      lines: utils.queryAllByTestId('Line').length,
      circles: utils.queryAllByTestId('Circle').length,
      paths: utils.queryAllByTestId('Path').length,
    };
  };

  it('draws each shape with its own primitives', () => {
    expect(pointerNodes({ shape: 'line' })).toEqual({ lines: 1, circles: 0, paths: 0 });
    expect(pointerNodes({ shape: 'notch' })).toEqual({ lines: 2, circles: 0, paths: 0 });
    expect(pointerNodes({ shape: 'dot' })).toEqual({ lines: 0, circles: 1, paths: 0 });
    expect(pointerNodes({ shape: 'dimple' })).toEqual({ lines: 0, circles: 3, paths: 0 });
    expect(pointerNodes({ shape: 'triangle' })).toEqual({ lines: 0, circles: 0, paths: 1 });
    expect(pointerNodes({ shape: 'needle', counterweight: { size: 10 } })).toEqual({ lines: 0, circles: 1, paths: 1 });
  });

  it('starts a line at its inset', () => {
    const utils = renderKnob({ value: 0, appearance: { body: false, thumb: false, pointer: { inset: 30, length: 80 } } });
    const line = utils.getAllByTestId('Line')[0];
    // At 12 o'clock the arm runs straight up from cy - inset.
    expect(line.props.y1).toBeCloseTo(SIZE / 2 - 30);
    expect(line.props.y2).toBeCloseTo(SIZE / 2 - 80);
  });
});

describe('tick glow', () => {
  const ticks = (glow?: { intensity?: number }) => ({
    source: 'count' as const,
    count: 5,
    shape: 'line' as const,
    activeMode: 'fill' as const,
    glow,
  });

  it('haloes only the lit ticks', () => {
    const plain = renderKnob({ value: 50, appearance: { ticks: ticks() } });
    const glowing = renderKnob({ value: 50, appearance: { ticks: ticks({ intensity: 1 }) } });
    // Three of five ticks are lit at 50, each gaining three halo strokes.
    expect(glowing.queryAllByTestId('Line').length - plain.queryAllByTestId('Line').length).toBe(9);
  });

  it('drops the glow while disabled', () => {
    const plain = renderKnob({ value: 50, disabled: true, appearance: { ticks: ticks() } });
    const glowing = renderKnob({ value: 50, disabled: true, appearance: { ticks: ticks({ intensity: 1 }) } });
    expect(glowing.queryAllByTestId('Line')).toHaveLength(plain.queryAllByTestId('Line').length);
  });
});

describe('body caching', () => {
  const spies = bodyUtils as unknown as Record<'buildBodyPath' | 'buildCirclePath' | 'buildGripMarks', jest.Mock>;
  const rerenderAt = (appearance: () => NonNullable<KnobProps['appearance']>) => {
    const utils = renderKnob({ value: 10, appearance: appearance() });
    [spies.buildBodyPath, spies.buildCirclePath, spies.buildGripMarks].forEach((spy) => spy.mockClear());
    utils.rerender(<Knob accessibilityLabel="knob" size={SIZE} min={0} max={100} value={60} appearance={appearance()} />);
    return utils;
  };

  it('rebuilds nothing for a body that does not turn', () => {
    // A fresh (but identical) appearance object each render, the way inline props arrive.
    rerenderAt(() => ({ body: { shading: 'dome', cap: { shading: 'brushed' }, skirt: { ratio: 1.2 }, shadow: { blur: 6 } } }));

    expect(spies.buildBodyPath).not.toHaveBeenCalled();
    expect(spies.buildCirclePath).not.toHaveBeenCalled();
  });

  it('rebuilds only the turning outline and grip, not the cap or skirt', () => {
    rerenderAt(() => ({
      body: { grip: { style: 'knurl', count: 40 }, cap: { ratio: 0.7 }, skirt: { ratio: 1.2 } },
    }));

    expect(spies.buildBodyPath).toHaveBeenCalledTimes(1);
    expect(spies.buildGripMarks).toHaveBeenCalledTimes(1);
    expect(spies.buildCirclePath).not.toHaveBeenCalled();
  });

  it('rebuilds when the look itself changes', () => {
    const utils = renderKnob({ value: 10, appearance: { body: { color: '#111111' } } });
    spies.buildBodyPath.mockClear();
    utils.rerender(
      <Knob accessibilityLabel="knob" size={SIZE} min={0} max={100} value={10} appearance={{ body: { color: '#222222' } }} />
    );

    expect(spies.buildBodyPath).toHaveBeenCalledTimes(1);
  });
});
