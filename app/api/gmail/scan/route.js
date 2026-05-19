import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHeader, decodeBase64 } from "@/lib/gmail";
import { KNOWN_SERVICES, SUBSCRIPTION_KEYWORDS } from "@/lib/services";

// ═══════════════════════════════════════════════════════════════════
//  SIGNAL CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const PAYMENT_SIGNALS = [
  "you have been charged", "payment successful", "payment confirmed",
  "payment received", "invoice", "receipt", "transaction completed",
  "order confirmation", "amount paid", "charge of", "billed",
  "thanks for joining", "thank you for joining",
  "you're ready to start", "subscription is active",
  "subscription confirmed", "you've subscribed", "you have subscribed",
  "welcome to", "account information",
];

const LIFECYCLE_SIGNALS = [
  "renewal", "renew", "monthly plan", "yearly plan", "annual plan",
  "auto-renew", "auto renew", "next billing", "next billing date",
  "billing cycle", "subscription plan", "your plan",
  "\u20b9", "inr", "rs.", "upi", "mobile plan",
];

// ═══════════════════════════════════════════════════════════════════
//  CURRENCY CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const MINIMUM_AMOUNTS = {
  INR: 49,
  USD: 1,
  GBP: 1,
  EUR: 1,
  UNKNOWN: 1,
};

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
  UNKNOWN: "",
};

function detectCurrency(prefix) {
  if (!prefix) return "UNKNOWN";
  const p = prefix.trim().toUpperCase();
  if (p === "$") return "USD";
  if (p === "₹" || p.startsWith("RS") || p === "INR") return "INR";
  if (p === "£") return "GBP";
  if (p === "€") return "EUR";
  return "UNKNOWN";
}

function extractAmount(text) {
  const regex = /([\$\u20b9£€]|Rs\.?\s{0,2}|INR\s{0,2})(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i;
  const match = text.match(regex);
  if (!match) return { amount: 0, currency: "UNKNOWN" };
  const currency = detectCurrency(match[1]);
  const amount   = parseFloat(match[2].replace(/,/g, ""));
  return { amount, currency };
}

// ═══════════════════════════════════════════════════════════════════
//  CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════

function calculateConfidence(signals) {
  let score = 0;
  if (signals.paymentEmail)     score += 25;
  if (signals.keywords)         score += 10;
  if (signals.multiEmails)      score += 20;
  if (signals.recurringPattern) score += 35;
  if (signals.multipleBills)    score += 10;
  return Math.min(score, 100);
}

function classifyConfidence(pct) {
  if (pct <= 30) return "ignored";
  if (pct <= 60) return "possible";
  return "confirmed";
}

// ═══════════════════════════════════════════════════════════════════
//  EXPLANATION ENGINE
// ═══════════════════════════════════════════════════════════════════

function buildExplanation(signals, emailCount) {
  const reasons = [];
  if (signals.paymentEmail)
    reasons.push("✔ Payment receipt or invoice found");
  else
    reasons.push("⚠ No confirmed payment receipt found");

  if (signals.recurringPattern)
    reasons.push("✔ Monthly billing pattern detected");
  else if (emailCount >= 2)
    reasons.push("⚠ Multiple emails found but no recurring time pattern");
  else
    reasons.push("✖ No recurring pattern detected");

  if (signals.multiEmails)
    reasons.push(`✔ ${emailCount} emails from same merchant`);
  else
    reasons.push("✖ Only 1 email from this merchant");

  if (signals.keywords)
    reasons.push("✔ Subscription keywords detected");

  if (signals.multipleBills)
    reasons.push("✔ Multiple billing confirmations found");

  return reasons;
}

// ═══════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function extractSenderName(fromHeader) {
  const displayMatch = fromHeader.match(/^([^<]+)</);
  if (displayMatch) {
    return displayMatch[1].trim().replace(/["']/g, "").split(" ")[0];
  }
  const domainMatch = fromHeader.match(/@([\w.-]+)/);
  if (domainMatch) {
    return domainMatch[1]
      .split(".")[0]
      .replace(/^./, c => c.toUpperCase());
  }
  return "Unknown";
}

function normalizeMerchant(text) {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

function matchService(normalizedText) {
  return KNOWN_SERVICES.find((s) =>
    normalizedText.includes(s.name.toLowerCase().replace(/[^a-z]/g, ""))
  );
}

function isRecurring(dates) {
  if (dates.length < 2) return false;
  const sorted = [...dates].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i] - sorted[i - 1]) / 86_400_000);
  }
  return gaps.some((g) => g >= 25 && g <= 35) ||
         gaps.some((g) => g >= 340 && g <= 390);
}

function scoreEmail(text) {
  const lower = text.toLowerCase();
  const hasPayment   = PAYMENT_SIGNALS.some((p) => lower.includes(p));
  const hasLifecycle = LIFECYCLE_SIGNALS.some((p) => lower.includes(p));
  return { hasPayment, hasLifecycle };
}

// ═══════════════════════════════════════════════════════════════════
//  RENEWAL DATE EXTRACTION
// ═══════════════════════════════════════════════════════════════════

function extractRenewalDate(text) {
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const d = new Date(isoMatch[1]);
    if (!isNaN(d) && d > new Date()) return d;
  }

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

  const numericMatch = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if (numericMatch) {
    const d = new Date(numericMatch[0]);
    if (!isNaN(d) && d > new Date()) return d;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  ALERT LOGIC
// ═══════════════════════════════════════════════════════════════════

export function shouldAlert(nextBillingDate) {
  if (!nextBillingDate) return null;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const renewal = new Date(nextBillingDate); renewal.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((renewal - today) / 86_400_000);
  if (diffDays < 0 || diffDays > 5) return null;
  return {
    daysAway: diffDays,
    type: diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'upcoming',
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SUBSCRIPTION LIKELIHOOD GATE
// ═══════════════════════════════════════════════════════════════════

function isLikelySubscription(combinedText, isKnownService, emailCount, signals) {
  const lower = combinedText.toLowerCase();
  let score = 0;

  const RECURRING_WORDS = [
    "subscription", "membership", "auto-renew", "auto renew",
    "recurring", "billing cycle", "monthly plan", "annual plan",
    "next billing date", "renewal date", "renews on",
    "next charge", "next payment", "billed monthly", "billed annually",
    "cancel anytime", "free trial", "trial ends",
    "thanks for joining", "thank you for joining",
    "you're ready to start", "your plan", "start watching",
    "start listening", "account information",
  ];

  if (RECURRING_WORDS.some(w => lower.includes(w))) score += 2;
  if (isKnownService)                                score += 2;
  if (emailCount >= 2)                               score += 1;
  if (signals.paymentEmail && signals.keywords)      score += 1;

  return score >= 2;
}

// ═══════════════════════════════════════════════════════════════════
//  EMAIL SNIPPET EXTRACTOR
//  Pulls a clean 2-3 line preview from raw email body.
//  Used in ScanModal so user can preview email without opening Gmail.
// ═══════════════════════════════════════════════════════════════════

function extractSnippet(body) {
  if (!body) return "";

  // Remove HTML tags if any leaked through
  const clean = body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Find the most informative line — prefer lines with amounts or keywords
  const lines = clean
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 10 && l.length < 200);

  const PRIORITY_WORDS = [
    "amount", "charged", "₹", "$", "invoice", "receipt",
    "plan", "membership", "renew", "billing", "subscription",
  ];

  const priorityLine = lines.find(l =>
    PRIORITY_WORDS.some(w => l.toLowerCase().includes(w))
  );

  // Return priority line + next line for context, or first 2 lines
  const chosen = priorityLine ?? lines[0] ?? "";
  const idx    = lines.indexOf(chosen);
  const next   = lines[idx + 1] ?? "";

  return next ? `${chosen}\n${next}` : chosen;
}

// ═══════════════════════════════════════════════════════════════════
//  GMAIL SCAN ROUTE
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    const gmailQuery = SUBSCRIPTION_KEYWORDS.join(" OR ");
    console.log(`[Gmail Scan] Query: ${gmailQuery}`);

    // 1. Fetch candidate emails
    const response = await gmail.users.messages.list({
      userId: "me",
      q: gmailQuery,
      maxResults: 100,
      includeSpamTrash: false,
    });

    const messages = response.data.messages || [];
    console.log(`[Gmail Scan] Raw fetch: ${messages.length} messages found`);
    if (!messages.length) return Response.json({ subscriptions: [] });

    // Expand threads → get all individual message IDs
    const threadIds = [...new Set(messages.map(m => m.threadId))];
    const allMessageIds = [];
    for (const threadId of threadIds) {
      try {
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "minimal",
        });
        (thread.data.messages || []).forEach(m => allMessageIds.push(m.id));
      } catch (e) {
        console.error(`[Scan] Thread fetch error ${threadId}:`, e.message);
      }
    }

    // 2. Parse each email
    const parsed = await Promise.all(
      allMessageIds.map(async (msgId) => {
        try {
          const detail  = await gmail.users.messages.get({ userId: "me", id: msgId });
          const payload = detail.data.payload;
          const headers = payload.headers;

          const subject = getHeader(headers, "Subject") || "";
          const from    = getHeader(headers, "From")    || "";
          const dateStr = getHeader(headers, "Date")    || "";

          let body = "";
          if (payload.parts) {
            const part = payload.parts.find((p) => p.mimeType === "text/plain")
                      || payload.parts[0];
            body = decodeBase64(part?.body?.data || "");
          } else {
            body = decodeBase64(payload.body?.data || "");
          }

          const fullText = `${subject} ${from} ${body}`;

          const service = matchService(normalizeMerchant(fullText))
                       || matchService(normalizeMerchant(from));

          const resolvedName  = service?.name  || extractSenderName(from);
          const resolvedIcon  = service?.icon  || "📧";
          const resolvedColor = service?.color || "#6366f1";
          const resolvedCat   = service?.cat   || "Other";
          const isKnownService = !!service;

          const { hasPayment, hasLifecycle } = scoreEmail(fullText);
          const { amount, currency }          = extractAmount(fullText);
          const emailDate                     = new Date(dateStr);
          const extractedRenewalDate          = extractRenewalDate(body + " " + subject);

          // Clean snippet for preview in ScanModal
          const snippet = extractSnippet(body);

          console.log(
            `[Scan] "${subject}" | service=${resolvedName} | known=${isKnownService}` +
            ` | hasPayment=${hasPayment} | amount=${CURRENCY_SYMBOLS[currency]}${amount} (${currency})`
          );

          return {
            msgId,
            service: { name: resolvedName, icon: resolvedIcon, color: resolvedColor, cat: resolvedCat },
            emailDate: isNaN(emailDate) ? null : emailDate,
            extractedRenewalDate,
            hasPayment,
            hasLifecycle,
            amount,
            currency,
            subject,
            from,
            snippet,   // ← clean 2-line preview
            fullText,
            isKnownService,
          };
        } catch (e) {
          console.error(`[Scan] Parse error ${msgId}:`, e.message);
          return null;
        }
      })
    );

    const candidates = parsed.filter(Boolean);

    // 3. Group by service name
    const groups = {};
    for (const c of candidates) {
      const key = c.service.name;
      if (!groups[key]) {
        groups[key] = {
          service:      c.service,
          emails:       [],
          bestAmount:   0,
          bestCurrency: "UNKNOWN",
        };
      }
      groups[key].emails.push(c);
      if (c.amount > groups[key].bestAmount) {
        groups[key].bestAmount   = c.amount;
        groups[key].bestCurrency = c.currency;
      }
    }

    // 4. Score + filter + explain
    const results = [];

    for (const [name, g] of Object.entries(groups)) {
      const { emails, service, bestAmount, bestCurrency } = g;
      const emailCount   = emails.length;
      const paymentCount = emails.filter((e) => e.hasPayment).length;
      const validDates   = emails.map((e) => e.emailDate).filter(Boolean);
      const recurring    = isRecurring(validDates);

      const signals = {
        paymentEmail:     paymentCount >= 1,
        keywords:         emails.some((e) => e.hasLifecycle),
        multiEmails:      emailCount >= 2,
        recurringPattern: recurring,
        multipleBills:    paymentCount >= 2,
      };

      const combinedText        = emails.map(e => e.fullText).join(" ");
      const isKnownServiceGroup = emails.some(e => e.isKnownService);
      const hasAmount           = bestAmount > 0;

      const SUBSCRIPTION_INDICATORS = [
        "subscription", "membership", "auto-renew", "auto renew",
        "recurring", "billing cycle", "monthly plan", "annual plan",
        "next billing date", "renewal date",
        "thanks for joining", "thank you for joining",
        "you're ready to start", "your plan", "account information",
        "subscription is active", "subscription confirmed",
        "welcome to", "start watching", "start listening",
        "\u20b9", "inr", "upi", "rs.",
      ];

      const hasSubscriptionLanguage = SUBSCRIPTION_INDICATORS.some(
        kw => combinedText.toLowerCase().includes(kw)
      );

      let confidence = calculateConfidence(signals);

      if (!hasSubscriptionLanguage && !isKnownServiceGroup) {
        confidence = Math.min(confidence, 30);
      }
      if (isKnownServiceGroup && hasAmount && confidence < 35) {
        confidence = 35;
      }

      const level   = classifyConfidence(confidence);
      const reasons = buildExplanation(signals, emailCount);

      if (level === "ignored") {
        console.log(`[Scan] IGNORED "${name}" — ${confidence}%`);
        continue;
      }

      const likelySubscription = isLikelySubscription(
        combinedText, isKnownServiceGroup, emailCount, signals
      );
      if (!likelySubscription) {
        console.log(`[Scan] FILTERED "${name}" — not enough subscription signals (${confidence}%)`);
        continue;
      }

      const minAmount = MINIMUM_AMOUNTS[bestCurrency] ?? 1;
      if (bestAmount > 0 && bestAmount < minAmount && !isKnownServiceGroup) {
        console.log(
          `[Scan] FILTERED "${name}" — ${CURRENCY_SYMBOLS[bestCurrency]}${bestAmount}` +
          ` below minimum ${CURRENCY_SYMBOLS[bestCurrency]}${minAmount}`
        );
        continue;
      }

      // Renewal date
      const latest = [...emails].sort(
        (a, b) => (b.emailDate || 0) - (a.emailDate || 0)
      )[0];

      const explicitDates = emails
        .map((e) => e.extractedRenewalDate)
        .filter(Boolean)
        .sort((a, b) => b - a);

      const renewalDate =
        explicitDates[0] ||
        (latest.emailDate
          ? new Date(latest.emailDate.getTime() + 30 * 86_400_000)
          : null);

      const renewalISO = renewalDate?.toISOString().split("T")[0] || null;

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const renewal = renewalDate ? new Date(renewalDate) : null;
      if (renewal) renewal.setHours(0, 0, 0, 0);
      const daysUntilRenewal = renewal
        ? Math.ceil((renewal - today) / 86_400_000)
        : null;
      const alert = shouldAlert(renewalISO);

      // ── SOURCE EMAILS ────────────────────────────────────────────
      // Attach every email that contributed to this detection.
      // Sorted newest first so user sees most recent email at top.
      const sourceEmails = [...emails]
        .sort((a, b) => (b.emailDate || 0) - (a.emailDate || 0))
        .map(e => ({
          msgId:     e.msgId,
          subject:   e.subject,
          from:      e.from,
          date:      e.emailDate ? e.emailDate.toISOString().split("T")[0] : null,
          snippet:   e.snippet,          // 2-line body preview
          hasPayment: e.hasPayment,
          amount:    e.amount,
          currency:  e.currency,
          // Direct deep link → opens exact email in Gmail
          gmailLink: `https://mail.google.com/mail/u/0/#inbox/${e.msgId}`,
        }));

      results.push({
        // Core fields
        id:       latest.msgId,
        name:     service.name,
        icon:     service.icon,
        color:    service.color,
        amount:   bestAmount || 0,
        currency: bestCurrency,
        cycle:    "monthly",
        cat:      service.cat,
        status:   "active",
        date:     renewalISO,

        // Intelligence layer
        confidence,
        level,
        reasons,
        emailCount,
        signals:          Object.keys(signals).filter((k) => signals[k]),
        daysUntilRenewal,
        alert,
        explicitDate:     !!explicitDates[0],

        // Source email evidence — NEW
        sourceEmails,
      });
    }

    results.sort((a, b) => b.confidence - a.confidence);

    console.log(
      `[Gmail Scan] ${messages.length} emails → ${candidates.length} candidates → ${results.length} subscriptions`
    );

    return Response.json({ subscriptions: results });

  } catch (error) {
    console.error("Gmail scan error:", error);
    return Response.json({ error: "Failed to scan Gmail" }, { status: 500 });
  }
}
