import { clampMonth, getMonthOptions, getYearOptions } from '../levelSelect';
import { NativeSelect } from '../NativeSelect';

const MONTHS = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

describe('level select helpers', () => {
  it('has no select element on native', () => {
    expect(NativeSelect).toBeNull();
  });

  it('defaults to the displayed year ±50', () => {
    const years = getYearOptions(2026, undefined).map((option) => option.value);
    expect(years[0]).toBe(1976);
    expect(years[years.length - 1]).toBe(2076);
  });

  it('cuts the range to minDate / maxDate and always includes the displayed year', () => {
    expect(getYearOptions(2026, [2000, 2040], new Date(2024, 0, 1), new Date(2027, 0, 1)).map((o) => o.value)).toEqual([
      2024, 2025, 2026, 2027,
    ]);
    expect(getYearOptions(1990, [2030, 2020]).map((o) => o.value)).toEqual([
      1990, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
    ]);
  });

  it('disables months outside minDate / maxDate', () => {
    const options = getMonthOptions(2026, MONTHS, new Date(2026, 2, 15), new Date(2026, 9, 1));
    expect(options.filter((o) => o.disabled).map((o) => o.value)).toEqual([0, 1, 10, 11]);
  });

  it('clamps a jump into minDate / maxDate', () => {
    expect(clampMonth(2026, 0, new Date(2026, 4, 10))).toEqual(new Date(2026, 4, 1));
    expect(clampMonth(2030, 11, undefined, new Date(2030, 5, 3))).toEqual(new Date(2030, 5, 1));
    expect(clampMonth(2026, 6)).toEqual(new Date(2026, 6, 1));
  });
});
