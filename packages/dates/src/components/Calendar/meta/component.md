---
playground: true
title: Calendar
category: dates
description: A versatile calendar component for selecting dates, months, and years with customizable styles and behaviors.
slug: /components/Calendar
props:
  withNativeLevelSelect: "Replace the header's level button with selects — month + year on the month level, year on the year level (the decade level keeps its title). Changing a select moves the view and calls onDateChange, like the arrows. Web renders native <select> elements; native platforms have no select element and keep the level button"
  yearsSelectRange: "Inclusive [from, to] years offered by the year select, cut to minDate / maxDate (default: the displayed year ±50)"
---

Calendar displays a month grid for choosing dates.
