'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSubs, useCurrency } from '@/lib/context';
import { monthly, currencySymbol } from '@/lib/helpers';
import { getCancelGuide } from '@/lib/cancelGuides';
import SubRow from '@/components/ui/SubRow';
import CancelGuideModal from '@/components/modals/CancelGuideModal';

export default function Subscriptions({ onOpenAdd }) {
  const { subs } = useSubs();
  const { data: session } = useSession();
  const { symbol } = useCurrency();
  const [saveModeOn, setSaveModeOn] = useState(false);
  const [cancelSub, setCancelSub]   = useState(null);

  // "Save Money" suggestions: active subs with a cancel guide available
  // sorted by monthly cost descending (most expensive first)
  const saveSuggestions = subs
    .filter(s => s.status === 'active' && getCancelGuide(s.name))
    .sort((a, b) => monthly(b) - monthly(a));

  // Group saveable amounts by currency — no conversion
  const saveGrouped = saveSuggestions.reduce((acc, s) => {
    const cur = s.currency || 'INR';
    acc[cur] = (acc[cur] || 0) + monthly(s);
    return acc;
  }, {});
  const totalDisplay = Object.entries(saveGrouped)
    .map(([c, v]) => `${currencySymbol(c)}${v.toFixed(2)}`).join('  ·  ') || '—';
  const annualDisplay = Object.entries(saveGrouped)
    .map(([c, v]) => `${currencySymbol(c)}${(v * 12).toFixed(0)}`).join('  ·  ') || '—';

  return (
    <div className="view-enter">

      {/* Header */}
      <div className="section-heading" style={{ marginBottom: 16 }}>
        <div className="section-title">All Subscriptions</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${saveModeOn ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setSaveModeOn(v => !v)}
          >
            💰 {saveModeOn ? 'Exit Save Mode' : 'Save Money Mode'}
          </button>
        </div>
      </div>

      {/* ── SAVE MONEY MODE ── */}
      {saveModeOn && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.2)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              Potential Monthly Savings
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
              {totalDisplay}/mo
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              If you cancelled all subscriptions below · {annualDisplay}/year saved
            </div>
          </div>

          {saveSuggestions.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: 16 }}>
              No guided cancellations available for your current subscriptions.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {saveSuggestions.map(sub => {
                const guide = getCancelGuide(sub.name);
                return (
                  <div key={sub.id} className="save-item" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '12px 16px',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: `${sub.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {sub.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {symbol}{monthly(sub).toFixed(2)}/mo · {guide.method === 'website' ? '🌐 Web cancel' : '📱 App cancel'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--red)' }}>
                        {symbol}{monthly(sub).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>per month</div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setCancelSub(sub)}
                    >
                      Cancel Guide →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ALL SUBSCRIPTIONS TABLE ── */}
      {!subs.length ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No subscriptions added</div>
          {!session ? (
            <>
              <div className="empty-desc">Sign in to add subscriptions and unlock money-saving features.</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn btn-accent" onClick={() => signIn('google')}>Sign in</button>
              </div>
            </>
          ) : (
            <div className="empty-desc">Scan your email to find subscriptions.</div>
          )}
        </div>
      ) : (
        <>
          <div className="table-hr">
            <span>SERVICE</span><span>AMOUNT</span><span>BILLING</span><span>STATUS</span><span></span>
          </div>
          <div className="sub-list">
            {subs.map(s => <SubRow key={s.id} sub={s} />)}
          </div>
        </>
      )}

      {/* Save-mode cancel guide modal */}
      <CancelGuideModal
        sub={cancelSub}
        isOpen={!!cancelSub}
        onClose={() => setCancelSub(null)}
      />
    </div>
  );
}
