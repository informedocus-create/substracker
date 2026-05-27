// lib/emailTemplates.js
// Clean, professional renewal alert email

export function buildRenewalEmail({ email, subs, today }) {
  const total    = subs.reduce((sum, s) => sum + Number(s.amount), 0)
  const currency = subs[0]?.currency || 'INR'
  const symbol   = currency === 'INR' ? '₹' : '$'

  const subRows = subs.map(sub => {
    const days      = getDaysUntil(sub.renewal_date, today)
    const urgency   = days === 0 ? '#E53E3E' : days <= 2 ? '#DD6B20' : '#38A169'
    const daysLabel = days === 0 ? 'TODAY' : days === 1 ? 'Tomorrow' : `${days} days`
    const catIcon   = getCategoryIcon(sub.category)

    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #F0EDE6;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px">${catIcon}</span>
            <div>
              <div style="font-size:15px;font-weight:600;color:#1A1814;">${sub.service_name}</div>
              <div style="font-size:12px;color:#8A8478;margin-top:2px;">${sub.billing_cycle || 'monthly'}</div>
            </div>
          </div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #F0EDE6;text-align:right;vertical-align:middle;">
          <div style="font-size:16px;font-weight:700;color:#1A1814;">${symbol}${Number(sub.amount).toLocaleString('en-IN')}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #F0EDE6;text-align:right;vertical-align:middle;">
          <span style="
            background:${urgency}22;
            color:${urgency};
            font-size:11px;
            font-weight:700;
            padding:4px 10px;
            border-radius:20px;
            letter-spacing:0.05em;
            white-space:nowrap;
          ">${daysLabel}</span>
        </td>
      </tr>
    `
  }).join('')

  const headerText = subs.length === 1
    ? `${subs[0].service_name} is renewing soon`
    : `${subs.length} subscriptions renewing soon`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Renewal Reminder — SubsTracker</title>
</head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px 40px;">

    <!-- Header -->
    <div style="background:#1A1814;border-radius:16px 16px 0 0;padding:28px 32px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#FF6B35;margin-bottom:10px;">
        SubsTracker · Renewal Alert
      </div>
      <div style="font-size:22px;font-weight:700;color:#F7F5F0;line-height:1.3;">
        ${headerText}
      </div>
      <div style="font-size:14px;color:rgba(247,245,240,0.5);margin-top:6px;">
        Heads up — here's what's coming up for you
      </div>
    </div>

    <!-- Column headers -->
    <div style="background:#FAFAF8;border-left:1px solid #E5E0D8;border-right:1px solid #E5E0D8;padding:10px 16px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8478;padding-bottom:10px;border-bottom:2px solid #E5E0D8;">Service</td>
          <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8478;padding-bottom:10px;border-bottom:2px solid #E5E0D8;text-align:right;">Amount</td>
          <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8478;padding-bottom:10px;border-bottom:2px solid #E5E0D8;text-align:right;">Renews</td>
        </tr>
      </table>
    </div>

    <!-- Subscription rows -->
    <div style="background:#FFFFFF;border-left:1px solid #E5E0D8;border-right:1px solid #E5E0D8;">
      <table style="width:100%;border-collapse:collapse;">
        ${subRows}
      </table>
    </div>

    <!-- Total bar -->
    <div style="background:#FF6B35;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);">Total incoming</span>
      <span style="font-size:22px;font-weight:800;color:#FFFFFF;">${symbol}${total.toLocaleString('en-IN')}</span>
    </div>

    <!-- CTA -->
    <div style="background:#FFFFFF;border:1px solid #E5E0D8;border-top:none;padding:24px 32px;border-radius:0 0 16px 16px;">
      <a href="https://substrcker-rho.vercel.app/dashboard"
         style="display:block;text-align:center;background:#1A1814;color:#F7F5F0;text-decoration:none;padding:14px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:10px;">
        View my dashboard →
      </a>
      ${subs.length === 1 ? `
      <a href="https://substrcker-rho.vercel.app/dashboard"
         style="display:block;text-align:center;background:#F7F5F0;color:#8A8478;text-decoration:none;padding:12px;border-radius:10px;font-size:13px;border:1px solid #E5E0D8;">
        Manage ${subs[0].service_name}
      </a>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 0;">
      <p style="font-size:12px;color:#B0A898;margin:0;line-height:1.8;">
        You're receiving this because you enabled renewal reminders in SubsTracker.<br>
        <a href="https://substrcker-rho.vercel.app/dashboard" style="color:#8A8478;text-decoration:none;">Manage notifications</a>
      </p>
    </div>

  </div>
</body>
</html>
  `
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr, todayStr) {
  const today   = new Date(todayStr)
  const renewal = new Date(dateStr)
  today.setHours(0, 0, 0, 0)
  renewal.setHours(0, 0, 0, 0)
  return Math.round((renewal - today) / (1000 * 60 * 60 * 24))
}

function getCategoryIcon(category) {
  const icons = {
    'Entertainment':   '🎬',
    'Music':           '🎵',
    'Productivity':    '📝',
    'Cloud Storage':   '☁️',
    'AI Tools':        '🤖',
    'News & Media':    '📰',
    'Fitness':         '💪',
    'Education':       '📚',
    'Finance':         '📈',
    'Gaming':          '🎮',
    'Communication':   '💬',
    'Developer Tools': '🛠️',
    'Other':           '📦',
  }
  return icons[category] || '📦'
}
