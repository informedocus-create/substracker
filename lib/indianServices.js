// lib/indianServices.js
// Indian subscription services database for onboarding picker
// Prices are in INR, as of 2024–2025

export const INDIAN_SERVICES = [
  // ── Entertainment ──────────────────────────────────────────────
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Entertainment',
    color: '#E50914',
    logo: '/logos/netflix.png',
    defaultPlan: 1,
    plans: [
      { name: 'Mobile',   amount: 149,  cycle: 'monthly' },
      { name: 'Basic',    amount: 199,  cycle: 'monthly' },
      { name: 'Standard', amount: 499,  cycle: 'monthly' },
      { name: 'Premium',  amount: 649,  cycle: 'monthly' },
    ],
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    category: 'Entertainment',
    color: '#0a3d91',
    logo: '/logos/hotstar.png',
    defaultPlan: 0,
    plans: [
      { name: 'Mobile',   amount: 299,  cycle: 'yearly' },
      { name: 'Super',    amount: 899,  cycle: 'yearly' },
      { name: 'Premium',  amount: 1499, cycle: 'yearly' },
    ],
  },
  {
    id: 'prime-video',
    name: 'Amazon Prime',
    category: 'Entertainment',
    color: '#00A8E1',
    logo: '/logos/amazon-prime.png',
    defaultPlan: 1,
    plans: [
      { name: 'Monthly',  amount: 299,  cycle: 'monthly' },
      { name: 'Yearly',   amount: 1499, cycle: 'yearly' },
    ],
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'Entertainment',
    color: '#FF0000',
    logo: '/logos/youtube.png',
    defaultPlan: 0,
    plans: [
      { name: 'Individual', amount: 139, cycle: 'monthly' },
      { name: 'Family',     amount: 209, cycle: 'monthly' },
    ],
  },
  {
    id: 'jiocinema',
    name: 'JioCinema',
    category: 'Entertainment',
    color: '#8B25CC',
    logo: '/logos/jiocinema.png',
    defaultPlan: 0,
    plans: [
      { name: 'Premium',  amount: 29,   cycle: 'monthly' },
      { name: 'Yearly',   amount: 299,  cycle: 'yearly' },
    ],
  },
  {
    id: 'sonyliv',
    name: 'SonyLIV',
    category: 'Entertainment',
    color: '#0070CE',
    logo: '/logos/sonyliv.png',
    defaultPlan: 0,
    plans: [
      { name: 'Lite',     amount: 399,  cycle: 'yearly' },
      { name: 'Super',    amount: 699,  cycle: 'yearly' },
      { name: 'Premium',  amount: 1499, cycle: 'yearly' },
    ],
  },
  {
    id: 'zee5',
    name: 'ZEE5',
    category: 'Entertainment',
    color: '#7B2D8B',
    logo: '/logos/zee5.png',
    defaultPlan: 0,
    plans: [
      { name: 'Monthly',  amount: 99,   cycle: 'monthly' },
      { name: 'Yearly',   amount: 999,  cycle: 'yearly' },
    ],
  },
  {
    id: 'mxplayer',
    name: 'MX Player Pro',
    category: 'Entertainment',
    color: '#FF6B00',
    logo: '/logos/mxplayer.png',
    defaultPlan: 0,
    plans: [
      { name: 'Monthly',  amount: 99,   cycle: 'monthly' },
      { name: 'Yearly',   amount: 999,  cycle: 'yearly' },
    ],
  },

  // ── Music ──────────────────────────────────────────────────────
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Music',
    color: '#1DB954',
    logo: '/logos/spotify.png',
    defaultPlan: 0,
    plans: [
      { name: 'Individual', amount: 119, cycle: 'monthly' },
      { name: 'Duo',        amount: 149, cycle: 'monthly' },
      { name: 'Family',     amount: 179, cycle: 'monthly' },
    ],
  },
  {
    id: 'jiosaavn',
    name: 'JioSaavn',
    category: 'Music',
    color: '#2BC5B4',
    logo: '/logos/jiosaavn.png',
    defaultPlan: 0,
    plans: [
      { name: 'Pro',        amount: 99,  cycle: 'monthly' },
      { name: 'Yearly',     amount: 699, cycle: 'yearly' },
    ],
  },
  {
    id: 'gaana',
    name: 'Gaana Plus',
    category: 'Music',
    color: '#E72429',
    logo: '/logos/gaana.png',
    defaultPlan: 0,
    plans: [
      { name: 'Monthly',    amount: 99,  cycle: 'monthly' },
      { name: 'Yearly',     amount: 399, cycle: 'yearly' },
    ],
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'Music',
    color: '#FC3C44',
    logo: '/logos/apple-music.png',
    defaultPlan: 0,
    plans: [
      { name: 'Individual', amount: 99,  cycle: 'monthly' },
      { name: 'Family',     amount: 149, cycle: 'monthly' },
      { name: 'Student',    amount: 49,  cycle: 'monthly' },
    ],
  },

  // ── Cloud Storage ──────────────────────────────────────────────
  {
    id: 'google-one',
    name: 'Google One',
    category: 'Cloud Storage',
    color: '#4285F4',
    logo: '/logos/google-one.png',
    defaultPlan: 0,
    plans: [
      { name: '100 GB',   amount: 130,  cycle: 'monthly' },
      { name: '200 GB',   amount: 210,  cycle: 'monthly' },
      { name: '2 TB',     amount: 650,  cycle: 'monthly' },
      { name: '2 TB/yr',  amount: 6500, cycle: 'yearly' },
    ],
  },
  {
    id: 'icloud',
    name: 'iCloud+',
    category: 'Cloud Storage',
    color: '#3478F6',
    logo: '/logos/icloud.png',
    defaultPlan: 0,
    plans: [
      { name: '50 GB',    amount: 75,   cycle: 'monthly' },
      { name: '200 GB',   amount: 219,  cycle: 'monthly' },
      { name: '2 TB',     amount: 749,  cycle: 'monthly' },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Cloud Storage',
    color: '#0061FE',
    logo: '/logos/dropbox.png',
    defaultPlan: 0,
    plans: [
      { name: 'Plus',     amount: 875,  cycle: 'monthly' },
      { name: 'Plus/yr',  amount: 7500, cycle: 'yearly' },
    ],
  },

  // ── Productivity ───────────────────────────────────────────────
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'Productivity',
    color: '#D83B01',
    logo: '/logos/microsoft-365.png',
    defaultPlan: 0,
    plans: [
      { name: 'Personal',    amount: 489,  cycle: 'monthly' },
      { name: 'Family',      amount: 619,  cycle: 'monthly' },
      { name: 'Personal/yr', amount: 4899, cycle: 'yearly' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    color: '#000000',
    logo: '/logos/notion.png',
    defaultPlan: 0,
    plans: [
      { name: 'Plus',     amount: 1000, cycle: 'monthly' },
      { name: 'Plus/yr',  amount: 800,  cycle: 'monthly' }, // billed yearly
      { name: 'Business', amount: 1500, cycle: 'monthly' },
    ],
  },
  {
    id: 'adobe-cc',
    name: 'Adobe CC',
    category: 'Productivity',
    color: '#FF3366',
    logo: '/logos/adobe.png',
    defaultPlan: 0,
    plans: [
      { name: 'Photography', amount: 535,  cycle: 'monthly' },
      { name: 'All Apps',    amount: 4230, cycle: 'monthly' },
      { name: 'All Apps/yr', amount: 3279, cycle: 'monthly' }, // billed yearly
    ],
  },
  {
    id: 'canva-pro',
    name: 'Canva Pro',
    category: 'Productivity',
    color: '#7D2AE8',
    logo: '/logos/canva.png',
    defaultPlan: 1,
    plans: [
      { name: 'Monthly',  amount: 699,  cycle: 'monthly' },
      { name: 'Yearly',   amount: 4999, cycle: 'yearly' },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'Productivity',
    color: '#F24E1E',
    logo: '/logos/figma.png',
    defaultPlan: 0,
    plans: [
      { name: 'Starter',  amount: 0,    cycle: 'monthly' },
      { name: 'Professional', amount: 1000, cycle: 'monthly' },
    ],
  },

  // ── AI Tools ───────────────────────────────────────────────────
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    category: 'AI Tools',
    color: '#10A37F',
    logo: '/logos/chatgpt.png',
    defaultPlan: 0,
    plans: [
      { name: 'Plus',   amount: 1712, cycle: 'monthly' },
      { name: 'Pro',    amount: 8560, cycle: 'monthly' },
    ],
  },
  {
    id: 'claude-pro',
    name: 'Claude Pro',
    category: 'AI Tools',
    color: '#CC785C',
    logo: '/logos/claude.png',
    defaultPlan: 0,
    plans: [
      { name: 'Pro',    amount: 1712, cycle: 'monthly' },
      { name: 'Team',   amount: 2140, cycle: 'monthly' },
    ],
  },
  {
    id: 'gemini-advanced',
    name: 'Gemini Advanced',
    category: 'AI Tools',
    color: '#4285F4',
    logo: '/logos/gemini.png',
    defaultPlan: 0,
    plans: [
      { name: 'Advanced', amount: 1950, cycle: 'monthly' },
    ],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'AI Tools',
    color: '#5865F2',
    logo: '/logos/midjourney.png',
    defaultPlan: 0,
    plans: [
      { name: 'Basic',     amount: 855,  cycle: 'monthly' },
      { name: 'Standard',  amount: 2139, cycle: 'monthly' },
      { name: 'Pro',       amount: 4279, cycle: 'monthly' },
    ],
  },

  // ── Education ──────────────────────────────────────────────────
  {
    id: 'duolingo-plus',
    name: 'Duolingo Plus',
    category: 'Education',
    color: '#58CC02',
    logo: '/logos/duolingo.png',
    defaultPlan: 0,
    plans: [
      { name: 'Super',  amount: 250,  cycle: 'monthly' },
      { name: 'Yearly', amount: 1750, cycle: 'yearly' },
    ],
  },
  {
    id: 'coursera-plus',
    name: 'Coursera Plus',
    category: 'Education',
    color: '#0056D2',
    logo: '/logos/coursera.png',
    defaultPlan: 1,
    plans: [
      { name: 'Monthly', amount: 2700, cycle: 'monthly' },
      { name: 'Yearly',  amount: 25800, cycle: 'yearly' },
    ],
  },
  {
    id: 'udemy',
    name: 'Udemy',
    category: 'Education',
    color: '#A435F0',
    logo: '/logos/udemy.png',
    defaultPlan: 0,
    plans: [
      { name: 'Personal Plan', amount: 750, cycle: 'monthly' },
    ],
  },

  // ── Fitness ────────────────────────────────────────────────────
  {
    id: 'cult-fit',
    name: 'Cult.fit',
    category: 'Fitness',
    color: '#FF3B3B',
    logo: '/logos/cultfit.png',
    defaultPlan: 0,
    plans: [
      { name: 'Cult Pass',     amount: 1999, cycle: 'monthly' },
      { name: 'Cult Pass/6mo', amount: 9999, cycle: 'quarterly' },
    ],
  },
  {
    id: 'fittr',
    name: 'Fittr',
    category: 'Fitness',
    color: '#FF6B35',
    logo: '/logos/fittr.png',
    defaultPlan: 0,
    plans: [
      { name: 'Basic',    amount: 599,  cycle: 'monthly' },
      { name: 'Premium',  amount: 1299, cycle: 'monthly' },
    ],
  },

  // ── News & Media ───────────────────────────────────────────────
  {
    id: 'toi-epaper',
    name: 'TOI ePaper',
    category: 'News & Media',
    color: '#D93025',
    logo: '/logos/toi.png',
    defaultPlan: 0,
    plans: [
      { name: 'Monthly',  amount: 99,  cycle: 'monthly' },
      { name: 'Yearly',   amount: 999, cycle: 'yearly' },
    ],
  },
  {
    id: 'mint',
    name: 'Mint',
    category: 'News & Media',
    color: '#E8102A',
    logo: '/logos/mint.png',
    defaultPlan: 0,
    plans: [
      { name: 'Digital',  amount: 299, cycle: 'monthly' },
      { name: 'Yearly',   amount: 2999, cycle: 'yearly' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All unique category names present in INDIAN_SERVICES */
export function getCategories() {
  return [...new Set(INDIAN_SERVICES.map(s => s.category))];
}

/** All services in a given category */
export function getByCategory(category) {
  return INDIAN_SERVICES.filter(s => s.category === category);
}

/** Category icon map (reuses the app's existing CATEGORY_ICONS shape) */
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
