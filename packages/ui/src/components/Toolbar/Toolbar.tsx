import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { a11yProps } from '../../core/accessibility/a11yProps';
import { getNodeText, useA11yId } from '../../core/accessibility/useA11yId';
import { useRovingFocus, type RovingItemProps } from '../../core/accessibility/useRovingFocus';
import { factory, withStatics } from '../../core/factory';
import { useIsomorphicLayoutEffect } from '../../core/hooks/useIsomorphicLayoutEffect';
import { webProps, webStyle } from '../../core/platform';
import type { RadiusValue } from '../../core/theme/radius';
import { resolveAccentColor } from '../../core/theme/resolveColors';
import type { SizeValue } from '../../core/theme/sizes';
import { useTheme } from '../../core/theme/ThemeProvider';
import { getControlSize, onColor, resolveRadius } from '../../core/theme/tokens';
import type { PlocksTheme } from '../../core/theme/types';
import { resolveVariantRoles } from '../../core/theme/variantRoles';
import { extractLayoutProps, getLayoutStyles } from '../../core/utils/layout';
import { warnOnce } from '../../core/utils/logger';
import { useMergedRef } from '../../core/utils/mergeRefs';
import { extractStyleProps, resolveStyleProps, useStyleProps } from '../../core/utils/spacing';
import { useControllableState } from '../../hooks/useControllableState';
import { useHover } from '../../hooks/useHover/useHover';
import { resolveRoleColor } from '../Button/styles';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text';
import type {
  ToolbarDividerProps,
  ToolbarOrientation,
  ToolbarProps,
  ToolbarToggleBaseProps,
  ToolbarToggleGroupProps,
  ToolbarToggleItemProps,
  ToolbarToggleProps,
  ToolbarToggleValue,
  ToolbarVariant,
} from './types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ToolbarItemRecord {
  id: string;
  node: unknown;
  disabled: boolean;
}

interface ToolbarContextValue {
  orientation: ToolbarOrientation;
  variant: ToolbarVariant;
  color?: string;
  size: SizeValue;
  /** Radius for toggles: the toolbar's, less its padding, so the corners nest. */
  radius: number;
  gap: number;
  /** Adds a toggle to the roving tab order; returns the matching removal. */
  register: (record: ToolbarItemRecord) => () => void;
  /** Roving props for a registered toggle, or nothing until it has registered. */
  getItemProps: (id: string) => RovingItemProps | undefined;
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null);
ToolbarContext.displayName = 'ToolbarContext';

interface ToolbarGroupContextValue {
  isActive: (value: ToolbarToggleValue) => boolean;
  toggle: (value: ToolbarToggleValue) => void;
  disabled: boolean;
}

const ToolbarGroupContext = createContext<ToolbarGroupContextValue | null>(null);
ToolbarGroupContext.displayName = 'ToolbarGroupContext';

/** Sort registered toggles by their place in the DOM (web); registration order elsewhere. */
function byDocumentOrder(a: ToolbarItemRecord, b: ToolbarItemRecord): number {
  const na = a.node as { compareDocumentPosition?: (other: unknown) => number } | null;
  const nb = b.node as object | null;
  if (na && nb && typeof na.compareDocumentPosition === 'function') {
    const position = na.compareDocumentPosition(nb);
    // 4 = DOCUMENT_POSITION_FOLLOWING, 2 = DOCUMENT_POSITION_PRECEDING
    if (position & 4) return -1;
    if (position & 2) return 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Toggle rendering (shared by Toolbar.Toggle and Toolbar.ToggleItem)
// ---------------------------------------------------------------------------

interface ToggleStyleParams {
  theme: PlocksTheme;
  active: boolean;
  hovered: boolean;
  disabled: boolean;
  size: SizeValue;
  color?: string;
  variant: ToolbarVariant;
  radius: number;
  square: boolean;
}

function getToolbarToggleStyle({
  theme,
  active,
  hovered,
  disabled,
  size,
  color,
  variant,
  radius,
  square,
}: ToggleStyleParams): { box: ViewStyle; contentColor: string } {
  const control = getControlSize(theme, size);
  const roleColor = resolveRoleColor(theme, color);

  let fill = 'transparent';
  let contentColor = disabled ? theme.text.disabled : theme.text.primary;
  if (active) {
    if (variant === 'filled') {
      fill = resolveAccentColor(theme, color ?? 'primary') ?? theme.text.link;
      contentColor = onColor(theme, fill);
    } else {
      const roles = resolveVariantRoles(theme, { variant: 'light', color: roleColor });
      fill = roles.fill;
      contentColor = roles.text;
    }
  } else if (hovered && !disabled) {
    fill = theme.backgrounds.hover;
  }

  const box: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: control.height,
    minWidth: control.height,
    paddingHorizontal: square ? 0 : control.paddingX,
    borderRadius: radius,
    backgroundColor: fill,
    opacity: disabled ? 0.5 : 1,
  };

  return { box, contentColor };
}

interface ToolbarToggleBaseInternalProps extends ToolbarToggleBaseProps {
  active: boolean;
  onActivate: () => void;
  /** Disabled by the enclosing group. */
  groupDisabled?: boolean;
}

const ToolbarToggleBase = React.forwardRef<View, ToolbarToggleBaseInternalProps>((props, ref) => {
  const { styleProps, otherProps } = extractStyleProps(props);
  const {
    active,
    onActivate,
    groupDisabled = false,
    icon,
    children,
    disabled: disabledProp,
    autoWidth = false,
    size: sizeProp,
    color: colorProp,
    variant: variantProp,
    radius: radiusProp,
    accessibilityLabel,
    style,
    testID,
    ...rest
  } = otherProps;

  const theme = useTheme();
  const toolbar = useContext(ToolbarContext);
  const [hovered, hoverHandlers] = useHover();
  const id = useA11yId(undefined, 'plocks-toolbar');

  const disabled = disabledProp ?? groupDisabled;
  const size = sizeProp ?? toolbar?.size ?? 'md';
  const color = colorProp ?? toolbar?.color;
  const variant = variantProp ?? toolbar?.variant ?? 'light';
  const control = getControlSize(theme, size);
  const radius = radiusProp !== undefined ? resolveRadius(theme, radiusProp as RadiusValue) : (toolbar?.radius ?? control.radius);

  const text = getNodeText(children);
  const hasText = text.length > 0 && (typeof children === 'string' || typeof children === 'number');
  const square = !autoWidth && !hasText;

  const { box, contentColor } = useMemo(
    () => getToolbarToggleStyle({ theme, active, hovered, disabled, size, color, variant, radius, square }),
    [theme, active, hovered, disabled, size, color, variant, radius, square]
  );

  // Roving tab order across the whole toolbar.
  const nodeRef = useRef<View | null>(null);
  const register = toolbar?.register;
  useIsomorphicLayoutEffect(() => {
    if (!register) return;
    return register({ id, node: nodeRef.current, disabled });
  }, [register, id, disabled]);
  const roving = toolbar?.getItemProps(id);
  const mergedRef = useMergedRef<View>(ref, nodeRef, roving?.ref);

  if (!accessibilityLabel && !text) {
    warnOnce('Toolbar.Toggle.label', 'Toolbar.Toggle: a toggle without text content needs an `accessibilityLabel`.');
  }

  const iconNode = icon
    ? (
      <Icon
        {...(typeof icon === 'string' ? { name: icon } : { icon })}
        size={Math.round(control.height * 0.5)}
        color={contentColor}
      />
    )
    : null;

  return (
    <Pressable
      {...a11yProps({ role: 'button', pressed: active, disabled, label: accessibilityLabel })}
      {...rest}
      {...hoverHandlers}
      ref={mergedRef}
      style={[
        box,
        resolveStyleProps(styleProps, theme),
        webStyle({ cursor: disabled ? 'not-allowed' : 'pointer' }),
        style,
      ]}
      onPress={disabled ? undefined : onActivate}
      disabled={disabled}
      testID={testID}
      onFocus={roving?.onFocus}
      {...webProps({ tabIndex: roving?.tabIndex, onKeyDown: roving?.onKeyDown })}
    >
      {iconNode}
      {hasText ? (
        <Text
          size={size}
          fw="600"
          c={contentColor}
          selectable={false}
          style={[
            { lineHeight: Math.round(control.fontSize * 1.3), textAlignVertical: 'center' },
            iconNode ? { marginStart: control.gap } : null,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
});
ToolbarToggleBase.displayName = 'ToolbarToggleBase';

// ---------------------------------------------------------------------------
// Public parts
// ---------------------------------------------------------------------------

/**
 * A toggle that manages its own state (`defaultActive`) or is driven by
 * `active` + `onActiveChange`. Exposed as a button with `aria-pressed`.
 */
export const ToolbarToggle = factory<{ props: ToolbarToggleProps; ref: View }>((props, ref) => {
  const { active: activeProp, defaultActive, onActiveChange, onPress, ...rest } = props;
  const [active, setActive] = useControllableState<boolean>({
    value: activeProp,
    defaultValue: defaultActive,
    finalValue: false,
    onChange: onActiveChange,
  });
  const handleActivate = useCallback(() => {
    setActive(!active);
    onPress?.();
  }, [active, setActive, onPress]);
  return <ToolbarToggleBase ref={ref} {...rest} active={active} onActivate={handleActivate} />;
}, { displayName: 'Toolbar.Toggle' });

/** An item of a `Toolbar.ToggleGroup`; the group decides whether it is active. */
export const ToolbarToggleItem = factory<{ props: ToolbarToggleItemProps; ref: View }>((props, ref) => {
  const { value, ...rest } = props;
  const group = useContext(ToolbarGroupContext);
  if (!group) {
    warnOnce('Toolbar.ToggleItem.group', 'Toolbar.ToggleItem must be rendered inside a Toolbar.ToggleGroup.');
  }
  const handleActivate = useCallback(() => group?.toggle(value), [group, value]);
  return (
    <ToolbarToggleBase
      ref={ref}
      {...rest}
      active={group?.isActive(value) ?? false}
      groupDisabled={group?.disabled}
      onActivate={handleActivate}
    />
  );
}, { displayName: 'Toolbar.ToggleItem' });

const toArray = (value: ToolbarToggleValue | ToolbarToggleValue[] | null | undefined): ToolbarToggleValue[] =>
  Array.isArray(value) ? value : value != null ? [value] : [];

/**
 * Manages the active state of its `Toolbar.ToggleItem`s. `type="single"` (the
 * default) keeps one item active and deselects it when pressed again, reporting
 * `null`; `type="multiple"` reports the array of active values.
 */
export const ToolbarToggleGroup = factory<{ props: ToolbarToggleGroupProps; ref: View }>((props, ref) => {
  const { styleProps, otherProps } = extractStyleProps(props);
  const { children, disabled = false, accessibilityLabel, style, testID } = otherProps;
  const theme = useTheme();
  const toolbar = useContext(ToolbarContext);
  const multiple = otherProps.type === 'multiple';

  const [value, setValue] = useControllableState<ToolbarToggleValue | ToolbarToggleValue[] | null>({
    value: otherProps.value,
    defaultValue: otherProps.defaultValue,
    finalValue: multiple ? [] : null,
    // Each branch of the union narrows the callback's argument; the resolved
    // value is always of the right shape for `type`.
    onChange: otherProps.onChange as (value: ToolbarToggleValue | ToolbarToggleValue[] | null) => void,
  });
  const active = useMemo(() => toArray(value), [value]);

  const toggle = useCallback(
    (itemValue: ToolbarToggleValue) => {
      const isActive = active.includes(itemValue);
      if (multiple) {
        setValue(isActive ? active.filter((v) => v !== itemValue) : [...active, itemValue]);
      } else {
        setValue(isActive ? null : itemValue);
      }
    },
    [active, multiple, setValue]
  );
  const isActive = useCallback((itemValue: ToolbarToggleValue) => active.includes(itemValue), [active]);

  const contextValue = useMemo<ToolbarGroupContextValue>(() => ({ isActive, toggle, disabled }), [isActive, toggle, disabled]);
  const horizontal = (toolbar?.orientation ?? 'horizontal') === 'horizontal';

  return (
    <ToolbarGroupContext.Provider value={contextValue}>
      <View
        ref={ref}
        testID={testID}
        {...a11yProps({ role: 'group', label: accessibilityLabel, disabled })}
        style={[
          { flexDirection: horizontal ? 'row' : 'column', alignItems: 'center', gap: toolbar?.gap ?? 4 },
          resolveStyleProps(styleProps, theme),
          style,
        ]}
      >
        {children}
      </View>
    </ToolbarGroupContext.Provider>
  );
}, { displayName: 'Toolbar.ToggleGroup' });

/** A hairline between toolbar sections, drawn across the toolbar's orientation. */
export const ToolbarDivider = factory<{ props: ToolbarDividerProps; ref: View }>((props, ref) => {
  const { styleProps, otherProps: { style, testID } } = extractStyleProps(props);
  const spacing = useStyleProps(styleProps);
  const theme = useTheme();
  const toolbar = useContext(ToolbarContext);
  const horizontal = (toolbar?.orientation ?? 'horizontal') === 'horizontal';
  const margin = toolbar?.gap ?? 4;
  return (
    <View
      ref={ref}
      testID={testID}
      {...a11yProps({ role: 'separator', orientation: horizontal ? 'vertical' : 'horizontal' })}
      style={[
        horizontal
          ? { width: 1, alignSelf: 'stretch', marginHorizontal: margin }
          : { height: 1, alignSelf: 'stretch', marginVertical: margin },
        { backgroundColor: theme.backgrounds.border },
        spacing,
        style,
      ]}
    />
  );
}, { displayName: 'Toolbar.Divider' });

/**
 * A group of toggles with one tab stop: arrow keys (following `orientation`,
 * mirrored under RTL) move between toggles across every group and divider,
 * Home/End jump to the ends, Space/Enter press the focused toggle.
 */
const ToolbarRoot = factory<{ props: ToolbarProps; ref: View }>((props, ref) => {
  const { styleProps, otherProps: propsAfterSpacing } = extractStyleProps(props);
  const { layoutProps, otherProps } = extractLayoutProps(propsAfterSpacing);
  const {
    children,
    orientation = 'horizontal',
    variant = 'light',
    color,
    size = 'md',
    radius: radiusProp,
    withBorder = true,
    loop = true,
    accessibilityLabel,
    style,
    testID,
  } = otherProps;

  const theme = useTheme();
  const control = getControlSize(theme, size);
  const padding = Math.max(2, Math.round(control.height * 0.1));
  const gap = padding;
  const outerRadius = radiusProp === undefined ? control.radius + padding : resolveRadius(theme, radiusProp);
  const innerRadius = Math.max(0, outerRadius - padding);

  const [items, setItems] = useState<ToolbarItemRecord[]>([]);
  const register = useCallback((record: ToolbarItemRecord) => {
    setItems((prev) => [...prev.filter((item) => item.id !== record.id), record].sort(byDocumentOrder));
    return () => setItems((prev) => prev.filter((item) => item.id !== record.id));
  }, []);

  const isDisabled = useCallback((index: number) => !!items[index]?.disabled, [items]);
  const { getItemProps } = useRovingFocus({ count: items.length, orientation, loop, isDisabled });
  const getItemPropsFor = useCallback(
    (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      return index >= 0 ? getItemProps(index) : undefined;
    },
    [items, getItemProps]
  );

  const contextValue = useMemo<ToolbarContextValue>(
    () => ({ orientation, variant, color, size, radius: innerRadius, gap, register, getItemProps: getItemPropsFor }),
    [orientation, variant, color, size, innerRadius, gap, register, getItemPropsFor]
  );

  return (
    <ToolbarContext.Provider value={contextValue}>
      <View
        ref={ref}
        testID={testID}
        {...a11yProps({ role: 'toolbar', label: accessibilityLabel, orientation })}
        style={[
          {
            flexDirection: orientation === 'horizontal' ? 'row' : 'column',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap,
            padding,
            borderRadius: outerRadius,
            borderWidth: withBorder ? 1 : 0,
            borderColor: theme.backgrounds.border,
          },
          getLayoutStyles(layoutProps),
          resolveStyleProps(styleProps, theme),
          style,
        ]}
      >
        {children}
      </View>
    </ToolbarContext.Provider>
  );
}, { displayName: 'Toolbar' });

export const Toolbar = withStatics(ToolbarRoot, {
  Toggle: ToolbarToggle,
  ToggleGroup: ToolbarToggleGroup,
  ToggleItem: ToolbarToggleItem,
  Divider: ToolbarDivider,
});
