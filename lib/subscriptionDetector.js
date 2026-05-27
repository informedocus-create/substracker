/**
 * lib/subscriptionDetector.js
 *
 * Production-grade 6-layer subscription detection engine.
 * All layers are pure functions — no I/O, fully testable in isolation.
 *
 * Layer 1 — Email Filter       (applied upstream in route.js via Gmail query)
 * Layer 2 — Merchant Recognition
 * Layer 3 — Payment Extraction
 * Layer 4 — Recurring Analysis
 * Layer 5 — Confidence Scoring
 * Layer 6 — Verdict + User Confirmation payload
 */

// ═══════════════════════════════════════════════════════════════════
//  MERCHANT DATABASE  (Layer 2)
//  billingDomains: known transactional/billing sender domains
//  Only domains that send receipts/invoices — NOT marketing domains
// ═══════════════════════════════════════════════════════════════════

export const MERCHANT_DB = {
  netflix: {
    billingDomains: ['account.netflix.com', 'info@mailer.netflix.com', 'netflix.com'],
    icon: '🎬', color: '#E50914', cat: 'Entertainment',
  },
  spotify: {
    billingDomains: ['spotify.com', 'email.spotify.com', 'no-reply@spotify.com'],
    icon: '🎵', color: '#1DB954', cat: 'Music',
  },
  adobe: {
    billingDomains: ['mail.adobe.com', 'adobe.com', 'account@adobe.com'],
    icon: '🎨', color: '#FF3366', cat: 'Productivity',
  },
  amazon: {
    billingDomains: ['amazon.com', 'amazon.in', 'auto-confirm@amazon.com', 'shipment-tracking@amazon.com'],
    icon: '📦', color: '#FF9900', cat: 'Entertainment',
  },
  google: {
    billingDomains: ['payments-noreply@google.com', 'google.com', 'noreply@google.com'],
    icon: '☁️', color: '#3478f6', cat: 'Cloud Storage',
  },
  openai: {
    billingDomains: ['openai.com', 'billing@openai.com', 'noreply@tm.openai.com'],
    icon: '🤖', color: '#10a37f', cat: 'AI Tools',
  },
  youtube: {
    billingDomains: ['youtube.com', 'noreply@youtube.com', 'ytpremium@google.com'],
    icon: '▶️', color: '#FF0000', cat: 'Entertainment',
  },
  figma: {
    billingDomains: ['figma.com', 'billing@figma.com', 'noreply@figma.com'],
    icon: '🎨', color: '#F24E1E', cat: 'Productivity',
  },
  apple: {
    billingDomains: ['apple.com', 'appleid@id.apple.com', 'no_reply@email.apple.com'],
    icon: '☁️', color: '#555555', cat: 'Cloud Storage',
  },
  duolingo: {
    billingDomains: ['duolingo.com', 'no-reply@duolingo.com', 'mailer@duolingo.com'],
    icon: '🦉', color: '#58cc02', cat: 'Education',
  },
  notion: {
    billingDomains: ['notion.so', 'notion.com', 'team@mail.notion.so'],
    icon: '📝', color: '#6b7280', cat: 'Productivity',
  },
  microsoft: {
    billingDomains: ['microsoft.com', 'account@microsoft.com', 'msa@communication.microsoft.com'],
    icon: '🖥️', color: '#00a4ef', cat: 'Productivity',
  },
  dropbox: {
    billingDomains: ['dropbox.com', 'no-reply@dropbox.com'],
    icon: '📁', color: '#0061FE', cat: 'Cloud Storage',
  },
  zoom: {
    billingDomains: ['zoom.us', 'no-reply@zoom.us', 'billing@zoom.us'],
    icon: '📹', color: '#2D8CFF', cat: 'Productivity',
  },
  slack: {
    billingDomains: ['slack.com', 'feedback@slack.com', 'billing@slack.com'],
    icon: '💬', color: '#4A154B', cat: 'Productivity',
  },
};

// ═══════════════════════════════════════════════════════════════════
//  SIGNAL KEYWORD BANKS
// ═══════════════════════════════════════════════════════════════════

export const RECEIPT_KEYWORDS = [
  'you have been charged', 'payment successful', 'payment confirmed',
  'payment received', 'invoice', 'receipt', 'transaction completed',
  'order confirmation', 'amount paid', 'charge of', 'billed',
  'billing statement', 'renewed successfully', 'tax invoice',
  'thanks for joining', 'thank you for joining',
  'you\'re ready to start', 'subscription is active',
  'subscription confirmed', 'you\'ve subscribed', 'you have subscribed',
  'welcome to', 'account information',
  'payment method', 'auto-renew', 'auto renew',
];

export const MARKETING_KEYWORDS = [
  'recommended for you', 'watch now', 'new features', 'exclusive sale',
  'discount', 'upgrade now', 'top picks', 'don\'t miss', 'special offer',
  'limited time', 'free for a limited time', 'try it now', 'check out',
];

export const TRIAL_KEYWORDS = [
  'trial', 'expires', 'cancel anytime', '7-day free', 'not charged yet',
  'no charge', 'free period', 'trial ends', 'trial period', 'free trial',
  'after trial', 'trial membership', '30-day free', '14-day free',
];

export const SUBSCRIPTION_KEYWORDS = [
  'subscription', 'membership', 'billing cycle', 'monthly plan',
  'annual plan', 'renewal date', 'renews on', 'next charge',
  'next payment', 'billed monthly', 'billed annually', 'cancel anytime',
  'your plan', 'start watching', 'start listening',
];

// ═══════════════════════════════════════════════════════════════════
//  AMOUNT EXTRACTION  (Layer 3)
// ═══════════════════════════════════════════════════════════════════

const AMOUNT_REGEX = /([₹$€£¥]|Rs\.?\s{0,2}|INR\s{0,2})([\d,]{1,8}(?:\.\d{1,2})?)/gi;

export function extractBestAmount(emails) {
  let bestAmount = 0;
  let bestCurrency = 'UNKNOWN';

  const CURRENCY_MAP = {
    '₹': 'INR', 'rs.': 'INR', 'inr': 'INR',
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
  };

  const MINIMUM = { INR: 49, USD: 1, EUR: 1, GBP: 1, UNKNOWN: 1 };

  for (const email of emails) {
    const text = `${email.subject || ''} ${email.body || ''}`;
    let match;
    const re = new RegExp(AMOUNT_REGEX.source, 'gi');
    while ((match = re.exec(text)) !== null) {
      const prefix = match[1].trim().toLowerCase();
      const amount = parseFloat(match[2].replace(/,/g, ''));
      const cur = CURRENCY_MAP[prefix] ?? 'UNKNOWN';
      const min = MINIMUM[cur] ?? 1;
      if (amount >= min && amount > bestAmount) {
        bestAmount = amount;
        bestCurrency = cur;
      }
    }
  }

  return { amount: bestAmount, currency: bestCurrency };
}

// ═══════════════════════════════════════════════════════════════════
//  RECURRING ANALYSIS  (Layer 4)
// ═══════════════════════════════════════════════════════════════════

export function analyzeRecurrence(emails) {
  const dates = emails
    .map(e => e.emailDate ? new Date(e.emailDate) : null)
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (dates.length < 2) {
    return { isMonthly: false, isAnnual: false, gaps: [], cycle: null };
  }

  const gaps = [];
  for (let i = 1; i < dates.length; i++) {
    gaps.push((dates[i] - dates[i - 1]) / 86_400_000);
  }

  const isMonthly = gaps.some(g => g >= 25 && g <= 35);
  const isAnnual  = gaps.some(g => g >= 340 && g <= 390);
  const cycle     = isAnnual ? 'yearly' : isMonthly ? 'monthly' : null;

  return { isMonthly, isAnnual, gaps, cycle };
}

// ═══════════════════════════════════════════════════════════════════
//  MERCHANT RECOGNITION  (Layer 2)
// ═══════════════════════════════════════════════════════════════════

export function recognizeMerchant(emails, merchantKey) {
  const dbEntry = MERCHANT_DB[merchantKey?.toLowerCase()];
  if (!dbEntry) return { verified: false, dbEntry: null };

  const verified = emails.some(e =>
    dbEntry.billingDomains.some(domain =>
      (e.from || '').toLowerCase().includes(domain.toLowerCase())
    )
  );
  return { verified, dbEntry };
}

// ═══════════════════════════════════════════════════════════════════
//  SAME-AMOUNT REPEAT CHECK
//  Signals that identical billing amounts recur across emails
// ═══════════════════════════════════════════════════════════════════

export function checkRepeatedAmount(emails) {
  const amounts = emails
    .map(e => extractBestAmount([e]).amount)
    .filter(a => a > 0);

  if (amounts.length < 2) return false;
  const freq = {};
  for (const a of amounts) {
    freq[a] = (freq[a] || 0) + 1;
    if (freq[a] >= 2) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
//  SIGNAL CHECKERS
// ═══════════════════════════════════════════════════════════════════

function combinedText(emails) {
  return emails.map(e => `${e.subject || ''} ${e.body || ''}`).join(' ').toLowerCase();
}

function hasKeywords(emails, keywords) {
  const text = combinedText(emails);
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

function marketingRatio(emails) {
  const hits = emails.filter(e => {
    const t = `${e.subject || ''} ${e.body || ''}`.toLowerCase();
    return MARKETING_KEYWORDS.some(kw => t.includes(kw));
  }).length;
  return hits / emails.length;
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN SCORER  (Layer 5)
//  Returns full pipeline trace for visualizer + final verdict
// ═══════════════════════════════════════════════════════════════════

/**
 * @param {Array}  emails      — array of { from, subject, body, emailDate } objects
 * @param {string} merchantKey — lowercase merchant name (e.g. 'netflix')
 * @returns {Object} Full pipeline result with trace and verdict
 */
export function scoreSubscription(emails, merchantKey) {
  const trace = [];   // layer-by-layer breakdown returned to UI
  let score   = 0;
  let singleEmailPenalty = 0;

  // ── Single-email penalty (not a hard fail) ────────────────────────
  const isSingleEmail = emails.length <= 1;
  if (isSingleEmail) {
    singleEmailPenalty = 25;
    trace.push({
      layer: 1, name: 'Email Filter',
      status: 'warn',
      detail: `Only ${emails.length} email from this merchant — recurrence cannot be confirmed`,
      delta: 0,
    });
  } else {
    trace.push({
      layer: 1, name: 'Email Filter',
      status: 'pass',
      detail: `${emails.length} qualifying receipt/invoice emails found`,
      delta: 0,
    });
  }

  // ── Layer 2: Merchant Recognition ───────────────────────────────
  const { verified, dbEntry } = recognizeMerchant(emails, merchantKey);
  const isKnown = !!dbEntry;
  let l2Score = 0;

  if (verified) {
    l2Score = 15;
    score  += l2Score;
    trace.push({
      layer: 2, name: 'Merchant Recognition',
      status: 'pass',
      detail: `Billing domain verified for "${merchantKey}"`,
      delta: +l2Score,
    });
  } else if (isKnown) {
    l2Score = 5;
    score  += l2Score;
    trace.push({
      layer: 2, name: 'Merchant Recognition',
      status: 'warn',
      detail: `Known merchant "${merchantKey}" but sender domain not on billing whitelist`,
      delta: +l2Score,
    });
  } else {
    trace.push({
      layer: 2, name: 'Merchant Recognition',
      status: 'warn',
      detail: `Unknown merchant — not in MERCHANT_DB, proceeding with signal scoring`,
      delta: 0,
    });
  }

  if (isKnown) {
    score += 15;
    trace[trace.length - 1].detail += ` · +15 whitelist bonus`;
    trace[trace.length - 1].delta  += 15;
  }

  // ── Layer 3: Payment Extraction ─────────────────────────────────
  const { amount, currency } = extractBestAmount(emails);
  const hasReceipt = hasKeywords(emails, RECEIPT_KEYWORDS);
  const paymentCount = emails.filter(e =>
    RECEIPT_KEYWORDS.some(kw =>
      `${e.subject || ''} ${e.body || ''}`.toLowerCase().includes(kw)
    )
  ).length;

  if (!amount || amount === 0) {
    if (!isKnown) {
      score -= 40;
      trace.push({
        layer: 3, name: 'Payment Extraction',
        status: 'fail',
        detail: 'No payment amount detected (₹/$/€/£) and merchant not in whitelist. Rejecting.',
        delta: -40,
      });
      return {
        score: Math.max(0, score),
        verdict: 'ignore',
        signals: ['no_amount'],
        trace,
        cycle: null,
        amount: 0,
        currency,
      };
    }
    score -= 20;
    trace.push({
      layer: 3, name: 'Payment Extraction',
      status: 'warn',
      detail: 'No payment amount found, but merchant is on whitelist — continuing with reduced score',
      delta: -20,
    });
  } else {
    let l3Score = 0;
    if (hasReceipt) { l3Score += 40; score += 40; }
    if (paymentCount >= 2) { l3Score += 20; score += 20; }
    trace.push({
      layer: 3, name: 'Payment Extraction',
      status: hasReceipt ? 'pass' : 'warn',
      detail: hasReceipt
        ? `${currency} ${amount.toFixed(2)} detected · ${paymentCount} receipt-type email${paymentCount !== 1 ? 's' : ''}`
        : `Amount ${currency} ${amount.toFixed(2)} found but no clear receipt keywords`,
      delta: l3Score,
    });
  }

  // ── Layer 4: Recurring Analysis ──────────────────────────────────
  const { isMonthly, isAnnual, gaps, cycle } = analyzeRecurrence(emails);
  const repeatedAmount = checkRepeatedAmount(emails);
  let l4Score = 0;

  if (isMonthly || isAnnual) { l4Score += 30; score += 30; }
  if (repeatedAmount) { l4Score += 20; score += 20; }

  const gapDesc = gaps.length ? `Gaps: ${gaps.map(g => `${g.toFixed(0)}d`).join(', ')}` : 'Not enough dates';
  const l4DetailParts = [];
  if (isMonthly || isAnnual) l4DetailParts.push(`${isMonthly ? 'Monthly' : 'Annual'} billing pattern confirmed`);
  else l4DetailParts.push('No recurring date interval found');
  l4DetailParts.push(gapDesc);
  if (repeatedAmount) l4DetailParts.push('Same amount repeats ✔ (+20)');
  else if (emails.length >= 2) l4DetailParts.push('Usage-based billing possible');

  trace.push({
    layer: 4, name: 'Recurring Analysis',
    status: (isMonthly || isAnnual) ? 'pass' : emails.length >= 3 ? 'warn' : 'fail',
    detail: l4DetailParts.join(' · '),
    delta: l4Score,
  });

  // ── Layer 5: Confidence Scoring ──────────────────────────────────
  const signals = [];
  let l5Score = 0;
  const l5Details = [];

  if (hasKeywords(emails, SUBSCRIPTION_KEYWORDS)) {
    signals.push('keywords');
    l5Score += 5;
    score   += 5;
    l5Details.push('+5 subscription keywords');
  }

  const mRatio = marketingRatio(emails);
  if (mRatio > 0.3) {
    signals.push('marketing');
    l5Score -= 20;
    score   -= 20;
    l5Details.push(`−20 marketing language (${(mRatio * 100).toFixed(0)}% of emails)`);
  }

  if (hasKeywords(emails, TRIAL_KEYWORDS)) {
    signals.push('trial');
    l5Score -= 25;
    score   -= 25;
  }

  // Apply single-email cap: prevents a lone email from being auto-confirmed
  // even if it hits many keyword signals. Caps effective score at 55.
  if (isSingleEmail) {
    score = Math.min(score, 55) - singleEmailPenalty;
    trace.push({
      layer: 5, name: 'Confidence Scoring',
      status: Math.max(0, Math.min(100, score)) >= 35 ? 'warn' : 'fail',
      detail: (l5Details.length ? l5Details.join(' · ') + ' · ' : '') +
        '−5 single-email penalty — recurrence unconfirmed (capped at 55)',
      delta: l5Score - singleEmailPenalty,
      finalScore: Math.max(0, Math.min(100, score)),
    });
  } else {
    trace.push({
      layer: 5, name: 'Confidence Scoring',
      status: Math.max(0, Math.min(100, score)) >= 70 ? 'pass' : Math.max(0, Math.min(100, score)) >= 35 ? 'warn' : 'fail',
      detail: l5Details.length ? l5Details.join(' · ') : 'No adjustments applied',
      delta: l5Score,
      finalScore: Math.max(0, Math.min(100, score)),
    });
  }

  const finalScore = Math.max(0, Math.min(100, score));

  // ── Layer 6: Verdict ─────────────────────────────────────────────
  // Thresholds tuned for real-world inboxes:
  //   70+ → confirmed (was 80 — too strict, missed real subscriptions)
  //   35–69 → possible (was 50 — too strict for single-email merchants)
  //   <35  → ignore
  const verdict = finalScore >= 70 ? 'confirmed'
                : finalScore >= 35 ? 'possible'
                : 'ignore';

  const verdictLabels = {
    confirmed: `Auto-selected (${finalScore}%) — ready to add`,
    possible:  `Needs user confirmation (${finalScore}%)`,
    ignore:    `Filtered out silently (${finalScore}% < 35)`,
  };

  trace.push({
    layer: 6, name: 'User Confirmation',
    status: verdict === 'confirmed' ? 'pass' : verdict === 'possible' ? 'warn' : 'fail',
    detail: verdictLabels[verdict],
    delta: 0,
    verdict,
  });

  // Build final signals array
  if (hasReceipt)             signals.unshift('receipt');
  if (isMonthly || isAnnual)  signals.unshift('recurring');
  if (verified)               signals.unshift('sender');
  if (isKnown)                signals.unshift('whitelist');
  if (repeatedAmount)         signals.unshift('repeated_amount');

  return {
    score:   finalScore,
    verdict,
    signals,
    trace,
    cycle:   cycle || 'monthly',
    amount,
    currency,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  RENEWAL DATE EXTRACTION  (utility, used in route.js)
// ═══════════════════════════════════════════════════════════════════

export function extractRenewalDate(text) {
  // ISO format: 2026-06-15
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const d = new Date(isoMatch[1]);
    if (!isNaN(d) && d > new Date()) return d;
  }

  // Word format: "15 June 2026" or "June 15, 2026"
  const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
  const lower  = text.toLowerCase();

  const wordMatch = lower.match(
    new RegExp(`(\\d{1,2})\\s+(${MONTHS})[a-z]*(?:\\s+(\\d{4}))?`, 'i')
  );
  if (wordMatch) {
    const str = `${wordMatch[1]} ${wordMatch[2]} ${wordMatch[3] || new Date().getFullYear()}`;
    const d   = new Date(str);
    if (!isNaN(d)) {
      if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }

  // Numeric format: 15/06/2026 or 06-15-2026
  const numMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (numMatch) {
    const d = new Date(numMatch[0]);
    if (!isNaN(d) && d > new Date()) return d;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  MERCHANT KEY RESOLVER
//  Maps a free-text merchant name or email sender → MERCHANT_DB key
// ═══════════════════════════════════════════════════════════════════

export function resolveMerchantKey(name) {
  const n = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const key of Object.keys(MERCHANT_DB)) {
    if (n.includes(key)) return key;
  }
  // Fuzzy aliases
  if (n.includes('prime') || n.includes('amzn')) return 'amazon';
  if (n.includes('chatgpt') || n.includes('openai')) return 'openai';
  if (n.includes('icloud') || n.includes('appid')) return 'apple';
  if (n.includes('youtube') || n.includes('ytpremium')) return 'youtube';
  if (n.includes('msoffice') || n.includes('office365') || n.includes('microsoft')) return 'microsoft';
  return null;
}
