import React from 'react';
import type { ComponentType, CSSProperties } from 'react';

import { resolveFontSize, resolveRadius, resolveSpacing, useTheme } from '@plocks/ui';
import type { NativeSelectProps } from './levelSelect';

/**
 * A real `<select>` for the calendar header (`withNativeLevelSelect`): the
 * browser's own picker, keyboard and screen-reader support.
 * @internal
 */
function WebNativeSelect({ label, value, options, onChange, disabled = false, nodeRef, testID }: NativeSelectProps) {
  const theme = useTheme();
  const style: CSSProperties = {
    fontFamily: theme.fontFamily,
    fontSize: resolveFontSize(theme, 'md'),
    fontWeight: 600,
    color: theme.text.primary,
    backgroundColor: 'transparent',
    colorScheme: theme.colorScheme,
    border: `1px solid ${theme.backgrounds.borderStrong}`,
    borderRadius: resolveRadius(theme, 'md'),
    paddingBlock: Number(resolveSpacing(theme, 'xs')) || 4,
    paddingInline: Number(resolveSpacing(theme, 'sm')) || 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <select
      ref={(node) => {
        if (nodeRef) nodeRef.current = node;
      }}
      aria-label={label}
      value={String(value)}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      data-testid={testID}
      style={style}
    >
      {options.map((option) => (
        <option key={option.value} value={String(option.value)} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export const NativeSelect: ComponentType<NativeSelectProps> | null = WebNativeSelect;
