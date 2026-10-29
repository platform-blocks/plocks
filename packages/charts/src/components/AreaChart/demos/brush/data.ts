// 18 months of daily traffic by channel.
const daily = (id: string, name: string, color: string, base: number, amp: number, phase: number) => ({
  id,
  name,
  color,
  data: Array.from({ length: 540 }, (_, day) => ({
    x: day,
    y: Math.max(0, Math.round(base + day * 0.15 + amp * Math.sin(day / 30 + phase) + amp * 0.4 * Math.sin((day / 7) * Math.PI * 2))),
  })),
});

export const SERIES = [
  daily('organic', 'Organic', '#4C6EF5', 120, 30, 0),
  daily('paid', 'Paid', '#F59F00', 70, 25, 1.1),
  daily('referral', 'Referral', '#20C997', 40, 12, 2.3),
];
