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
];

const LIFECYCLE_SIGNALS = [
  "renewal", "renew", "monthly plan", "yearly plan", "annual plan",
  "auto-renew", "auto renew", "next billing", "next billing date",
  "billing cycle", "subscription plan", "your plan",
];

// ═══════════════════════════════════════════════════════════════════
//  STEP 4 — CONFIDENCE SCORING (0–100)
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps detected signal flags to a 0–100 confidence percentage.
 * Each weight is calibrated so a "perfect" subscription hits 100.
 */
function calculateConfidence(signals) {
  let score = 0;

  if (signals.paymentEmail) score += 25; // Strong: real money moved
  if (signals.keywords) score += 10; // Weak: sub-related language
  if (signals.multiEmails) score += 20; // Medium: merchant consistency
  if (signals.recurringPattern) score += 35; // Strongest: time-based recurrence
  if (signals.multipleBills) score += 10; // Bonus: multiple payment receipts

  return Math.min(score, 100);
}

/**
 * 0–30  → ignored   (marketing / promo)
 * 31–60 → possible  (some evidence)
 * 61–100 → confirmed (strong recurring billing)
 */
function classifyConfidence(pct) {
  if (pct <= 30) return "ignored";
  if (pct <= 60) return "possible";
  return "confirmed";
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 4 — EXPLANATION ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * Produces an array of human-readable reason strings that explain
 * exactly why this service was (or was not) flagged as a subscription.
 * Displayed in the ScanModal so users understand the AI's reasoning.
 */
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
  const hasPayment = PAYMENT_SIGNALS.some((p) => lower.includes(p));
  const hasLifecycle = LIFECYCLE_SIGNALS.some((p) => lower.includes(p));
  return { hasPayment, hasLifecycle };
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 5A — RENEWAL DATE EXTRACTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Tries multiple patterns to extract an explicit next-billing date
 * from email body text. Returns a Date or null.
 *
 * Handles formats like:
 *   "Next billing date: Oct 4"
 *   "Your subscription renews on 12 June 2026"
 *   "You will be charged on 2026-06-04"
 *   "Renews: 04/06/2026"
 */
function extractRenewalDate(text) {
  const lower = text.toLowerCase();

  // Pattern 1: ISO date YYYY-MM-DD (most reliable)
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const d = new Date(isoMatch[1]);
    if (!isNaN(d) && d > new Date()) return d;
  }

  // Pattern 2: "dd Mon" or "dd Month yyyy" (e.g. "4 Oct" / "12 June 2026")
  const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
  const wordMatch = lower.match(
    new RegExp(`(\\d{1,2})\\s+(${MONTHS})[a-z]*(?:\\s+(\\d{4}))?`, 'i')
  );
  if (wordMatch) {
    const str = `${wordMatch[1]} ${wordMatch[2]} ${wordMatch[3] || new Date().getFullYear()}`;
    const d = new Date(str);
    if (!isNaN(d)) {
      // If the date is in the past, bump it 1 year (annual) or 1 month
      if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }

  // Pattern 3: MM/DD/YYYY or DD-MM-YYYY
  const numericMatch = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if (numericMatch) {
    const d = new Date(numericMatch[0]);
    if (!isNaN(d) && d > new Date()) return d;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 5B — ALERT LOGIC
// ═══════════════════════════════════════════════════════════════════

/**
 * Returns an alert object if the renewal is within 5 days, else null.
 * alert.type: 'today' | 'tomorrow' | 'upcoming'
 */
export function shouldAlert(nextBillingDate) {
  if (!nextBillingDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(nextBillingDate);
  renewal.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((renewal - today) / 86_400_000);

  if (diffDays < 0 || diffDays > 5) return null;
  return {
    daysAway: diffDays,
    type: diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'upcoming',
  };
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

    // 1. Fetch candidate emails
    const response = await gmail.users.messages.list({
      userId: "me",
      q: SUBSCRIPTION_KEYWORDS.join(" OR "),
      maxResults: 30,
    });

    const messages = response.data.messages || [];
    if (!messages.length) return Response.json({ subscriptions: [] });

    // 2. Parse each email
    const parsed = await Promise.all(
      messages.map(async (msg) => {
        try {
          const detail = await gmail.users.messages.get({ userId: "me", id: msg.id });
          const payload = detail.data.payload;
          const headers = payload.headers;

          const subject = getHeader(headers, "Subject") || "";
          const from = getHeader(headers, "From") || "";
          const dateStr = getHeader(headers, "Date") || "";

          let body = "";
          if (payload.parts) {
            const part = payload.parts.find((p) => p.mimeType === "text/plain") || payload.parts[0];
            body = decodeBase64(part?.body?.data || "");
          } else {
            body = decodeBase64(payload.body?.data || "");
          }

          const fullText = `${subject} ${from} ${body}`;
          const service = matchService(normalizeMerchant(fullText));
          if (!service) return null;

          const { hasPayment, hasLifecycle } = scoreEmail(fullText);

          const amountMatch = fullText.match(/(?:\$|₹|£|€|Rs\.?)\s?(\d+(?:,\d+)?(?:\.\d+)?)/i);
          const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 0;
          const emailDate = new Date(dateStr);

          // STEP 5A: Try to extract explicit renewal date from body
          const extractedRenewalDate = extractRenewalDate(body + " " + subject);

          return {
            msgId: msg.id, service,
            emailDate: isNaN(emailDate) ? null : emailDate,
            extractedRenewalDate, // explicit date from email text (may be null)
            hasPayment, hasLifecycle, amount, subject, from,
          };
        } catch (e) {
          console.error(`[Scan] Parse error ${msg.id}:`, e.message);
          return null;
        }
      })
    );

    const candidates = parsed.filter(Boolean);

    // 3. Group by service
    const groups = {};
    for (const c of candidates) {
      const key = c.service.name;
      if (!groups[key]) {
        groups[key] = { service: c.service, emails: [], bestAmount: 0 };
      }
      groups[key].emails.push(c);
      if (c.amount > groups[key].bestAmount) groups[key].bestAmount = c.amount;
    }

    // 4. Score + explain each service group
    const results = [];

    for (const [name, g] of Object.entries(groups)) {
      const { emails, service, bestAmount } = g;
      const emailCount = emails.length;
      const paymentCount = emails.filter((e) => e.hasPayment).length;
      const validDates = emails.map((e) => e.emailDate).filter(Boolean);
      const recurring = isRecurring(validDates);

      // Build signal flags for confidence + explanation
      const signals = {
        paymentEmail: paymentCount >= 1,
        keywords: emails.some((e) => e.hasLifecycle),
        multiEmails: emailCount >= 2,
        recurringPattern: recurring,
        multipleBills: paymentCount >= 2,
      };

      const confidence = calculateConfidence(signals);
      const level = classifyConfidence(confidence);
      const reasons = buildExplanation(signals, emailCount);

      if (level === "ignored") {
        console.log(`[Scan] IGNORED "${name}" — ${confidence}% (${reasons.filter(r => r.startsWith("✖")).join(" | ")})`);
        continue;
      }

      // STEP 5: Determine best renewal date
      // Priority: 1) explicit date extracted from email body
      //           2) estimated from most recent billing email + 30 days
      const latest = [...emails].sort((a, b) => (b.emailDate || 0) - (a.emailDate || 0))[0];

      // Pick the most future-facing explicit renewal date across all emails
      const explicitDates = emails
        .map((e) => e.extractedRenewalDate)
        .filter(Boolean)
        .sort((a, b) => b - a); // descending

      const renewalDate =
        explicitDates[0] ||                                          // best explicit date
        (latest.emailDate                                            // fallback estimate
          ? new Date(latest.emailDate.getTime() + 30 * 86_400_000)
          : null);

      const renewalISO = renewalDate?.toISOString().split("T")[0] || null;

      // STEP 5B: Alert flag
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const renewal = renewalDate ? new Date(renewalDate) : null;
      if (renewal) renewal.setHours(0, 0, 0, 0);
      const daysUntilRenewal = renewal ? Math.ceil((renewal - today) / 86_400_000) : null;
      const alert = shouldAlert(renewalISO);

      results.push({
        // Core subscription fields
        id: latest.msgId,
        name: service.name,
        icon: service.icon,
        color: service.color,
        amount: bestAmount || 9.99,
        cycle: "monthly",
        cat: service.cat,
        status: "active",
        date: renewalISO,

        // Intelligence layer (Steps 4 + 5)
        confidence,
        level,
        reasons,
        emailCount,
        signals: Object.keys(signals).filter((k) => signals[k]),
        daysUntilRenewal,
        alert,            // null | { daysAway, type }
        explicitDate: !!explicitDates[0], // true if we found the date in email text
      });
    }

    results.sort((a, b) => b.confidence - a.confidence);

    console.log(`[Gmail Scan] ${messages.length} emails → ${candidates.length} candidates → ${results.length} subscriptions`);

    return Response.json({ subscriptions: results });

  } catch (error) {
    console.error("Gmail scan error:", error);
    return Response.json({ error: "Failed to scan Gmail" }, { status: 500 });
  }
}
