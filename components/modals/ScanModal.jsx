'use client';
import { useState, useRef } from 'react';
import { useSubs } from '@/lib/context';
import { currencySymbol } from '@/lib/helpers';

// Confidence badge
function ConfidenceBadge({ level, confidence }) {
  const styles = {
    confirmed: { bg: 'rgba(0, 229, 160, 0.15)', color: 'var(--accent)', label: 'Confirmed' },
    possible:  { bg: 'rgba(245, 166, 35, 0.15)', color: 'var(--amber)', label: 'Possible'  },
    ignored:   { bg: 'rgba(255, 95, 95, 0.15)', color: 'var(--red)', label: 'Low' },
  };
  const s = styles[level] ?? styles.possible;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, padding: "3px 8px",
      borderRadius: 999, fontWeight: 700, whiteSpace: "nowrap",
      border: `1.5px solid ${s.color}33`,
    }}>
      {s.label} {confidence}%
    </span>
  );
}

// Single source email row inside the expanded evidence panel
function SourceEmailRow({ email }) {
  const sym = currencySymbol(email.currency);

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: "12px 14px",
      borderBottom: "1px solid var(--border)",
    }}>
      {/* Top row: subject + date + payment badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1, minWidth: 0 }}>
          {email.subject || "(no subject)"}
        </span>
        <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap" }}>
          {email.date ?? "—"}
        </span>
        {email.hasPayment && (
          <span style={{
            fontSize: 11, padding: "1px 7px", borderRadius: 999,
            background: "rgba(0,229,160,.15)", color: "var(--accent)", whiteSpace: "nowrap",
          }}>
            💳 Payment
          </span>
        )}
        {email.amount > 0 && (
          <span style={{
            fontSize: 11, padding: "1px 7px", borderRadius: 999,
            background: "rgba(79,142,247,.15)", color: "#60a5fa", whiteSpace: "nowrap",
          }}>
            {sym}{email.amount.toFixed(2)}
          </span>
        )}
      </div>

      {/* From */}
      <div style={{ fontSize: 11, color: "var(--text3)" }}>
        From: {email.from}
      </div>

      {/* Snippet preview */}
      {email.snippet && (
        <div style={{
          fontSize: 12, color: "var(--text2)", fontFamily: "monospace",
          background: "var(--surface3)", borderRadius: 6,
          padding: "8px 10px", whiteSpace: "pre-wrap", lineHeight: 1.6,
          marginTop: 2,
          border: "1px solid var(--border)",
        }}>
          {email.snippet}
        </div>
      )}

      {/* Open in Gmail button */}
      <a
        href={email.gmailLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          marginTop: 4, width: "fit-content",
          fontSize: 12, color: "var(--accent)",
          textDecoration: "none", fontWeight: 500,
        }}
        onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
        onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Open in Gmail
      </a>
    </div>
  );
}

// Service detection card
function ServiceCard({ sub, onToggle, isSelected }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const sym = currencySymbol(sub.currency);

  return (
    <div style={{
      background: "var(--surface)",
      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
      borderRadius: 12, overflow: "hidden",
      transition: "border-color 0.15s, background-color 0.15s",
      marginBottom: 10,
    }}>
      {/* ── Card header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px",
      }}>
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
        />

        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: sub.color + "22",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {sub.icon}
        </div>

        {/* Name + category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
            {sub.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>
            {sub.cat}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
            {sub.amount > 0 ? `${sym}${sub.amount.toFixed(2)}` : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>/ month</div>
        </div>
        {/* Open in Gmail deep-link button */}
        <a
          href={`https://mail.google.com/mail/u/0/#inbox/${sub.id}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open latest email in Gmail"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--surface3)",
            border: "1.5px solid var(--border)",
            color: "var(--text2)",
            textDecoration: "none",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--surface2)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "var(--surface3)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text2)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>

        {/* Confidence badge */}
        <ConfidenceBadge level={sub.level} confidence={sub.confidence} />
      </div>

      {/* ── Reasons/Signals detected ── */}
      <div style={{
        padding: "0px 16px 14px 66px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
          Detection Signals
        </div>
        {sub.reasons.map((r, i) => {
          const isSuccess = r.startsWith("✔") || r.startsWith("✓");
          const isWarning = r.startsWith("⚠");
          
          let textColor = "var(--text2)";
          let iconColor = "var(--text3)";
          let iconSymbol = "✕";
          
          if (isSuccess) {
            textColor = "var(--text)";
            iconColor = "var(--accent)";
            iconSymbol = "✓";
          } else if (isWarning) {
            textColor = "var(--text2)";
            iconColor = "var(--amber)";
            iconSymbol = "⚠";
          }

          const cleanText = r.slice(2);

          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ color: iconColor, fontSize: 13, fontWeight: "bold", display: "inline-flex", width: 14, flexShrink: 0 }}>
                {iconSymbol}
              </span>
              <span style={{ color: textColor }}>{cleanText}</span>
            </div>
          );
        })}
      </div>

      {/* ── Evidence toggle button ── */}
      <button
        onClick={() => setShowEvidence(v => !v)}
        style={{
          width: "100%", padding: "10px 16px",
          background: "var(--surface2)",
          border: "none", borderTop: "1px solid var(--border)",
          color: "var(--accent)", fontSize: 12, fontWeight: 600,
          cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: 6,
          transition: "background-color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--surface3)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--surface2)"}
      >
        <span>📧</span>
        {showEvidence
          ? "Hide source emails"
          : `View ${sub.emailCount} source email${sub.emailCount > 1 ? "s" : ""} that triggered this detection`}
        <span style={{ marginLeft: "auto", fontSize: 10 }}>
          {showEvidence ? "▲" : "▼"}
        </span>
      </button>      {/* ── Evidence panel — source emails ── */}
      {showEvidence && (
        <div style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}>
          {/* Panel header */}
          <div style={{
            padding: "8px 14px",
            fontSize: 11, color: "var(--text3)", fontWeight: 600,
            borderBottom: "1px solid var(--border)",
            background: "var(--surface3)",
          }}>
            SOURCE EMAILS — click "Open in Gmail" to view the exact email
          </div>

          {/* Email rows */}
          {(sub.sourceEmails ?? []).length > 0
            ? sub.sourceEmails.map((email, i) => (
                <SourceEmailRow key={email.msgId ?? i} email={email} />
              ))
            : (
              <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--text3)" }}>
                No source email details available.
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

export default function ScanModal({ isOpen, onClose }) {
  const { importAll } = useSubs();
  const [phase, setPhase]           = useState('intro'); // 'intro' | 'scanning' | 'done' | 'error'
  const [steps, setSteps]           = useState({ s1: '', s2: '', s3: '' });
  const [progress, setProgress]     = useState(0);
  const [emailCount, setEmailCount] = useState('Connecting to Gmail...');
  const [found, setFound]           = useState([]);
  const [selected, setSelected]     = useState(new Set());
  const [importing, setImporting]   = useState(false);
  const [done, setDone]             = useState(false);
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
    setSelected(new Set());
    setImporting(false);
    setDone(false);
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
      setSelected(new Set(subs.map(s => s.name)));
      setPhase('done');

    } catch (err) {
      clearInterval(iv);
      clearTimers();
      setErrorMsg(err.message || 'Something went wrong.');
      setPhase('error');
    }
  };

  function toggleAll() {
    setSelected(prev =>
      prev.size === found.length
        ? new Set()
        : new Set(found.map(s => s.name))
    );
  }

  function toggleOne(name) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  const handleImport = async () => {
    setImporting(true);
    const toImport = found.filter(s => selected.has(s.name));
    await importAll(toImport);
    setImporting(false);
    setDone(true);
    setTimeout(handleClose, 1200);
  };

  const stepCls = (key) =>
    steps[key] === 'done'   ? 'scan-step done' :
    steps[key] === 'active' ? 'scan-step active-step' : 'scan-step';

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal" style={{ maxWidth: phase === 'done' ? 680 : 460 }}>
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

        {/* ── SCANNING / PROGRESS ── */}
        {phase === 'scanning' && (
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
          </div>
        )}

        {/* ── DONE (RESULTS VIEW) ── */}
        {phase === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontSize: 12, color: 'var(--text3)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10
            }}>
              <span>
                {found.filter(s => s.level === 'confirmed').length} confirmed · {found.filter(s => s.level === 'possible').length} possible
              </span>
              <button
                onClick={toggleAll}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
                }}
              >
                {selected.size === found.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div style={{
              overflowY: 'auto', display: 'flex', flexDirection: 'column',
              maxHeight: '52vh', paddingRight: 4, marginBottom: 16
            }}>
              {found.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 14 }}>
                  No subscriptions detected in your inbox.
                </div>
              ) : (
                found.map(sub => (
                  <ServiceCard
                    key={sub.name}
                    sub={sub}
                    isSelected={selected.has(sub.name)}
                    onToggle={() => toggleOne(sub.name)}
                  />
                ))
              )}
            </div>

            <div style={{
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10,
            }}>
              <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500 }}>
                {selected.size} of {found.length} selected
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleImport}
                  disabled={selected.size === 0 || importing || done}
                  style={{
                    background: done ? "#1a3a1a" : "",
                    color: done ? "#4ade80" : "",
                    opacity: selected.size === 0 ? 0.5 : 1,
                  }}
                >
                  {done
                    ? "✓ Imported!"
                    : importing
                      ? "Importing…"
                      : `Add ${selected.size} subscription${selected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
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
