export const KNOWN_SERVICES = [
  { name: "Netflix",          cat: "Entertainment", color: "#E50914", icon: "🎬" },
  { name: "Spotify",          cat: "Music",         color: "#1DB954", icon: "🎵" },
  { name: "Adobe",            cat: "Productivity",  color: "#FF3366", icon: "🎨" },
  { name: "Amazon Prime",     cat: "Entertainment", color: "#00A8E1", icon: "📦" },
  { name: "Google One",       cat: "Cloud Storage", color: "#3478f6", icon: "☁️" },
  { name: "ChatGPT",          cat: "AI Tools",      color: "#10a37f", icon: "🤖" },
  { name: "YouTube",          cat: "Entertainment", color: "#FF0000", icon: "▶️" },
  { name: "Figma",            cat: "Productivity",  color: "#F24E1E", icon: "🎨" },
  { name: "iCloud",           cat: "Cloud Storage", color: "#3478f6", icon: "☁️" },
  { name: "Duolingo",         cat: "Education",     color: "#58cc02", icon: "🦉" },
  { name: "Notion",           cat: "Productivity",  color: "#000000", icon: "📝" },
];

// Gmail search query builder:
// - Single words / symbols → bare (Gmail handles them natively)
// - Multi-word phrases    → wrapped in \"...\" so Gmail treats them as exact phrases
//   (without quotes Gmail splits on spaces and ORs each word separately)
function q(phrase) {
  return phrase.includes(" ") ? `"${phrase}"` : phrase;
}

export const SUBSCRIPTION_KEYWORDS = [
  // Standard billing (single-word → bare, multi-word → quoted)
  "subscription",
  "invoice",
  "receipt",
  "renewal",
  '"payment successful"',
  "membership",
  "billing",
  '"order confirmation"',
  // Welcome / join confirmation emails (Netflix "Thanks for joining", etc.)
  '"thanks for joining"',
  '"thank you for joining"',
  '"welcome to"',
  '"subscription confirmed"',
  '"account information"',
  '"your plan"',
  '"monthly plan"',
  '"annual plan"',
  '"start watching"',
  // Indian billing — symbols / acronyms, no spaces needed
  "\u20b9",   // ₹ symbol
  "INR",
  "UPI",
  '"auto-renewal"',
];

