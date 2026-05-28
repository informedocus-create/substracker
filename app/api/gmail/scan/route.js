import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHeader, decodeBase64 } from "@/lib/gmail";
import { KNOWN_SERVICES } from "@/lib/services";
import {
  scoreSubscription,
  extractRenewalDate,
  resolveMerchantKey,
  MERCHANT_DB,
} from "@/lib/subscriptionDetector";

// ═══════════════════════════════════════════════════════════════════
//  GMAIL QUERY  (Layer 1 — Email Filter)
//  Broadened to capture billing emails across ALL Gmail tabs.
//  category:purchases is sparsely populated in Indian inboxes —
//  most billing emails land in Primary or Updates instead.
//  The keyword arm catches those without requiring Gmail to categorise them.
// ═══════════════════════════════════════════════════════════════════
const GMAIL_QUERY = [
  // Gmail-categorised receipts (works well for US/EU inboxes)
  "category:purchases",
  "label:^smartlabel_receipt",
  // Subject-line signals that billing emails almost always contain
  "subject:(invoice)",
  "subject:(receipt)",
  "subject:(subscription)",
  "subject:(billing)",
  'subject:("payment successful")',
  'subject:("payment confirmed")',
  'subject:("amount charged")',
  'subject:("order confirmation")',
  'subject:("membership")',
  'subject:("auto-renewal")',
  'subject:("auto renew")',
  'subject:("renewed successfully")',
  'subject:("tax invoice")',
  'subject:("billed")',
  // Indian billing signals
  "subject:(₹)",
  "subject:(INR)",
  "subject:(UPI)",
].join(" OR ") + " newer_than:12m";

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

function extractSenderName(fromHeader) {
  const displayMatch = fromHeader.match(/^([^<]+)</);
  if (displayMatch) {
    return displayMatch[1].trim().replace(/['"]/g, "").split(" ")[0];
  }
  const domainMatch = fromHeader.match(/@([\w.-]+)/);
  if (domainMatch) {
    return domainMatch[1].split(".")[0].replace(/^./, (c) => c.toUpperCase());
  }
  return "Unknown";
}

function normalizeMerchant(text) {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

function matchKnownService(normalizedText) {
  return KNOWN_SERVICES.find((s) =>
    normalizedText.includes(s.name.toLowerCase().replace(/[^a-z]/g, ""))
  );
}

function extractSnippet(body) {
  if (!body) return "";
  const clean = body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const lines = clean
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && l.length < 200);
  const PRIORITY = [
    "amount", "charged", "₹", "$", "invoice", "receipt",
    "plan", "membership", "renew", "billing", "subscription",
  ];
  const priority = lines.find((l) =>
    PRIORITY.some((w) => l.toLowerCase().includes(w))
  );
  const chosen = priority ?? lines[0] ?? "";
  const idx = lines.indexOf(chosen);
  const next = lines[idx + 1] ?? "";
  return next ? `${chosen}\n${next}` : chosen;
}

// ═══════════════════════════════════════════════════════════════════
//  GMAIL SCAN ROUTE
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return Response.json({ error: 'Unauthorized: Please sign in with Google to use Gmail scan.' }, { status: 401 });
    }

    // ── Build Gmail client ──────────────────────────────────────────
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    console.log(`[Gmail Scan] Query: ${GMAIL_QUERY}`);

    // ── Layer 1: Fetch filtered emails ──────────────────────────────
    const response = await gmail.users.messages.list({
      userId: "me",
      q: GMAIL_QUERY,
      maxResults: 300,          // larger pool — broad query needs more headroom
      includeSpamTrash: false,
    });

    const messages = response.data.messages || [];
    console.log(`[Layer 1] ${messages.length} qualifying messages`);

    if (!messages.length) {
      return Response.json({
        subscriptions: [],
        stats: { fetched: 0, candidates: 0, confirmed: 0, possible: 0, ignored: 0 },
      });
    }

    // ── Expand threads ──────────────────────────────────────────────
    // Deduplicate thread IDs first, then deduplicate message IDs after
    // expansion — a message can appear in both category:purchases AND
    // a label, so it could be returned twice by messages.list.
    const threadIds = [...new Set(messages.map((m) => m.threadId))];
    const seenMsgIds = new Set();   // ← guard against cross-label duplicates
    const allMessageIds = [];

    for (const threadId of threadIds) {
      try {
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "minimal",
        });
        for (const m of thread.data.messages || []) {
          if (!seenMsgIds.has(m.id)) {
            seenMsgIds.add(m.id);
            allMessageIds.push(m.id);
          }
        }
      } catch (e) {
        console.error(`[Thread] ${threadId}:`, e.message);
      }
    }

    // ── Parse individual emails ─────────────────────────────────────
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
            const part =
              payload.parts.find((p) => p.mimeType === "text/plain") ||
              payload.parts[0];
            body = decodeBase64(part?.body?.data || "");
          } else {
            body = decodeBase64(payload.body?.data || "");
          }

          const fullText = `${subject} ${from} ${body}`;
          const service  =
            matchKnownService(normalizeMerchant(fullText)) ||
            matchKnownService(normalizeMerchant(from));

          const resolvedName  = service?.name  || extractSenderName(from);
          const resolvedIcon  = service?.icon  || "📧";
          const resolvedColor = service?.color || "#6366f1";
          const resolvedCat   = service?.cat   || "Other";

          const emailDate          = new Date(dateStr);
          const extractedRenewalDate = extractRenewalDate(`${body} ${subject}`);
          const snippet            = extractSnippet(body);

          return {
            msgId,
            service: { name: resolvedName, icon: resolvedIcon, color: resolvedColor, cat: resolvedCat },
            from,
            subject,
            body,
            snippet,
            emailDate: isNaN(emailDate) ? null : emailDate,
            extractedRenewalDate,
          };
        } catch (e) {
          console.error(`[Parse] ${msgId}:`, e.message);
          return null;
        }
      })
    );

    const candidates = parsed.filter(Boolean);
    console.log(`[Layer 1→2] ${candidates.length} emails parsed`);

    // ── Group by merchant name ──────────────────────────────────────
    const groups = {};
    for (const c of candidates) {
      const key = c.service.name;
      if (!groups[key]) {
        groups[key] = { service: c.service, emails: [] };
      }
      // Attach fields the detector needs
      groups[key].emails.push({
        msgId:       c.msgId,
        from:        c.from,
        subject:     c.subject,
        body:        c.body,
        snippet:     c.snippet,
        emailDate:   c.emailDate,
        extractedRenewalDate: c.extractedRenewalDate,
      });
    }

    // ── Run 6-layer scorer per merchant group ───────────────────────
    const confirmed = [];
    const possible  = [];
    const ignored   = [];

    for (const [name, g] of Object.entries(groups)) {
      const { emails, service } = g;

      // Resolve this merchant against our DB
      const merchantKey = resolveMerchantKey(name) || resolveMerchantKey(
        emails[0]?.from || ""
      );

      // Run the full 6-layer pipeline
      const result = scoreSubscription(emails, merchantKey);

      console.log(
        `[Score] "${name}" → ${result.score}% (${result.verdict}) | signals: ${result.signals.join(", ")}`
      );

      // Compute renewal date
      const explicitDates = emails
        .map((e) => e.extractedRenewalDate)
        .filter(Boolean)
        .sort((a, b) => b - a);

      const latest = [...emails].sort(
        (a, b) => (b.emailDate || 0) - (a.emailDate || 0)
      )[0];

      const renewalDate =
        explicitDates[0] ||
        (latest?.emailDate
          ? new Date(latest.emailDate.getTime() + 30 * 86_400_000)
          : null);

      const renewalISO = renewalDate
        ? renewalDate.toISOString().split("T")[0]
        : null;

      // Look up MERCHANT_DB metadata for icon/color/cat fallback
      const dbEntry = MERCHANT_DB[merchantKey] || {};

      const sub = {
        // Core identity
        id:       latest?.msgId || `sub_${Date.now()}_${Math.random()}`,
        name:     service.name,
        icon:     dbEntry.icon  || service.icon,
        color:    dbEntry.color || service.color,
        cat:      dbEntry.cat   || service.cat,

        // Financial
        amount:   result.amount,
        currency: result.currency,
        cycle:    result.cycle || "monthly",
        date:     renewalISO,
        status:   "active",

        // Intelligence
        score:      result.score,
        verdict:    result.verdict,
        signals:    result.signals,
        emailCount: emails.length,

        // Full pipeline trace for visualizer
        pipelineTrace: result.trace,

        // Source emails for drill-down
        sourceEmails: [...emails]
          .sort((a, b) => (b.emailDate || 0) - (a.emailDate || 0))
          .map((e) => ({
            msgId:      e.msgId,
            subject:    e.subject,
            from:       e.from,
            date:       e.emailDate ? e.emailDate.toISOString().split("T")[0] : null,
            snippet:    e.snippet,
            gmailLink:  `https://mail.google.com/mail/u/0/#inbox/${e.msgId}`,
          })),
      };

      if (result.verdict === "confirmed")   confirmed.push(sub);
      else if (result.verdict === "possible") possible.push(sub);
      else                                    ignored.push(sub);
    }

    // Sort by score desc within each bucket
    confirmed.sort((a, b) => b.score - a.score);
    possible.sort((a, b) => b.score - a.score);

    const stats = {
      fetched:   messages.length,
      candidates: candidates.length,
      confirmed:  confirmed.length,
      possible:   possible.length,
      ignored:    ignored.length,
    };

    console.log(
      `[Gmail Scan] Done — ${stats.confirmed} confirmed, ${stats.possible} possible, ${stats.ignored} ignored`
    );

    return Response.json({
      subscriptions: [...confirmed, ...possible],   // keeps backward compat
      confirmed,
      possible,
      ignored,                                       // full data for "see why"
      stats,
    });
  } catch (error) {
    console.error('Gmail scan error:', error);

    // Surface a classifiable error message to the frontend
    const msg = error?.message || '';
    const code = error?.code || error?.status || 0;

    if (code === 401 || msg.includes('invalid_grant') || msg.includes('token')) {
      return Response.json(
        { error: 'Unauthorized: Your session has expired. Please sign in again.' },
        { status: 401 }
      );
    }
    if (code === 403 || msg.includes('insufficient') || msg.includes('permission') || msg.includes('scope')) {
      return Response.json(
        { error: 'Insufficient permissions: Gmail read access was not granted.' },
        { status: 403 }
      );
    }
    if (code === 429 || msg.includes('quota') || msg.includes('rate')) {
      return Response.json(
        { error: 'Quota exceeded: Gmail API rate limit reached. Please try again in a minute.' },
        { status: 429 }
      );
    }
    if (msg.includes('ENOTFOUND') || msg.includes('fetch') || msg.includes('network') || msg.includes('timeout')) {
      return Response.json(
        { error: 'Network error: Could not reach Gmail. Check your internet connection.' },
        { status: 503 }
      );
    }

    return Response.json(
      { error: `Failed to scan Gmail: ${msg || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
