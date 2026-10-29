---
name: MonthPicker
title: MonthPicker
category: dates
tags: [date, month, picker, calendar]
playground: true
props:
  withNativeLevelSelect: "Replace the header's year title with a year select; changing it moves the grid and calls onYearChange. Web renders a native <select>; native platforms keep the title and arrows"
  yearsSelectRange: "Inclusive [from, to] years offered by the year select, cut to minDate / maxDate (default: the displayed year ±50)"
---
Interactive grid for selecting a month within a given year. Renders a responsive layout that adapts to screen width and respects locale formatting as well as min/max date constraints.
