// Three years of weekly points: enough that a brushed window reveals detail.
const weekly = (id: string, name: string, color: string, base: number, amp: number, phase: number) => ({
  id,
  name,
  color,
  data: Array.from({ length: 156 }, (_, week) => ({
    x: week,
    y: Math.round(base + week * 1.6 + amp * Math.sin(week / 8 + phase) + amp * 0.3 * Math.sin(week / 2.5)),
  })),
});

export const SERIES = [
  weekly('sessions', 'Sessions', '#4C6EF5', 420, 80, 0),
  weekly('signups', 'Signups', '#20C997', 180, 45, 1.3),
];
