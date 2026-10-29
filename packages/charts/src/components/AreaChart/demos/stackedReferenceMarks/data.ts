const CHANNELS = [
  { id: 'organic', name: 'Organic', color: '#3b82f6', values: [12, 13, 14, 14, 15, 18, 21, 22, 23, 24, 25, 26] },
  { id: 'paid', name: 'Paid', color: '#10b981', values: [6, 6, 7, 8, 8, 12, 15, 14, 13, 13, 14, 15] },
  { id: 'referral', name: 'Referral', color: '#f97316', values: [3, 3, 4, 4, 5, 6, 7, 7, 8, 8, 9, 9] },
];

export const SIGNUP_SERIES = CHANNELS.map(({ values, ...channel }) => ({
  ...channel,
  data: values.map((y, x) => ({ x, y })),
}));
