'use client';
import { useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSubs } from '@/lib/context';
import { currencySymbol } from '@/lib/helpers';

// ── Layer metadata (display config only) ───────────────────────────
const LAYER_META = [
  { id: 1, icon: '📧', name: 'Email Filter',        desc: 'Scanning purchase receipts & invoices' },
  { id: 2, icon: '🏪', name: 'Merchant Recognition', desc: 'Validating billing sender domains' },
  { id: 3, icon: '💳', name: 'Payment Extraction',   desc: 'Detecting amounts & currencies' },
  { id: 4, icon: '🔁', name: 'Recurring Analysis',   desc: 'Checking 28–31 day billing gaps' },
  { id: 5, icon: '⚖️', name: 'Confidence Scoring',   desc: 'Weighted signal system' },
  { id: 6, icon: '✅', name: 'User Confirmation',    desc: 'Routing by confidence threshold' },
];

// ── Verdict badge helper ────────────────────────────────────────────
function VerdictBadge({ score }) {
  if (score >= 80) return (
    <span className="verdict-badge verdict-confirmed">🟢 {score}% Confirmed</span>
  );
  if (score >= 50) return (
    <span className="verdict-badge verdict-possible">🟡 {score}% Possible</span>
  );
  return <span className="verdict-badge verdict-ignore">🔴 {score}% Filtered</span>;
}

// ── Single pipeline layer trace row ────────────────────────────────
function TraceRow({ step }) {
  const icon  = step.status === 'pass' ? '✓' : step.status === 'warn' ? '⚠' : '✗';
  const cls   = `trace-row trace-${step.status}`;
  const delta = step.delta > 0 ? `+${step.delta}` : step.delta < 0 ? `${step.delta}` : '';
  return (
    <div className={cls}>
      <span className="trace-icon">{icon}</span>
      <span className="trace-layer-name">L{step.layer} {step.name}</span>
      <span className="trace-detail">{step.detail}</span>
      {delta && <span className="trace-delta">{delta}</span>}
    </div>
  );
}

// ── Subscription result card ────────────────────────────────────────
function SubResultCard({ sub, mode, onConfirm, onReject, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const sym = currencySymbol(sub.currency);

  return (
    <div
      className={`result-card${mode === 'confirmed' && selected ? ' result-selected' : ''}${mode === 'ignored' ? ' result-ignored' : ''}`}
    >
      {/* Card header */}
      <div className="result-card-header">
        {mode === 'confirmed' && (
          <input
            type="checkbox"
            className="result-checkbox"
            checked={selected}
            onChange={onToggle}
          />
        )}
        <div
          className="result-icon"
          style={{ background: `${sub.color}22`, color: sub.color }}
        >
          {sub.icon}
        </div>
        <div className="result-info">
          <div className="result-name">{sub.name}</div>
          <div className="result-detail">
            {sub.amount > 0
              ? `${sym}${sub.amount.toFixed(2)}/${sub.cycle} · ${sub.emailCount} email${sub.emailCount !== 1 ? 's' : ''}`
              : `${sub.emailCount} email${sub.emailCount !== 1 ? 's' : ''} · no amount detected`}
          </div>
        </div>
        <VerdictBadge score={sub.score} />
        <button
          className="trace-toggle"
          onClick={() => setExpanded(v => !v)}
          title="Show pipeline trace"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Possible-mode actions */}
      {mode === 'possible' && (
        <div className="result-actions">
          <button className="btn btn-sm btn-accent" onClick={() => onConfirm(sub)}>
            ✓ Add It
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => onReject(sub.id)}>
            ✗ Not a subscription
          </button>
        </div>
      )}

      {/* Pipeline trace (expandable) */}
      {expanded && sub.pipelineTrace && (
        <div className="pipeline-trace">
          <div className="trace-header">6-Layer Detection Trace</div>
          {sub.pipelineTrace.map((step, i) => (
            <TraceRow key={i} step={step} />
          ))}
          {/* Source emails */}
          {sub.sourceEmails?.length > 0 && (
            <div className="trace-emails">
              <div className="trace-emails-label">Source Emails ({sub.sourceEmails.length})</div>
              {sub.sourceEmails.slice(0, 3).map((e, i) => (
                <a
                  key={i}
                  href={e.gmailLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trace-email-link"
                >
                  <span className="trace-email-date">{e.date}</span>
                  <span className="trace-email-subject">{e.subject}</span>
                  <span className="trace-email-arrow">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN MODAL
// ═══════════════════════════════════════════════════════════════════

export default function ScanModal({ isOpen, onClose }) {
  const { importAll, addSub } = useSubs();
  const { data: session, status } = useSession();
  const isGuest = status !== 'loading' && !session;

  const [phase,    setPhase]    = useState('intro');
  const [layerIdx, setLayerIdx] = useState(-1);        // which layer is currently "active"
  const [progress, setProgress] = useState(0);
  const [liveMsg,  setLiveMsg]  = useState('Initialising...');
  const [stats,    setStats]    = useState(null);
  const [confirmed, setConfirmed] = useState([]);
  const [possible,  setPossible]  = useState([]);
  const [ignored,   setIgnored]   = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set()); // confirmed tab checkboxes
  const [dismissedIds, setDismissedIds] = useState(new Set()); // possible tab dismissals
  const [activeTab,  setActiveTab]  = useState('confirmed');
  const [ignoredOpen, setIgnoredOpen] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const timers = useRef([]);

  // ── Timer management ────────────────────────────────────────────
  const t = (ms, fn) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // ── Reset ───────────────────────────────────────────────────────
  const resetState = () => {
    clearTimers();
    setPhase('intro');
    setLayerIdx(-1);
    setProgress(0);
    setLiveMsg('Initialising...');
    setStats(null);
    setConfirmed([]);
    setPossible([]);
    setIgnored([]);
    setSelectedIds(new Set());
    setDismissedIds(new Set());
    setActiveTab('confirmed');
    setIgnoredOpen(false);
    setErrorMsg('');
  };

  const handleClose = () => { resetState(); onClose(); };

  // ── Animate pipeline layers 1-6 sequentially ────────────────────
  const animatePipeline = (msgs) => {
    const layerMsgs = msgs || [
      'Filtering Gmail purchase receipts…',
      'Checking merchant billing domains…',
      'Extracting payment amounts & currencies…',
      'Analysing recurring billing intervals…',
      'Running weighted confidence scoring…',
      'Routing results by confidence threshold…',
    ];
    layerMsgs.forEach((msg, i) => {
      t(i * 600, () => {
        setLayerIdx(i);
        setLiveMsg(msg);
        setProgress(Math.round(((i + 1) / 6) * 75));   // 0→75% during pipeline
      });
    });
  };

  // ── Start scan ──────────────────────────────────────────────
  const startScan = async () => {
    // Guest guard: Gmail scan requires an authenticated Google session.
    // Don't hit the API — surface a friendly inline prompt instead.
    if (isGuest) {
      setPhase('guest');
      return;
    }

    setPhase('scanning');
    setLayerIdx(0);
    animatePipeline();

    try {
      const res = await fetch('/api/gmail/scan');

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gmail scan failed');
      }

      const data = await res.json();

      // Wait until at least layer 4 animation has played (~2.4 s)
      const minDelay = new Promise(r => setTimeout(r, 2500));
      await minDelay;

      // Finish animation
      setLayerIdx(5);
      setProgress(85);
      setLiveMsg('Building results…');
      await new Promise(r => setTimeout(r, 700));
      setProgress(100);

      const conf = data.confirmed  || [];
      const poss = data.possible   || [];
      const ign  = data.ignored    || [];

      setConfirmed(conf);
      setPossible(poss);
      setIgnored(ign);
      setStats(data.stats || {
        fetched: 0, candidates: 0,
        confirmed: conf.length,
        possible:  poss.length,
        ignored:   ign.length,
      });

      // Pre-select all confirmed subs (user can deselect)
      setSelectedIds(new Set(conf.map(s => s.id)));

      // Default to first non-empty tab
      setActiveTab(conf.length ? 'confirmed' : poss.length ? 'possible' : 'ignored');

      setPhase('done');

    } catch (err) {
      clearTimers();
      setErrorMsg(err.message || 'Something went wrong.');
      setPhase('error');
    }
  };

  // ── Bulk import confirmed (selected only) ───────────────────────
  const handleAddConfirmed = () => {
    const toAdd = confirmed.filter(s => selectedIds.has(s.id));
    if (toAdd.length) importAll(toAdd);
    handleClose();
  };

  // ── Individual possible-sub confirm ────────────────────────────
  const handleConfirmOne = (sub) => {
    addSub({
      name:     sub.name,
      amount:   sub.amount,
      cycle:    sub.cycle,
      cat:      sub.cat,
      status:   'active',
      date:     sub.date,
      currency: sub.currency,
    });
    setDismissedIds(prev => new Set([...prev, sub.id]));
  };

  const handleRejectOne = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visiblePossible = possible.filter(s => !dismissedIds.has(s.id));

  // ── Layer card component (inline for scan phase) ─────────────────
  const LayerCard = ({ meta, index }) => {
    const state =
      index < layerIdx ? 'done' :
      index === layerIdx ? 'active' : 'idle';

    return (
      <div className={`pipeline-layer pipeline-${state}`}>
        <div className="pipeline-layer-left">
          <div className="pipeline-layer-icon">{meta.icon}</div>
          <div>
            <div className="pipeline-layer-name">Layer {meta.id} — {meta.name}</div>
            <div className="pipeline-layer-desc">
              {state === 'active' ? liveMsg : meta.desc}
            </div>
          </div>
        </div>
        <div className="pipeline-layer-status">
          {state === 'done'   && <span className="layer-check">✓</span>}
          {state === 'active' && <span className="layer-spinner" />}
          {state === 'idle'   && <span className="layer-dot" />}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal scan-modal">
        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-title">🔍 Gmail Detection Engine</div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {/* ════════════════════════════════════════════
            PHASE: INTRO
        ════════════════════════════════════════════ */}
        {phase === 'intro' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
              The <strong style={{ color: 'var(--text)' }}>6-layer detection engine</strong> scans
              only receipt & invoice emails from the last 12 months.{' '}
              <strong style={{ color: 'var(--text)' }}>Your emails are never stored.</strong>
            </p>

            {/* Pipeline preview */}
            <div className="pipeline-preview">
              {LAYER_META.map((meta, i) => (
                <div key={meta.id} className="pipeline-preview-row">
                  <div className="pipeline-preview-badge">L{meta.id}</div>
                  <div className="pipeline-preview-icon">{meta.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{meta.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{meta.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scoring legend */}
            <div className="score-legend">
              <div className="score-legend-item confirmed-item">🟢 80+ Confirmed — pre-selected for you</div>
              <div className="score-legend-item possible-item">🟡 50–79 Possible — needs your confirmation</div>
              <div className="score-legend-item ignore-item">🔴 &lt;50 Filtered — hidden by default</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
              <button className="btn btn-accent" onClick={startScan}>🚀 Start Detection</button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            PHASE: SCANNING
        ════════════════════════════════════════════ */}
        {phase === 'guest' && (
          <div>
            <div style={{
              background: 'rgba(79,142,247,.07)',
              border: '1px solid rgba(79,142,247,.25)',
              borderRadius: 12, padding: '20px',
              textAlign: 'center', marginBottom: 20,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                Google Sign-In Required
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 0 }}>
                The Gmail Detection Engine needs access to your Google account
                to scan receipts and invoices.{' '}
                <strong style={{ color: 'var(--text)' }}>Your emails are never stored.</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
              <button
                className="btn btn-accent"
                onClick={() => signIn('google')}
              >
                Sign in with Google →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            PHASE: SCANNING
        ════════════════════════════════════════════ */}
        {phase === 'scanning' && (
          <div>
            <div className="pipeline-live">
              {LAYER_META.map((meta, i) => (
                <LayerCard key={meta.id} meta={meta} index={i} />
              ))}
            </div>
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
              {liveMsg}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            PHASE: DONE
        ════════════════════════════════════════════ */}
        {phase === 'done' && (
          <div>
            {/* Stats bar */}
            {stats && (
              <div className="scan-stats">
                <div className="scan-stat">
                  <div className="scan-stat-value">{stats.fetched}</div>
                  <div className="scan-stat-label">Emails Scanned</div>
                </div>
                <div className="scan-stat-div" />
                <div className="scan-stat confirmed-stat">
                  <div className="scan-stat-value">{stats.confirmed}</div>
                  <div className="scan-stat-label">Confirmed</div>
                </div>
                <div className="scan-stat-div" />
                <div className="scan-stat possible-stat">
                  <div className="scan-stat-value">{stats.possible}</div>
                  <div className="scan-stat-label">Possible</div>
                </div>
                <div className="scan-stat-div" />
                <div className="scan-stat">
                  <div className="scan-stat-value">{stats.ignored}</div>
                  <div className="scan-stat-label">Filtered</div>
                </div>
              </div>
            )}

            {/* Tab switcher */}
            <div className="result-tabs">
              <button
                className={`result-tab${activeTab === 'confirmed' ? ' active' : ''}`}
                onClick={() => setActiveTab('confirmed')}
              >
                🟢 Confirmed ({confirmed.length})
              </button>
              <button
                className={`result-tab${activeTab === 'possible' ? ' active' : ''}`}
                onClick={() => setActiveTab('possible')}
              >
                🟡 Possible ({visiblePossible.length})
              </button>
              <button
                className={`result-tab${activeTab === 'ignored' ? ' active' : ''}`}
                onClick={() => setActiveTab('ignored')}
              >
                🔴 Filtered ({ignored.length})
              </button>
            </div>

            {/* ── Confirmed tab ── */}
            {activeTab === 'confirmed' && (
              <div className="result-list">
                {confirmed.length === 0 ? (
                  <div className="result-empty">No confirmed subscriptions found</div>
                ) : (
                  <>
                    <div className="result-hint">
                      Pre-selected below. Uncheck any you don't want, then click{' '}
                      <strong>Add Selected</strong>.
                    </div>
                    <div className="result-select-all">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === confirmed.length}
                          onChange={() => {
                            if (selectedIds.size === confirmed.length) setSelectedIds(new Set());
                            else setSelectedIds(new Set(confirmed.map(s => s.id)));
                          }}
                        />
                        {' '}Select all ({confirmed.length})
                      </label>
                    </div>
                    {confirmed.map(sub => (
                      <SubResultCard
                        key={sub.id}
                        sub={sub}
                        mode="confirmed"
                        selected={selectedIds.has(sub.id)}
                        onToggle={() => toggleSelect(sub.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── Possible tab ── */}
            {activeTab === 'possible' && (
              <div className="result-list">
                {visiblePossible.length === 0 ? (
                  <div className="result-empty">
                    {possible.length === 0
                      ? 'No subscriptions in the "possible" range'
                      : 'All possible subscriptions have been reviewed ✓'}
                  </div>
                ) : (
                  visiblePossible.map(sub => (
                    <SubResultCard
                      key={sub.id}
                      sub={sub}
                      mode="possible"
                      onConfirm={handleConfirmOne}
                      onReject={handleRejectOne}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Filtered / Ignored tab ── */}
            {activeTab === 'ignored' && (
              <div className="result-list">
                {ignored.length === 0 ? (
                  <div className="result-empty">Nothing was filtered out</div>
                ) : (
                  <>
                    <div className="ignored-summary">
                      <span>🔇 {ignored.length} merchant{ignored.length !== 1 ? 's' : ''} silently filtered (score &lt; 50)</span>
                      <button
                        className="see-why-btn"
                        onClick={() => setIgnoredOpen(v => !v)}
                      >
                        {ignoredOpen ? 'Hide reasons ▲' : 'See why ▼'}
                      </button>
                    </div>
                    {ignoredOpen && ignored.map(sub => (
                      <SubResultCard
                        key={sub.id}
                        sub={sub}
                        mode="ignored"
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Footer actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" onClick={handleClose}>
                Close
              </button>
              {activeTab === 'confirmed' && selectedIds.size > 0 && (
                <button className="btn btn-accent" onClick={handleAddConfirmed}>
                  ➕ Add Selected ({selectedIds.size})
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            PHASE: ERROR
        ════════════════════════════════════════════ */}
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
