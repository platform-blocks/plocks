import type { ResponsiveProp, ComponentSizeValue, BaseProps } from '@plocks/ui';

export interface MonthPickerProps extends BaseProps {
  /** Currently selected date (uses the first day of the month) */
  value?: Date | null;
  /** Called when user picks a new month */
  onChange?: (date: Date | null) => void;
  /** Force a specific year to render */
  year?: number;
  /** Called when the visible year changes */
  onYearChange?: (year: number) => void;
  /** Minimum selectable date (inclusive) */
  minDate?: Date;
  /** Maximum selectable date (inclusive) */
  maxDate?: Date;
  /** Locale used for month labels */
  locale?: string;
  /** Size token that influences typography weight */
  size?: ComponentSizeValue;
  /** Format of month labels */
  monthLabelFormat?: 'short' | 'long';
  /** Hide navigation header (used when embedded in Calendar) */
  hideHeader?: boolean;
  /** Responsive override for the number of months rendered per row (breakpoints from `theme.breakpoints`). */
  monthsPerRow?: ResponsiveProp<number>;
  /** Stretch to fill the container instead of sizing to the natural grid width. Default `false`. */
  fullWidth?: boolean;
  /**
   * Replace the header's year title with a year select. Changing it moves the
   * view and calls `onYearChange`, like the arrows. Web renders a native
   * `<select>`; native platforms have no select element, so they keep the title.
   */
  withNativeLevelSelect?: boolean;
  /**
   * Inclusive `[from, to]` years offered by the year select
   * (`withNativeLevelSelect`), cut to `minDate` / `maxDate`. Defaults to the
   * displayed year ±50.
   */
  yearsSelectRange?: [number, number];
}
