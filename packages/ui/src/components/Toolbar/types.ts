import type React from 'react';
import type { ViewStyle } from 'react-native';

import type { BorderRadiusProps } from '../../core/theme/radius';
import type { SizeValue } from '../../core/theme/sizes';
import type { BaseProps, ColorProp, PassthroughAccessibilityProps } from '../../core/types/base';
import type { LayoutProps } from '../../core/utils/layout';
import type { ExternalIconComponent } from '../Icon/types';

export type ToolbarOrientation = 'horizontal' | 'vertical';
/** How an active toggle is drawn: a solid accent fill or a light accent tint. */
export type ToolbarVariant = 'filled' | 'light';
export type ToolbarToggleValue = string | number;
export type ToolbarToggleGroupType = 'single' | 'multiple';

type PassthroughA11yProps = Omit<PassthroughAccessibilityProps, 'accessibilityLabel'>;

export interface ToolbarProps extends BaseProps<ViewStyle>, LayoutProps, BorderRadiusProps {
  /** Toolbar content: `Toolbar.Toggle`, `Toolbar.ToggleGroup`, `Toolbar.Divider`, or any other control. */
  children: React.ReactNode;
  /** Layout direction; also decides which arrow keys move focus. */
  orientation?: ToolbarOrientation;
  /** Visual style of active toggles, inherited by every toggle inside. */
  variant?: ToolbarVariant;
  /** Accent of active toggles. A palette token, `'primary.6'` shade syntax, or any CSS color. */
  color?: ColorProp;
  /** Size of toggles, padding and gap. */
  size?: SizeValue;
  /** Draw a hairline border around the toolbar. */
  withBorder?: boolean;
  /** Wrap arrow-key focus from the last toggle to the first and back. */
  loop?: boolean;
  /** Accessible name of the toolbar. */
  accessibilityLabel?: string;
}

/** Props shared by `Toolbar.Toggle` and `Toolbar.ToggleItem`. */
export interface ToolbarToggleBaseProps extends BaseProps<ViewStyle>, BorderRadiusProps, PassthroughA11yProps {
  /** Icon to render, by registry name or as an external icon component/element. */
  icon?: string | ExternalIconComponent | React.ReactElement;
  /** Content. A string renders as a label; anything else renders as-is. */
  children?: React.ReactNode;
  /** Whether the toggle is disabled. */
  disabled?: boolean;
  /** Size the toggle to its content instead of making an icon-only toggle square. */
  autoWidth?: boolean;
  /** Size override; defaults to the toolbar's. */
  size?: SizeValue;
  /** Accent override; defaults to the toolbar's. */
  color?: ColorProp;
  /** Variant override; defaults to the toolbar's. */
  variant?: ToolbarVariant;
  /** Accessible name; required when the content isn't text (an icon-only toggle). */
  accessibilityLabel?: string;
}

export interface ToolbarToggleProps extends ToolbarToggleBaseProps {
  /** Active state (controlled). */
  active?: boolean;
  /** Initial active state (uncontrolled). */
  defaultActive?: boolean;
  /** Called with the next active state when the toggle is pressed. */
  onActiveChange?: (active: boolean) => void;
  /** Called on every press, after `onActiveChange`. */
  onPress?: () => void;
}

export interface ToolbarToggleItemProps extends ToolbarToggleBaseProps {
  /** Identifies the item within its `Toolbar.ToggleGroup`. */
  value: ToolbarToggleValue;
}

interface ToolbarToggleGroupBaseProps extends BaseProps<ViewStyle> {
  /** `Toolbar.ToggleItem` components. */
  children: React.ReactNode;
  /** Disables every item in the group. */
  disabled?: boolean;
  /** Accessible name of the group. */
  accessibilityLabel?: string;
}

export interface ToolbarSingleToggleGroupProps extends ToolbarToggleGroupBaseProps {
  /** One active item at a time; pressing the active item deselects it. */
  type?: 'single';
  /** Active value (controlled). */
  value?: ToolbarToggleValue | null;
  /** Initial active value (uncontrolled). */
  defaultValue?: ToolbarToggleValue | null;
  /** Called with the next value, or `null` when the active item is deselected. */
  onChange?: (value: ToolbarToggleValue | null) => void;
}

export interface ToolbarMultipleToggleGroupProps extends ToolbarToggleGroupBaseProps {
  /** Any number of active items. */
  type: 'multiple';
  /** Active values (controlled). */
  value?: ToolbarToggleValue[];
  /** Initial active values (uncontrolled). */
  defaultValue?: ToolbarToggleValue[];
  /** Called with the array of active values. */
  onChange?: (value: ToolbarToggleValue[]) => void;
}

export type ToolbarToggleGroupProps = ToolbarSingleToggleGroupProps | ToolbarMultipleToggleGroupProps;

export type ToolbarDividerProps = BaseProps<ViewStyle>;
