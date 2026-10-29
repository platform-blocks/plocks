import type { SunburstNode } from '@plocks/charts';

export const DISK_USAGE: SunburstNode[] = [
  {
    name: 'Media',
    children: [
      {
        name: 'Photos',
        children: [
          { name: '2023', value: 24 },
          { name: '2024', value: 31 },
          { name: '2025', value: 17 },
        ],
      },
      { name: 'Videos', value: 26 },
      { name: 'Music', value: 9 },
    ],
  },
  {
    name: 'Apps',
    children: [
      { name: 'Xcode', value: 12 },
      { name: 'Photoshop', value: 4 },
      { name: 'Chrome', value: 1.5 },
      { name: 'Slack', value: 1 },
    ],
  },
  {
    name: 'Documents',
    children: [
      { name: 'Projects', value: 18 },
      { name: 'PDFs', value: 3 },
      { name: 'Sheets', value: 1 },
    ],
  },
  { name: 'System', value: 22 },
  { name: 'Downloads', value: 7 },
];
