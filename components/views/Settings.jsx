'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSubs, useCurrency } from '@/lib/context';
import { CURRENCIES } from '@/lib/helpers';

const TOGGLES = [
  {
    key:   'renewal_reminders',
    label: 'Renewal Reminders',
    desc:  'Email alert 5 days before any subscription renews',
  },
  {
    key:   'trial_expiry_alerts',
    label: 'Trial Expiry Alerts',
    desc:  'Alert before a free trial ends so you can cancel in time',
  },
  {
    key:   'weekly_summary',
    label: 'Weekly Spending Summary',
    desc:  'Every Monday — your subscription spend overview',
  },
  {
    key:   'unused_service_alerts',
    label: 'Unused Service Alerts',
    desc:  "Alert when a subscription has been paused for 30+ days",
  },
];

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 44, height: 24,
        borderRadius: 12,
        border: 'none',
        background: on ? 'var(--accent, #FF6B35)' : 'var(--border, #E5E0D8)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18,
        borderRadius: '50%',
        background: '#FFFFFF',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function Settings({ onOpenScan }) {
  const { exportCSV } = useSubs();
  const { data: session } = useSession();
  const { code, setCurrency } = useCurrency();

  const [prefs, setPrefs] = useState({
    renewal_reminders:     true,
    trial_expiry_alerts:   true,
    weekly_summary:        false,
    unused_service_alerts: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Load preferences from API on mount
  useEffect(() => {
    if (!session) return;
    fetch('/api/notifications/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPrefs(p => ({ ...p, ...data })); })
      .catch(() => {});
  }, [session]);

  async function handleToggle(key) {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    setSaved(false);

    try {
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}

    setSaving(false);
  }

  return (
    <div className="view-enter">

      {/* ── Notifications ─────────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Notifications</div>

        {!session && (
          <div style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            padding: '10px 0',
            marginBottom: 8,
          }}>
            Sign in to save your notification preferences.
          </div>
        )}

        {TOGGLES.map(t => (
          <div key={t.key} className="settings-row">
            <div>
              <div className="settings-row-label">{t.label}</div>
              <div className="settings-row-desc">{t.desc}</div>
            </div>
            <Toggle
              on={prefs[t.key]}
              onClick={() => session && handleToggle(t.key)}
            />
          </div>
        ))}

        {saving && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Saving...
          </div>
        )}
        {saved && (
          <div style={{ fontSize: 12, color: '#38A169', marginTop: 6 }}>
            ✓ Preferences saved
          </div>
        )}
      </div>

      {/* ── Connected Accounts ────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Connected Accounts</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">📧 Gmail</div>
            <div className="settings-row-desc">Auto-scan receipts and subscription emails</div>
          </div>
          <button className="btn btn-blue btn-sm" onClick={onOpenScan}>Connect</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">🏦 Bank Account</div>
            <div className="settings-row-desc">Link bank via Plaid to catch missed subscriptions</div>
          </div>
          <button className="btn btn-blue btn-sm" onClick={onOpenScan}>Connect</button>
        </div>
      </div>

      {/* ── Account ───────────────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Account</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Currency</div>
            <div className="settings-row-desc">Display currency for all amounts</div>
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
            value={code}
            onChange={e => setCurrency(e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Export Data</div>
            <div className="settings-row-desc">Download all subscription data as CSV</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

    </div>
  );
}
