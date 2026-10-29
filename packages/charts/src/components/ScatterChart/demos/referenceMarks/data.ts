const SPEND_VS_LEADS: Array<[number, number]> = [
  [12, 18], [18, 25], [22, 31], [26, 28], [31, 44], [35, 39], [38, 52], [42, 48],
  [45, 66], [51, 61], [55, 74], [58, 57], [63, 82], [67, 71], [72, 96], [78, 88],
];

export const CAMPAIGNS = SPEND_VS_LEADS.map(([x, y], index) => ({ id: index, x, y }));
