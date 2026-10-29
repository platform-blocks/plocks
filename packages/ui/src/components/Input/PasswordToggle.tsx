import React from 'react';
import { Pressable } from 'react-native';
import { a11yProps } from '../../core/accessibility/a11yProps';
import { isWeb } from '../../core/platform';
import { webProps } from '../../core/platform/webProps';
import { webStyle } from '../../core/platform/webStyle';
import { useTheme } from '../../core/theme/ThemeProvider';
import { getControlSize } from '../../core/theme/tokens';
import type { SizeValue } from '../../core/theme/types';
import { Icon } from '../Icon';

interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
  size?: SizeValue;
  disabled?: boolean;
  /** Keep the button in the keyboard tab order. @default false */
  focusable?: boolean;
  showLabel?: string;
  hideLabel?: string;
}

/**
 * Internal show/hide password button for Input `type="password"` and
 * PasswordInput. At least a 24px target (hitSlop adds more on native); negative
 * margins keep it from growing the field.
 *
 * Out of the tab order by default (Mantine's `visibilityToggleFocusable`):
 * `tabIndex={-1}` on web, `focusable={false}` on native. It stays clickable and
 * screen readers still reach it.
 */
export function PasswordToggle({
  visible,
  onToggle,
  size = 'md',
  disabled = false,
  focusable = false,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
}: PasswordToggleProps) {
  const theme = useTheme();
  const iconSize = Math.round(getControlSize(theme, size).iconSize * 1.2);
  const box = Math.max(24, iconSize + 4);

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      {...a11yProps({ role: 'button', label: visible ? hideLabel : showLabel, disabled })}
      {...webProps({ tabIndex: focusable ? 0 : -1 })}
      // react-native-web deprecates `focusable` (tabIndex above covers it); native keeps it.
      focusable={isWeb ? undefined : focusable}
      hitSlop={8}
      style={[
        {
          minWidth: box,
          minHeight: box,
          alignItems: 'center',
          justifyContent: 'center',
          margin: -(box - iconSize) / 2,
        },
        webStyle({ cursor: disabled ? 'not-allowed' : 'pointer' }),
      ]}
    >
      <Icon name={visible ? 'eye' : 'eyeOff'} size={iconSize} color={theme.text.muted} />
    </Pressable>
  );
}
