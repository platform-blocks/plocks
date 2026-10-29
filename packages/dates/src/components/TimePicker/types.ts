import type { BaseProps } from '@plocks/ui';

export interface TimePickerValue {
  hours: number; // 0-23 internal
  minutes: number; // 0-59
  seconds?: number; // 0-59
}

/** A labelled group of preset times (see `presets`). */
export interface TimePickerPresetGroup {
  /** Heading shown above the group (also its accessible name). */
  label: string;
  /** Times in 24-hour `HH:mm` or `HH:mm:ss` form, e.g. `'09:00'`. */
  values: string[];
}

/**
 * Quick-pick times: a flat list of 24-hour `HH:mm` / `HH:mm:ss` strings, or
 * labelled groups of them.
 */
export type TimePickerPresets = string[] | TimePickerPresetGroup[];

/**
 * Props for the inline time panel. This is the selection surface only — the
 * hour / minute / (second) / meridiem columns, with no field and no dialog.
 * For a form field that opens this panel in a sheet, use `<TimePickerInput/>`.
 */
export interface TimePickerProps extends BaseProps {
  /** Controlled value. `null` shows the default time (00:00, or 12:00 AM). */
  value?: TimePickerValue | null;
  defaultValue?: TimePickerValue | null;
  /** Fired on every column selection. */
  onChange?: (next: TimePickerValue) => void;
  /**
   * Fired when the user picks from the last meaningful column — minutes, or
   * seconds when `withSeconds` is set. `TimePickerInput` uses this to drive
   * `autoClose`.
   */
  onChangeComplete?: (next: TimePickerValue) => void;
  format?: 12 | 24;
  withSeconds?: boolean;
  minuteStep?: number;
  secondStep?: number;
  /** Width of each scroll column (hours/minutes/seconds). */
  columnWidth?: number;
  /** Max height of each scroll column. */
  columnHeight?: number;
  disabled?: boolean;
  /**
   * Preset times rendered as buttons under the columns. Each is a 24-hour
   * `HH:mm` or `HH:mm:ss` string (`'09:00'`, `'17:30:00'`), labelled in the
   * panel's `format`; pass `{ label, values }[]` to group them under headings.
   * Picking one sets the whole value (seconds are kept only with
   * `withSeconds`); the preset matching the current value shows as pressed.
   * Strings that aren't a valid time are skipped.
   */
  presets?: TimePickerPresets;
  /** Accessible name of the column group. @default 'Time' */
  accessibilityLabel?: string;
}
