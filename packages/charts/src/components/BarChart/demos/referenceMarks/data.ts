const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const VALUES = [820, 910, 880, 1010, 1120, 1090, 1380, 1520, 1260];

export const SIGNUPS = MONTHS.map((category, index) => ({ category, value: VALUES[index] }));
