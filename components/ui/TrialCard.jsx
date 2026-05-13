'use client';
import { useSubs } from '@/lib/context';
import { daysTo, fmtDate } from '@/lib/helpers';

export default function TrialCard({ sub }) {
  const { deleteSub, activate } = useSubs();
  const d = sub.tdays ?? daysTo(sub.date);
  const urgency = d <= 2 ? 'urgent' : d <= 5 ? 'warning' : '';
  const col = d <= 2 ? 'var(--red)' : d <= 5 ? 'var(--amber)' : 'var(--accent)';

  return (
    <div className={`trial-card ${urgency}`}>
      <div className="trial-top">
        <span style={{ fontSize: 28 }}>{sub.icon}</span>
        <div style={{ textAlign: 'right' }}>
          <div className="trial-days" style={{ color: col }}>{d}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>days left</div>
        </div>
      </div>
      <div className="trial-name">{sub.name}</div>
      <div className="trial-detail">{sub.cat} · Converts {fmtDate(sub.date)}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>
        Charges ${sub.amount.toFixed(2)}/{sub.cycle} after trial
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => deleteSub(sub.id)}>
          Cancel Trial
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => activate(sub.id)}>
          Keep It
        </button>
      </div>
    </div>
  );
}
