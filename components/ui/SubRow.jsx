'use client';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { useSubs, useCurrency } from '@/lib/context';
import { daysTo, fmtDate, currencySymbol } from '@/lib/helpers';
import { getCancelGuide } from '@/lib/cancelGuides';
import CancelGuideModal from '@/components/modals/CancelGuideModal';

export default function SubRow({ sub }) {
  const { deleteSub, togglePause } = useSubs();
  const { symbol: displaySymbol } = useCurrency();
  // Show the subscription's own currency symbol; fall back to display currency
  const symbol = currencySymbol(sub.currency) || displaySymbol;
  const [showCancel, setShowCancel] = useState(false);
  const d = daysTo(sub.date);
  const hasGuide = !!getCancelGuide(sub.name);

  let dateEl;
  if (d <= 0)       dateEl = <span style={{ color: 'var(--red)' }}>Today</span>;
  else if (d === 1) dateEl = <span style={{ color: 'var(--amber)' }}>Tomorrow</span>;
  else              dateEl = <span style={{ color: 'var(--text2)' }}>{sub.date ? fmtDate(sub.date) : '—'}</span>;

  return (
    <>
      <div className="sub-row">
        <div className="sn-cell">
          <div className="sub-icon" style={{ background: `${sub.color}22` }}>{sub.icon}</div>
          <div>
            <div className="sub-name-text">{sub.name}</div>
            <div className="sub-cat">{sub.cat}</div>
          </div>
        </div>
        <div className="sub-amount">{symbol}{(parseFloat(sub.amount) || 0).toFixed(2)} <span>/{sub.cycle}</span></div>
        <div>{dateEl}</div>
        <div><Badge status={sub.status} daysLeft={d} /></div>
        <div className="sub-actions">
          <button
            className="action-btn"
            onClick={() => togglePause(sub.id)}
            title={sub.status === 'paused' ? 'Resume' : 'Pause'}
          >
            {sub.status === 'paused' ? '▶' : '⏸'}
          </button>
          <button
            className="action-btn cancel-btn"
            onClick={() => setShowCancel(true)}
            title={hasGuide ? 'Cancel guide available' : 'Cancel / Remove'}
            style={{ color: hasGuide ? 'var(--red)' : 'var(--text3)' }}
          >
            {hasGuide ? '🗑✦' : '🗑'}
          </button>
        </div>
      </div>

      <CancelGuideModal
        sub={sub}
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
      />
    </>
  );
}

