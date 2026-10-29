const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Three years of monthly revenue ($k) with seasonality and growth.
export const DATA = Array.from({ length: 36 }, (_, index) => ({
  category: `${MONTHS[index % 12]} ${22 + Math.floor(index / 12)}`,
  value: Math.round(120 + index * 3.5 + 35 * Math.sin((index / 12) * Math.PI * 2 - 1) + 12 * Math.sin(index * 1.7)),
}));
