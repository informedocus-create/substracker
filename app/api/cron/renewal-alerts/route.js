import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildRenewalEmail } from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

const supabase = createClient(supabaseUrl, supabaseKey)

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function GET(request) {
  // Security: only Vercel cron (or manual curl with secret) can call this
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    const fiveDaysLater = new Date()
    fiveDaysLater.setDate(today.getDate() + 5)

    const todayStr    = today.toISOString().split('T')[0]
    const fiveDaysStr = fiveDaysLater.toISOString().split('T')[0]

    // ── Step 1: Find active subs renewing in next 5 days ──────────────────────
    const { data: renewingSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('user_email, service_name, amount, currency, renewal_date, billing_cycle, category')
      .eq('status', 'active')
      .gte('renewal_date', todayStr)
      .lte('renewal_date', fiveDaysStr)
      .order('renewal_date', { ascending: true })

    if (subError) throw subError

    if (!renewingSubs || renewingSubs.length === 0) {
      return Response.json({ message: 'No renewals found today', sent: 0 })
    }

    // ── Step 2: Group by user email ────────────────────────────────────────────
    const byUser = {}
    for (const sub of renewingSubs) {
      if (!sub.user_email) continue
      if (!byUser[sub.user_email]) byUser[sub.user_email] = []
      byUser[sub.user_email].push(sub)
    }

    // ── Step 3: Check notification preferences ────────────────────────────────
    const userEmails = Object.keys(byUser)
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_email, renewal_reminders')
      .in('user_email', userEmails)

    const prefMap = {}
    if (prefs) {
      for (const p of prefs) prefMap[p.user_email] = p
    }

    // ── Step 4: Send one email per user ───────────────────────────────────────
    let sentCount = 0
    const errors  = []

    for (const [email, subs] of Object.entries(byUser)) {
      // Default to ON if no preference row (new users always get alerts)
      const userPref = prefMap[email]
      if (userPref && userPref.renewal_reminders === false) continue

      try {
        const emailHtml = buildRenewalEmail({ email, subs, today: todayStr })

        const { data, error: resendError } = await resend.emails.send({
          from:    'SubsTracker <onboarding@resend.dev>',
          to:      email,
          subject: buildSubjectLine(subs),
          html:    emailHtml,
        })

        if (resendError) {
          errors.push({ email, error: resendError.message })
        } else {
          sentCount++
        }
      } catch (emailError) {
        errors.push({ email, error: emailError.message })
      }
    }

    return Response.json({
      message:     'Renewal alerts processed',
      sent:        sentCount,
      total_users: userEmails.length,
      errors:      errors.length > 0 ? errors : undefined,
    })

  } catch (err) {
    console.error('[Cron] renewal-alerts error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSubjectLine(subs) {
  const total    = subs.reduce((sum, s) => sum + Number(s.amount), 0)
  const currency = subs[0]?.currency || 'INR'
  const symbol   = currency === 'INR' ? '₹' : '$'

  if (subs.length === 1) {
    const days = getDaysUntil(subs[0].renewal_date)
    const when = days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`
    return `${subs[0].service_name} renews ${when} — ${symbol}${subs[0].amount}`
  }

  return `${subs.length} subscriptions renewing soon — ${symbol}${total.toLocaleString('en-IN')} total`
}

function getDaysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewal = new Date(dateStr)
  renewal.setHours(0, 0, 0, 0)
  return Math.round((renewal - today) / (1000 * 60 * 60 * 24))
}
