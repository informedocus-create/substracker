/**
 * Cancel Subscription Assistant — Service Knowledge Base
 * Each entry contains:
 *   - method:   'website' | 'app' | 'chat' | 'phone'
 *   - url:      Direct cancellation URL
 *   - steps:    Ordered step-by-step guide
 *   - warning:  Any gotcha to warn users about
 *   - savings:  Cheaper alternatives
 */

export const CANCEL_GUIDES = {
  netflix: {
    name:    "Netflix",
    method:  "website",
    url:     "https://www.netflix.com/cancelplan",
    steps: [
      "Go to netflix.com and sign in",
      "Click your profile icon → Account",
      "Under Membership, click Cancel Membership",
      "Click Finish Cancellation to confirm",
    ],
    warning: "You keep access until the end of your current billing period.",
    savings: "Consider Hulu ($7.99/mo) or a free Tubi account.",
  },

  spotify: {
    name:    "Spotify",
    method:  "website",
    url:     "https://www.spotify.com/account/subscription/cancel",
    steps: [
      "Go to spotify.com and log in",
      "Click your profile → Account",
      "Under Your Plan, click Cancel Premium",
      "Follow prompts and confirm",
    ],
    warning: "You'll revert to the free ad-supported tier, not lose access.",
    savings: "YouTube Music is included free with YouTube Premium.",
  },

  adobe: {
    name:    "Adobe Creative Cloud",
    method:  "website",
    url:     "https://account.adobe.com/plans",
    steps: [
      "Go to account.adobe.com and sign in",
      "Click Plans & Payment → Manage Plan",
      "Click Cancel Plan and select a reason",
      "Choose Continue to Cancel to confirm",
    ],
    warning: "Cancelling mid-term may incur an early termination fee of 50% of remaining months.",
    savings: "Figma (free tier) covers most design needs. Canva Pro is $12.99/mo.",
  },

  amazon: {
    name:    "Amazon Prime",
    method:  "website",
    url:     "https://www.amazon.com/gp/primecentral",
    steps: [
      "Go to amazon.com and sign in",
      "Go to Account → Prime Membership",
      "Click Manage Membership → End Membership",
      "Confirm your cancellation",
    ],
    warning: "If cancelled within 3 days of charge, you may get a full refund.",
    savings: "Walmart+ ($12.95/mo) offers similar free shipping benefits.",
  },

  "google one": {
    name:    "Google One",
    method:  "website",
    url:     "https://one.google.com/storage",
    steps: [
      "Go to one.google.com and sign in",
      "Click Settings → Manage Membership",
      "Select Cancel Membership",
      "Confirm the cancellation",
    ],
    warning: "Storage above 15GB will become inaccessible if you don't reduce it first.",
    savings: "iCloud+ starts at $0.99/mo for 50GB on Apple devices.",
  },

  chatgpt: {
    name:    "ChatGPT Plus",
    method:  "website",
    url:     "https://chat.openai.com/#settings",
    steps: [
      "Go to chat.openai.com and sign in",
      "Click your profile → Settings",
      "Click Manage Subscription",
      "Click Cancel Plan",
    ],
    warning: "You keep Plus access until the end of your billing cycle.",
    savings: "Claude.ai and Gemini both have generous free tiers.",
  },

  youtube: {
    name:    "YouTube Premium",
    method:  "website",
    url:     "https://www.youtube.com/paid_memberships",
    steps: [
      "Go to youtube.com and sign in",
      "Click your profile → Purchases and memberships",
      "Click YouTube Premium → Deactivate",
      "Confirm the cancellation",
    ],
    warning: "Background play and ad-free viewing end immediately on some plans.",
    savings: "Using YouTube with an ad blocker (uBlock Origin) is free.",
  },

  figma: {
    name:    "Figma Pro",
    method:  "website",
    url:     "https://www.figma.com/settings",
    steps: [
      "Go to figma.com and sign in",
      "Click your profile → Settings",
      "Go to Billing → Downgrade",
      "Select Free plan and confirm",
    ],
    warning: "Projects over the free tier limit (3 projects) will become read-only.",
    savings: "Figma Free is generous for solo designers.",
  },

  icloud: {
    name:    "iCloud+",
    method:  "app",
    url:     "https://support.apple.com/en-us/HT207099",
    steps: [
      "Open Settings on your iPhone or iPad",
      "Tap your Apple ID → iCloud",
      "Tap Manage Account Storage → Change Storage Plan",
      "Select Downgrade Options → Free",
    ],
    warning: "Data above 5GB will be deleted after 30 days unless you reduce it.",
    savings: "Google One gives 100GB for $1.99/mo across all devices.",
  },

  notion: {
    name:    "Notion Plus",
    method:  "website",
    url:     "https://www.notion.so/my-account",
    steps: [
      "Go to notion.so and sign in",
      "Click Settings & Members → Plans",
      "Click Downgrade to Free",
      "Confirm the downgrade",
    ],
    warning: "File upload limit drops to 5MB per file on the free plan.",
    savings: "Notion Free is very capable for personal use.",
  },

  duolingo: {
    name:    "Duolingo Plus",
    method:  "app",
    url:     "https://www.duolingo.com/settings/plus",
    steps: [
      "Open the Duolingo app",
      "Tap your profile → Super Duolingo",
      "Tap Manage Subscription",
      "Cancel via your App Store or Google Play subscription settings",
    ],
    warning: "Duolingo Free still gives full language learning — ads are the only difference.",
    savings: "The free tier is identical in content.",
  },
};

/**
 * Look up a cancel guide from a subscription name.
 * Returns the guide object or null if unknown.
 */
export function getCancelGuide(name) {
  const key = (name || "").toLowerCase();
  for (const [id, guide] of Object.entries(CANCEL_GUIDES)) {
    if (key.includes(id)) return guide;
  }
  return null;
}
