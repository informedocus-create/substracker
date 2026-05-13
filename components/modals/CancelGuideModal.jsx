'use client';
import { useState } from 'react';
import { useSubs } from '@/lib/context';
import { getCancelGuide } from '@/lib/cancelGuides';
import { monthly } from '@/lib/helpers';

export default function CancelGuideModal({ sub, isOpen, onClose }) {
  const { deleteSub } = useSubs();
  const [step, setStep] = useState('guide'); // 'guide' | 'confirm'
  const guide = sub ? getCancelGuide(sub.name) : null;

  if (!isOpen || !sub) return null;

  const handleConfirmCancel = () => {
    deleteSub(sub.id);
    onClose();
    setStep('guide');
  };

  const handleClose = () => {
    setStep('guide');
    onClose();
  };

  const methodBadge = {
    website: { icon: '🌐', label: 'Via Website' },
    app:     { icon: '📱', label: 'Via App' },
    chat:    { icon: '💬', label: 'Via Live Chat' },
    phone:   { icon: '📞', label: 'Via Phone' },
  };
  const method = methodBadge[guide?.method] || { icon: '🌐', label: 'Via Website' };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: `${sub.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {sub.icon}
            </div>
            <div>
              <div className="modal-title" style={{ marginBottom: 2 }}>Cancel {sub.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                ${sub.amount?.toFixed(2)}/{sub.cycle} · ${(monthly(sub) * 12).toFixed(0)}/year
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {step === 'guide' && (
          <>
            {guide ? (
              <>
                {/* Method + direct link */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface3)', borderRadius: 10, padding: '12px 16px',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{method.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        Cancel {method.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        Fastest method for {guide.name}
                      </div>
                    </div>
                  </div>
                  <a
                    href={guide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent btn-sm"
                  >
                    Open Page →
                  </a>
                </div>

                {/* Step-by-step */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    Step-by-Step Guide
                  </div>
                  {guide.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent)', color: '#000',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, marginTop: 1,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{s}</div>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                {guide.warning && (
                  <div style={{
                    background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.25)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                    fontSize: 13, color: 'var(--amber)', lineHeight: 1.6,
                  }}>
                    ⚠️ {guide.warning}
                  </div>
                )}

                {/* Savings alternative */}
                {guide.savings && (
                  <div style={{
                    background: 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.2)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 20,
                    fontSize: 13, color: 'var(--accent)', lineHeight: 1.6,
                  }}>
                    💡 <strong>Cheaper alternative:</strong> {guide.savings}
                  </div>
                )}
              </>
            ) : (
              /* No guide available */
              <div style={{
                background: 'var(--surface3)', borderRadius: 10, padding: '20px 16px',
                textAlign: 'center', marginBottom: 20,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  No cancellation guide yet
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Search for &ldquo;how to cancel {sub.name}&rdquo; online, or check their website&apos;s account settings.
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={handleClose}>Keep It</button>
              <button
                className="btn btn-danger"
                onClick={() => setStep('confirm')}
              >
                Remove from SubTrack
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <div>
            <div style={{
              background: 'rgba(255,95,95,.08)', border: '1px solid rgba(255,95,95,.25)',
              borderRadius: 10, padding: '16px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Remove {sub.name} from SubTrack?
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                This only removes it from your dashboard. You still need to cancel it directly with {sub.name} to stop being charged.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setStep('guide')}>← Back</button>
              <button className="btn btn-danger" onClick={handleConfirmCancel}>Yes, Remove It</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
