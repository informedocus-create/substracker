'use client';
import Toggle from '@/components/ui/Toggle';
import { useSubs } from '@/lib/context';

export default function Settings({ onOpenScan }) {
  const { exportCSV } = useSubs();

  return (
    <div className="view-enter">
      {/* Notifications */}
      <div className="settings-section">
        <div className="settings-section-title">Notifications</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Renewal Reminders</div>
            <div className="settings-row-desc">3 days before each renewal</div>
          </div>
          <Toggle defaultOn />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Trial Expiry Alerts</div>
            <div className="settings-row-desc">Alert when a free trial is ending soon</div>
          </div>
          <Toggle defaultOn />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Weekly Spending Summary</div>
            <div className="settings-row-desc">Weekly digest of your subscription spend</div>
          </div>
          <Toggle />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Unused Service Alerts</div>
            <div className="settings-row-desc">Alert when you haven&apos;t used a service in 30+ days</div>
          </div>
          <Toggle defaultOn />
        </div>
      </div>

      {/* Connected Accounts */}
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
            <div className="settings-row-label">📬 Outlook</div>
            <div className="settings-row-desc">Connect Microsoft email for scanning</div>
          </div>
          <button className="btn btn-ghost btn-sm">Connect</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">🏦 Bank Account</div>
            <div className="settings-row-desc">Link bank via Plaid to catch missed subscriptions</div>
          </div>
          <button className="btn btn-ghost btn-sm">Connect</button>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section">
        <div className="settings-section-title">Account</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Plan</div>
            <div className="settings-row-desc">You&apos;re on the Pro plan — $4.99/month</div>
          </div>
          <button className="btn btn-ghost btn-sm">Manage</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Currency</div>
            <div className="settings-row-desc">Display currency for all amounts</div>
          </div>
          <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}>
            <option>USD ($)</option>
            <option>EUR (€)</option>
            <option>GBP (£)</option>
            <option>AED (د.إ)</option>
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
