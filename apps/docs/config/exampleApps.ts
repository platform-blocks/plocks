/** Full Expo applications in the monorepo, shown on the examples page. */
export const EXAMPLE_APPS = [
  { slug: 'weather', title: 'Weather', category: 'Everyday', description: 'City forecasts, current conditions, and a compact daily outlook.' },
  { slug: 'music', title: 'Music player', category: 'Media', description: 'A music library, playlists, and now playing screen.' },
  { slug: 'chatline', title: 'Chatline', category: 'Social', description: 'Chats, status, calls, and a conversation view.' },
  { slug: 'frameleaf', title: 'Frameleaf', category: 'Social', description: 'Stories, feed posts, search, and profile.' },
  { slug: 'fish-dating', title: 'Dating', category: 'Social', description: 'Discover profiles, match, and chat.' },
  { slug: 'guildline', title: 'Guildline', category: 'Social', description: 'Servers, channels, and direct messages.' },
  { slug: 'sproutfolio', title: 'Sproutfolio', category: 'Finance', description: 'Portfolio overview, charts, and watchlists.' },
  { slug: 'townlist', title: 'Townlist', category: 'Commerce', description: 'Browse listings, search, and save favorites.' },
  { slug: 'nightfall', title: 'Nightfall', category: 'Media', description: 'Featured titles, browse rows, and a watchlist.' },
  { slug: 'postbox', title: 'Postbox', category: 'Productivity', description: 'Inbox, message detail, search, and compose.' },
  { slug: 'threadit', title: 'Threadit', category: 'Social', description: 'Communities, posts, comments, and voting.' },
  { slug: 'solitaire', title: 'Solitaire', category: 'Games', description: 'A playable card game with stock and tableau.' },
  { slug: 'lettergrid', title: 'Lettergrid', category: 'Games', description: 'A five-letter guessing game.' },
  { slug: 'calculator', title: 'Calculator', category: 'Everyday', description: 'A full-screen four-function calculator with a responsive keypad.' },
  { slug: 'idea-grid', title: 'Idea Grid', category: 'Social', description: 'A visual inspiration feed and saved ideas.' },
  { slug: 'e-reader', title: 'E-Reader', category: 'Media', description: 'An immersive reading surface with word-synced narration and bookmarks.' },
  { slug: 'wordtrail', title: 'Wordtrail', category: 'Education', description: 'Short lessons and progress tracking.' },
  { slug: 'daily-edition', title: 'The Daily Edition', category: 'Media', description: 'An editorial news reader with articles, sections, search, saved stories, and demo ads.' },
] as const;

export type ExampleAppEntry = (typeof EXAMPLE_APPS)[number];
