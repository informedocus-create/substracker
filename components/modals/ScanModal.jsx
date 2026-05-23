'use client';
import { useState, useRef } from 'react';
import { useSubs } from '@/lib/context';
import { currencySymbol } from '@/lib/helpers';

export default function ScanModal({ isOpen, onClose }) {
  const { importAll } = useSubs();
  const [phase, setPhase]           = useState('intro'); // 'intro' | 'scanning' | 'done' | 'error'
  const [steps, setSteps]           = useState({ s1: '', s2: '', s3: '' });
  const [progress, setProgress]     = useState(0);
  const [emailCount, setEmailCount] = useState('Connecting to Gmail...');
  const [found, setFound]           = useState([]);
  const [revealed, setRevealed]     = useState([]);
  const [errorMsg, setErrorMsg]     = useState('');
  const timers = useRef([]);

  const scheduleTimer = (ms, fn) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const resetState = () => {
    clearTimers();
    setPhase('intro');
    setSteps({ s1: '', s2: '', s3: '' });
    setProgress(0);
    setEmailCount('Connecting to Gmail...');
    setFound([]);
    setRevealed([]);
    setErrorMsg('');
  };

  const handleClose = () => { resetState(); onClose(); };

  const startScan = async () => {
    setPhase('scanning');

    // Step 1 — Animate auth step
    scheduleTimer(200, () => { setSteps(s => ({ ...s, s1: 'active' })); setProgress(15); });
    scheduleTimer(900, () => { setSteps(s => ({ ...s, s1: 'done', s2: 'active' })); setProgress(40); });

    // Counting animation while real API call runs
    let c = 0;
    const iv = setInterval(() => {
      c += Math.floor(Math.random() * 50) + 20;
      setEmailCount(`Scanning ${c.toLocaleString()} emails...`);
    }, 300);
    timers.current.push(iv);

    try {
      // ── REAL API CALL ──────────────────────────────────────
      const res = await fetch('/api/gmail/scan');
      clearInterval(iv);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gmail scan failed');
      }

      const data = await res.json();
      const subs = data.subscriptions || [];

      setEmailCount(`Processed emails. Detected ${subs.length} service${subs.length !== 1 ? 's' : ''}`);
      setSteps(s => ({ ...s, s2: 'done', s3: 'active' }));
      setProgress(75);

      // Step 3 — Short UX pause before showing results
      await new Promise(r => setTimeout(r, 900));
      setSteps(s => ({ ...s, s3: 'done' }));
      setProgress(100);
      setFound(subs);
      setPhase('done');

      // Stagger-reveal each result card
      subs.forEach((_, i) => {
        scheduleTimer(i * 250, () => setRevealed(r => [...r, i]));
      });

    } catch (err) {
      clearInterval(iv);
      clearTimers();
      setErrorMsg(err.message || 'Something went wrong.');
      setPhase('error');
    }
  };

  const handleImport = () => {
    importAll(found);
    handleClose();
  };

  const stepCls = (key) =>
    steps[key] === 'done'   ? 'scan-step done' :
    steps[key] === 'active' ? 'scan-step active-step' : 'scan-step';

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title">📧 Scan Gmail Inbox</div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
              Substracker reads your Gmail for real subscription receipts.{' '}
              <strong style={{ color: 'var(--text)' }}>We never store your emails.</strong>{' '}
              OAuth only — your password is never shared.
            </p>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                What we scan for
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.9 }}>
                ✓ Receipt &amp; invoice emails<br />
                ✓ &ldquo;Your subscription&rdquo; notifications<br />
                ✓ Free trial confirmation emails<br />
                ✓ Billing cycle reminders
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
              <button className="btn btn-accent" onClick={startScan}>🔍 Start Scan</button>
            </div>
          </div>
        )}

        {/* ── SCANNING / DONE ── */}
        {(phase === 'scanning' || phase === 'done') && (
          <div>
            <div className="scan-steps">
              <div className={stepCls('s1')}>
                <span className="scan-step-icon">🔐</span>
                <div>
                  <div className="scan-step-label">Authenticating with Google</div>
                  <div className="scan-step-sub">Secure OAuth 2.0</div>
                </div>
                {steps.s1 === 'done' && <span className="scan-check">✓</span>}
              </div>
              <div className={stepCls('s2')}>
                <span className="scan-step-icon">📨</span>
                <div>
                  <div className="scan-step-label">Reading inbox</div>
                  <div className="scan-step-sub">{emailCount}</div>
                </div>
                {steps.s2 === 'done' && <span className="scan-check">✓</span>}
              </div>
              <div className={stepCls('s3')}>
                <span className="scan-step-icon">🤖</span>
                <div>
                  <div className="scan-step-label">Extracting subscriptions</div>
                  <div className="scan-step-sub">Detecting services &amp; amounts</div>
                </div>
                {steps.s3 === 'done' && <span className="scan-check">✓</span>}
              </div>
            </div>

            <div className="progress-wrap">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {phase === 'done' && (
              <div>
                <div className="scan-found-wrap">
                  <div className="scan-found-hdr">
                    {found.length > 0
                      ? `🎉 ${found.length} Subscription${found.length > 1 ? 's' : ''} Detected`
                      : '🔍 Scan Complete'}
                  </div>
                  {found.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
                      No new subscriptions detected in your inbox.
                    </div>
                  ) : (
                    found.map((sub, i) => revealed.includes(i) && (
                      <div className="scan-found-item" key={sub.id ?? sub.name} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>

                        {/* Top row: icon + name + confidence badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                            background: `${sub.color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                          }}>
                            {sub.icon}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                              {sub.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                              {sub.amount > 0
                                ? `${currencySymbol(sub.currency)}${sub.amount.toFixed(2)}/${sub.cycle}`
                                : sub.cycle
                              }
                              {sub.emailCount > 0 && ` · ${sub.emailCount} email${sub.emailCount > 1 ? 's' : ''} found`}
                            </div>
                          </div>

                          {/* Confidence badge */}
                          <div style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: sub.level === 'confirmed'
                              ? 'rgba(0,229,160,.15)' : 'rgba(245,166,35,.15)',
                            color: sub.level === 'confirmed'
                              ? 'var(--accent)' : 'var(--amber)',
                            border: `1px solid ${sub.level === 'confirmed'
                              ? 'rgba(0,229,160,.3)' : 'rgba(245,166,35,.3)'}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {sub.level === 'confirmed' ? '🟢' : '🟡'} {sub.confidence}%
                          </div>
                        </div>

                        {/* Confidence bar */}
                        <div style={{
                          height: 4, borderRadius: 4,
                          background: 'var(--surface3)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${sub.confidence}%`,
                            borderRadius: 4,
                            background: sub.level === 'confirmed'
                              ? 'var(--accent)' : 'var(--amber)',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>

                        {/* Reason bullets — always shown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {(Array.isArray(sub.reasons) && sub.reasons.length > 0
                            ? sub.reasons
                            : (() => {
                                const sig = Array.isArray(sub.signals) ? sub.signals : [];
                                const bullets = [];
                                bullets.push(sig.includes('paymentEmail')
                                  ? '✔ Payment receipt or invoice found'
                                  : '✖ No confirmed payment receipt found');
                                bullets.push(sig.includes('recurringPattern')
                                  ? '✔ Monthly billing pattern detected'
                                  : sub.emailCount >= 2
                                    ? '⚠ Multiple emails found but no recurring time pattern'
                                    : '✖ No recurring pattern detected');
                                bullets.push(sig.includes('multiEmails')
                                  ? `✔ ${sub.emailCount || 'Multiple'} emails from same merchant`
                                  : '✖ Only 1 email from this merchant');
                                if (sig.includes('keywords'))
                                  bullets.push('✔ Subscription keywords detected');
                                if (sig.includes('multipleBills'))
                                  bullets.push('✔ Multiple billing confirmations found');
                                return bullets;
                              })()
                          ).map((reason, ri) => (
                            <div key={ri} style={{
                              fontSize: 11,
                              color: reason.startsWith('✔')
                                ? 'var(--accent)'
                                : reason.startsWith('⚠')
                                  ? 'var(--amber)'
                                  : 'var(--text3)',
                              lineHeight: 1.5,
                            }}>
                              {reason}
                            </div>
                          ))}
                        </div>

                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={handleClose}>Skip</button>
                  {found.length > 0 && (
                    <button className="btn btn-accent" onClick={handleImport}>Add All Found Subs</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div>
            <div style={{
              background: 'rgba(255,95,95,.08)',
              border: '1px solid rgba(255,95,95,.25)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              fontSize: 13, color: 'var(--red)',
            }}>
              ⚠️ {errorMsg}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              Make sure you are signed in with Google and have granted Gmail access.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
              <button className="btn btn-blue" onClick={() => { resetState(); startScan(); }}>
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
