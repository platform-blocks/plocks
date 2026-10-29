import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { render, configure } from '@testing-library/react-native';

import { DEFAULT_THEME } from '../../../core/theme/defaultTheme';
import { resolveVariantRoles } from '../../../core/theme/variantRoles';
import { Icon } from '../../Icon';
import { Checkbox } from '../Checkbox';

// The visual label is hidden from native screen readers (the control's own
// accessible name carries it), so text queries must include hidden elements.
configure({ defaultIncludeHiddenElements: true });

const flatStyle = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) || {};

type StyleNode = { props?: { style?: unknown }; children?: unknown };

/** Every flattened style in a rendered tree, depth first. */
const collectStyles = (node: unknown): Record<string, unknown>[] => {
  if (!node || typeof node !== 'object') return [];
  const { props, children } = node as StyleNode;
  const own = props?.style ? [StyleSheet.flatten(props.style as never) as Record<string, unknown>] : [];
  const nested = Array.isArray(children) ? children.flatMap(collectStyles) : [];
  return [...own, ...nested];
};

describe('Checkbox rendering', () => {
  it('renders label and description text when provided', () => {
    const { getByText } = render(<Checkbox label="Marketing" description="Choose if you agree" />);

    expect(getByText('Marketing')).toBeTruthy();
    expect(getByText('Choose if you agree')).toBeTruthy();
  });

  it('shows the error text when the error prop is set', () => {
    const { getByText } = render(<Checkbox label="Terms" error="Required field" />);

    expect(getByText('Required field')).toBeTruthy();
  });

  it('renders custom children in place of label content', () => {
    const { getByTestId, queryByText } = render(
      <Checkbox>
        <Text testID="custom-label">Custom Label</Text>
      </Checkbox>
    );

    expect(getByTestId('custom-label')).toBeTruthy();
    expect(queryByText('Custom Label')).toBeTruthy();
  });

  it('renders a custom indeterminate icon when provided', () => {
    const { getByTestId } = render(
      <Checkbox indeterminate indeterminateIcon={<Text testID="dash">-</Text>} />
    );

    expect(getByTestId('dash')).toBeTruthy();
  });

  it('forwards labelProps to the label Text', () => {
    const { getByText } = render(
      <Checkbox label="Custom" labelProps={{ style: { fontWeight: '700', letterSpacing: 2 } }} />
    );
    expect(flatStyle(getByText('Custom'))).toMatchObject({ fontWeight: '700', letterSpacing: 2 });
  });

  it('forwards descriptionProps to the description Text', () => {
    const { getByText } = render(
      <Checkbox label="Custom" description="Helpful copy" descriptionProps={{ style: { fontStyle: 'italic' } }} />
    );
    expect(flatStyle(getByText('Helpful copy'))).toMatchObject({ fontStyle: 'italic' });
  });

  it.each(['left', 'right', 'top', 'bottom'] as const)('renders the label at labelPosition="%s"', (position) => {
    const { getByText, getByRole } = render(<Checkbox label="Placed" labelPosition={position} />);
    expect(getByText('Placed')).toBeTruthy();
    expect(getByRole('checkbox')).toBeTruthy();
  });
});

describe('Checkbox variants', () => {
  it('fills a checked box with the accent by default', () => {
    const { toJSON, UNSAFE_getByType } = render(<Checkbox label="Filled" defaultChecked transitionDuration={0} />);

    const backgrounds = collectStyles(toJSON()).map((style) => style.backgroundColor);
    expect(backgrounds).toContain(DEFAULT_THEME.colors.primary[5]);
    expect(UNSAFE_getByType(Icon).props.color).not.toBe(DEFAULT_THEME.colors.primary[5]);
  });

  it('tints a checked light box with the shared light fill and draws the mark in the accent', () => {
    const roles = resolveVariantRoles(DEFAULT_THEME, { variant: 'light', color: 'success' });
    const { toJSON, UNSAFE_getByType } = render(
      <Checkbox label="Light" variant="light" color="success" defaultChecked transitionDuration={0} />
    );

    const styles = collectStyles(toJSON());
    expect(roles.fill).toMatch(/^rgba\(/);
    expect(styles.map((style) => style.backgroundColor)).toContain(roles.fill);
    expect(styles.map((style) => style.backgroundColor)).not.toContain(DEFAULT_THEME.colors.success[5]);
    // No edge of its own: the border takes the tint too.
    expect(styles.map((style) => style.borderColor)).toContain(roles.fill);
    expect(UNSAFE_getByType(Icon).props.color).toBe(roles.text);
  });

  it('keeps the light tint for an indeterminate box', () => {
    const roles = resolveVariantRoles(DEFAULT_THEME, { variant: 'light', color: 'primary' });
    const { toJSON, UNSAFE_getByType } = render(<Checkbox label="Mixed" variant="light" indeterminate transitionDuration={0} />);

    expect(collectStyles(toJSON()).map((style) => style.backgroundColor)).toContain(roles.fill);
    expect(UNSAFE_getByType(Icon).props).toMatchObject({ name: 'minus', color: roles.text });
  });

  it('draws a disabled light box exactly like a disabled filled one', () => {
    const light = render(<Checkbox label="Off" variant="light" disabled defaultChecked transitionDuration={0} />);
    const filled = render(<Checkbox label="Off" disabled defaultChecked transitionDuration={0} />);

    expect(collectStyles(light.toJSON())).toEqual(collectStyles(filled.toJSON()));
  });
});
