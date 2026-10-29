---
name: MonthPickerInput
playground: true
category: dates
status: stable
inherits: Shared field props (label, description, error, helperText, required, disabled, readOnly, size, radius, variant, labelProps, descriptionProps, placeholder, placeholderTextColor, clearable, startSection, endSection, startSectionProps, endSectionProps)
props:
  dropdownType: "'modal' (default) — a centered sheet; 'popover' — anchored to the field on desktop web"
  modalTitle: Title of the picker sheet / name of the popover
  withNativeLevelSelect: "Replace the month grid's year title with a year select (web native <select>; native keeps the title)"
  yearsSelectRange: "Inclusive [from, to] years offered by the year select, cut to minDate / maxDate (default: the displayed year ±50)"
---

MonthPickerInput opens a month picker from a form field.
