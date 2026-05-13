import { nd } from './helpers';

// Default seed subscriptions
export const DEFAULT_SUBS = [
  { id: 1, name: 'Netflix',              icon: '🎬', color: '#E50914', amount: 15.49, cycle: 'monthly', cat: 'Entertainment', status: 'active', date: nd(3) },
  { id: 2, name: 'Spotify',              icon: '🎵', color: '#1DB954', amount: 9.99,  cycle: 'monthly', cat: 'Music',          status: 'active', date: nd(8) },
  { id: 3, name: 'ChatGPT Plus',         icon: '🤖', color: '#10a37f', amount: 20.00, cycle: 'monthly', cat: 'AI Tools',       status: 'trial',  date: nd(2), tdays: 2 },
  { id: 4, name: 'Adobe Creative Cloud', icon: '🎨', color: '#FF3366', amount: 54.99, cycle: 'monthly', cat: 'Productivity',   status: 'active', date: nd(1) },
  { id: 5, name: 'Notion Plus',          icon: '📝', color: '#ffffff', amount: 8.00,  cycle: 'monthly', cat: 'Productivity',   status: 'active', date: nd(19) },
];

// Pool used by the simulated Gmail scan
export const SCAN_POOL = [
  { name: 'YouTube Premium', icon: '▶️', color: '#FF0000', amount: 13.99, cycle: 'monthly', cat: 'Entertainment',  status: 'active', date: nd(5) },
  { name: 'iCloud+ 200GB',   icon: '☁️', color: '#3478f6', amount: 2.99,  cycle: 'monthly', cat: 'Cloud Storage',  status: 'active', date: nd(12) },
  { name: 'Duolingo Plus',   icon: '🦉', color: '#58cc02', amount: 6.99,  cycle: 'monthly', cat: 'Education',      status: 'trial',  date: nd(7), tdays: 7 },
  { name: 'Figma Pro',       icon: '🎨', color: '#F24E1E', amount: 15.00, cycle: 'monthly', cat: 'Productivity',   status: 'active', date: nd(22) },
];

// Category → icon emoji
export const CATEGORY_ICONS = {
  Entertainment:  '🎬',
  Music:          '🎵',
  Productivity:   '📝',
  'Cloud Storage':'☁️',
  'AI Tools':     '🤖',
  'News & Media': '📰',
  Fitness:        '💪',
  Education:      '📚',
  Other:          '📦',
};

// Category → brand colour
export const CATEGORY_COLORS = {
  Entertainment:  '#E50914',
  Music:          '#1DB954',
  Productivity:   '#6366f1',
  'Cloud Storage':'#3478f6',
  'AI Tools':     '#10a37f',
  'News & Media': '#6b7280',
  Fitness:        '#f97316',
  Education:      '#8b5cf6',
  Other:          '#6b7280',
};
