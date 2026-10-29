const GENRES = [
  { id: 'pop', name: 'Pop', values: [32, 34, 38, 41, 39, 36, 33, 35, 40, 44, 46, 43] },
  { id: 'hiphop', name: 'Hip-hop', values: [18, 22, 27, 30, 34, 38, 41, 40, 37, 35, 33, 34] },
  { id: 'rock', name: 'Rock', values: [28, 26, 24, 21, 19, 18, 16, 15, 15, 14, 13, 12] },
  { id: 'electronic', name: 'Electronic', values: [8, 10, 14, 19, 24, 22, 18, 16, 19, 23, 27, 30] },
  { id: 'jazz', name: 'Jazz', values: [6, 6, 5, 5, 6, 7, 8, 9, 8, 7, 7, 6] },
];

export const LISTENING_SERIES = GENRES.map(({ values, ...genre }) => ({
  ...genre,
  data: values.map((y, x) => ({ x, y })),
}));

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
