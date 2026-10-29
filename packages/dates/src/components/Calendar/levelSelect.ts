import type { MutableRefObject } from 'react';

import { dateUtils } from './utils';

/** One `<option>` of a level select. */
export interface NativeSelectOption {
  value: number;
  label: string;
  disabled?: boolean;
}

/** Props of the header's month / year select (`withNativeLevelSelect`). */
export interface NativeSelectProps {
  /** Accessible name ("Month", "Year"). */
  label: string;
  value: number;
  options: NativeSelectOption[];
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Receives the DOM node, so the calendar can move focus to it. */
  nodeRef?: MutableRefObject<unknown>;
  testID?: string;
}

/** Years each side of the displayed year when `yearsSelectRange` isn't set. */
export const DEFAULT_YEARS_AROUND = 50;

/**
 * Year options for the level select: `range` (inclusive, default the
 * displayed year ±50) cut to `minDate` / `maxDate`. The displayed year is
 * always included so the select can show it.
 */
export function getYearOptions(
  displayedYear: number,
  range: [number, number] | undefined,
  minDate?: Date,
  maxDate?: Date
): NativeSelectOption[] {
  let [start, end] = range ?? [displayedYear - DEFAULT_YEARS_AROUND, displayedYear + DEFAULT_YEARS_AROUND];
  if (start > end) [start, end] = [end, start];
  if (minDate) start = Math.max(start, minDate.getFullYear());
  if (maxDate) end = Math.min(end, maxDate.getFullYear());
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  if (!years.includes(displayedYear)) {
    years.push(displayedYear);
    years.sort((a, b) => a - b);
  }
  return years.map((year) => ({ value: year, label: String(year) }));
}

/** Month options of `year`, with months wholly outside `minDate` / `maxDate` disabled. */
export function getMonthOptions(
  year: number,
  monthNames: string[],
  minDate?: Date,
  maxDate?: Date
): NativeSelectOption[] {
  return monthNames.map((label, month) => {
    const start = new Date(year, month, 1);
    const disabled =
      (!!minDate && dateUtils.endOfMonth(start) < dateUtils.startOfMonth(minDate)) ||
      (!!maxDate && start > dateUtils.endOfMonth(maxDate));
    return { value: month, label, disabled };
  });
}

/** First day of `year` / `month`, pulled inside `minDate` / `maxDate`. */
export function clampMonth(year: number, month: number, minDate?: Date, maxDate?: Date): Date {
  const target = new Date(year, month, 1);
  if (minDate && target < dateUtils.startOfMonth(minDate)) return dateUtils.startOfMonth(minDate);
  if (maxDate && target > dateUtils.endOfMonth(maxDate)) return dateUtils.startOfMonth(maxDate);
  return target;
}
