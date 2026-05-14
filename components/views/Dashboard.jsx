'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSubs } from '@/lib/context';
import { daysTo, monthly } from '@/lib/helpers';
import MetricCard from '@/components/ui/MetricCard';
import SubRow from '@/components/ui/SubRow';

export default function Dashboard({ onOpenAdd }) {
  const { subs } = useSubs();
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState([]);
  const [dbAlerts, setDbAlerts]   = useState([]);

  // Fetch DB-backed alerts when user is signed in
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/alerts')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.alerts) setDbAlerts(d.alerts); })
      .catch(() => {});
  }, [session]);

  // Local (context) computed values
  const active  = subs.filter(s => s.status !== 'paused');
  const mo      = active.reduce((a, s) => a + monthly(s), 0);
  const trials  = subs.filter(s => s.status === 'trial');
  const paused  = subs.filter(s => s.status === 'paused');
  const sorted  = [...subs].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

  // Merge DB alerts + local urgent subs (for guests)
  const localUrgent = subs.filter(
    s => daysTo(s.date) <= 5 && daysTo(s.date) >= 0 && s.status !== 'paused'
  );
  const hasDbAlerts   = dbAlerts.length > 0;
  const alertsToShow  = hasDbAlerts ? dbAlerts : localUrgent;
  const visibleAlerts = alertsToShow.filter(a => !dismissed.includes(a.id));

  // Savings insight — cancelled / paused subscriptions
  const savedMonthly = paused.reduce((a, s) => a + monthly(s), 0);

  // Alert banner styling by type
  const alertStyle = (type) => ({
    background: type === 'today'
      ? 'rgba(255,95,95,.12)'
      : type === 'tomorrow'
      ? 'rgba(245,166,35,.10)'
      : 'rgba(79,142,247,.10)',
    borderColor: type === 'today'
      ? 'rgba(255,95,95,.35)'
      : type === 'tomorrow'
      ? 'rgba(245,166,35,.35)'
      : 'rgba(79,142,247,.35)',
  });

  const alertIcon = (type) =>
    type === 'today' ? '🔴' : type === 'tomorrow' ? '🟡' : '🔵';

  const alertLabel = (a) => {
    if (hasDbAlerts) return a.message;
    const d = daysTo(a.date);
    const lbl = d <= 0 ? 'renews TODAY' : d === 1 ? 'renews tomorrow' : `renews in ${d} days`;
    return `${a.name} ${lbl} — $${a.amount?.toFixed(2)}/${a.cycle}`;
  };

  return (
    <div className="view-enter">

      {/* ── Alert banners ── */}
      {visibleAlerts.map(a => (
        <div
          className="alert-banner"
          key={a.id}
          style={alertStyle(a.type || (daysTo(a.date) <= 0 ? 'today' : daysTo(a.date) === 1 ? 'tomorrow' : 'upcoming'))}
        >
          <span style={{ fontSize: 18 }}>{alertIcon(a.type || 'upcoming')}</span>
          <span>{alertLabel(a)}</span>
          <span className="alert-close" onClick={() => setDismissed(p => [...p, a.id])}>✕</span>
        </div>
      ))}

      {/* ── Savings insight banner ── */}
      {savedMonthly > 0 && (
        <div className="alert-banner" style={{
          background: 'rgba(0,229,160,.08)',
          borderColor: 'rgba(0,229,160,.25)',
        }}>
          <span style={{ fontSize: 18 }}>🟢</span>
          <span>
            You paused {paused.length} subscription{paused.length > 1 ? 's' : ''} —
            saving <strong style={{ color: 'var(--accent)' }}>${savedMonthly.toFixed(2)}/month</strong>
          </span>
        </div>
      )}

      {/* ── Metrics ── */}
      <div className="metrics-grid">
        <MetricCard
          label="Monthly Spend"
          value={!session ? "$24.99" : `$${mo.toFixed(2)}`}
          sub={!session ? "across all services" : (visibleAlerts.length
            ? `⚠ ${visibleAlerts.length} renewing soon`
            : 'across all services')}
          color="var(--red)"
          locked={!session}
          lockText="Sign in to see your spend"
        />
        <MetricCard
          label="Annual Projection"
          value={!session ? "$299" : `$${(mo * 12).toFixed(0)}`}
          sub="at current monthly rate"
          locked={!session}
          lockText="Sign in to view"
        />
        <MetricCard
          label="Active Subscriptions"
          value={!session ? "5" : active.length}
          sub={!session ? "total tracked" : `${subs.length} total tracked`}
          color="var(--accent)"
          locked={!session}
          lockText="Sign in to view"
        />
        <MetricCard
          label="Trials Expiring"
          value={!session ? "2" : trials.length}
          sub={!session ? "expiring soon" : (trials.length ? 'watch these carefully!' : 'no active trials')}
          color="var(--amber)"
          locked={!session}
          lockText="Sign in to view"
        />
      </div>

      {/* ── Upcoming renewals ── */}
      <div className="section-heading">
        <div className="section-title">🔔 Upcoming Renewals</div>
        {session && <button className="btn btn-ghost btn-sm">View all →</button>}
      </div>

      {!subs.length ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No subscriptions yet</div>
          {!session ? (
            <>
              <div className="empty-desc">Sign in to start tracking your subscriptions and catch upcoming renewals.</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn btn-accent" onClick={() => signIn('google')}>Sign in to get started</button>
              </div>
            </>
          ) : (
            <div className="empty-desc">Scan your Gmail inbox to get started.</div>
          )}
        </div>
      ) : (
        <>
          <div className="table-hr">
            <span>SERVICE</span><span>AMOUNT</span><span>BILLING</span><span>STATUS</span><span></span>
          </div>
          <div className="sub-list">
            {sorted.map(s => <SubRow key={s.id} sub={s} />)}
          </div>
        </>
      )}
    </div>
  );
}
