import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  a11yProps,
  createThemedStyles,
  onColor,
  resolveRadius,
  resolveSpacing,
  useTheme,
  webStyle,
  Text,
} from '@plocks/ui';
import type { PlocksTheme } from '@plocks/ui';
import type { TimePickerPresetGroup, TimePickerPresets, TimePickerValue } from './types';

const PRESET_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const pad = (n: number) => n.toString().padStart(2, '0');

/** Parses a 24-hour `HH:mm` / `HH:mm:ss` preset; `null` when it isn't a valid time. */
export function parsePresetTime(text: string, withSeconds: boolean): TimePickerValue | null {
  const match = text.trim().match(PRESET_PATTERN);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, ...(withSeconds ? { seconds } : {}) };
}

/** A time as the panel shows it: `13:30`, `01:30 PM`, `13:30:15`. */
export function formatPresetTime(value: TimePickerValue, format: 12 | 24, withSeconds: boolean): string {
  const hours = format === 12 ? ((value.hours + 11) % 12) + 1 : value.hours;
  const base = `${pad(hours)}:${pad(value.minutes)}${withSeconds ? `:${pad(value.seconds ?? 0)}` : ''}`;
  return format === 12 ? `${base} ${value.hours >= 12 ? 'PM' : 'AM'}` : base;
}

const isGrouped = (presets: TimePickerPresets): presets is TimePickerPresetGroup[] =>
  presets.length > 0 && typeof presets[0] === 'object';

const sameTime = (a: TimePickerValue, b: TimePickerValue | null | undefined, withSeconds: boolean) =>
  !!b && a.hours === b.hours && a.minutes === b.minutes && (!withSeconds || (a.seconds ?? 0) === (b.seconds ?? 0));

export interface TimePresetsProps {
  presets: TimePickerPresets;
  format: 12 | 24;
  withSeconds: boolean;
  /** The current time; the matching preset shows as pressed. */
  value: TimePickerValue | null | undefined;
  onSelect: (value: TimePickerValue) => void;
  disabled?: boolean;
}

const getStyles = createThemedStyles((theme: PlocksTheme) => {
  const styles = StyleSheet.create({
    root: { marginTop: resolveSpacing(theme, 'md') as number, gap: resolveSpacing(theme, 'sm') as number, alignSelf: 'stretch' },
    row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: resolveSpacing(theme, 'xs') as number },
    groupLabel: { color: theme.text.secondary, textAlign: 'center', marginBottom: resolveSpacing(theme, 'xs') as number },
    button: {
      paddingHorizontal: resolveSpacing(theme, 'sm') as number,
      paddingVertical: resolveSpacing(theme, 'xs') as number,
      borderRadius: resolveRadius(theme, 'md'),
      borderWidth: 1,
      borderColor: theme.backgrounds.borderStrong,
    },
    pressed: { backgroundColor: theme.backgrounds.pressed },
    active: { backgroundColor: theme.colors.primary[5], borderColor: theme.colors.primary[5] },
    text: { color: theme.text.primary },
    textActive: { color: theme.text.onPrimary ?? onColor(theme, theme.colors.primary[5]) },
    dimmed: { opacity: 0.5 },
  });
  return styles;
});

/**
 * Preset time buttons for TimePicker / TimePickerInput. Each preset is a
 * button (`aria-pressed` when it matches the value) inside a group named
 * "Presets", or named by its heading when the presets are grouped.
 * @internal
 */
export function TimePresets({ presets, format, withSeconds, value, onSelect, disabled = false }: TimePresetsProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  const groups = useMemo(() => {
    const list: TimePickerPresetGroup[] = isGrouped(presets)
      ? presets
      : [{ label: '', values: presets as string[] }];
    return list.map((group) => ({
      label: group.label,
      times: group.values
        .map((text) => parsePresetTime(text, withSeconds))
        .filter((time): time is TimePickerValue => time !== null),
    }));
  }, [presets, withSeconds]);

  if (!groups.some((group) => group.times.length > 0)) return null;

  const renderButtons = (times: TimePickerValue[]) =>
    times.map((time) => {
      const label = formatPresetTime(time, format, withSeconds);
      const active = sameTime(time, value, withSeconds);
      return (
        <Pressable
          key={label}
          onPress={() => onSelect(time)}
          disabled={disabled}
          {...a11yProps({ role: 'button', label, pressed: active, disabled })}
          style={({ pressed }) => [
            styles.button,
            active ? styles.active : pressed && !disabled ? styles.pressed : null,
            disabled ? styles.dimmed : null,
            webStyle({ cursor: disabled ? 'not-allowed' : 'pointer' }),
          ]}
        >
          <Text size="sm" fw={active ? 'semibold' : 'medium'} style={active ? styles.textActive : styles.text}>
            {label}
          </Text>
        </Pressable>
      );
    });

  return (
    <View style={styles.root}>
      {groups.map((group, index) =>
        group.times.length === 0 ? null : (
          <View key={`${group.label}-${index}`} {...a11yProps({ role: 'group', label: group.label || 'Presets' })}>
            {group.label ? (
              <Text
                size="xs"
                fw="semibold"
                style={styles.groupLabel}
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {group.label}
              </Text>
            ) : null}
            <View style={styles.row}>{renderButtons(group.times)}</View>
          </View>
        )
      )}
    </View>
  );
}
