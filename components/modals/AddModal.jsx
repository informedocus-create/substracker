'use client';
import { useState, useRef, useEffect } from 'react';
import { useSubs } from '@/lib/context';
import { nd, CURRENCIES } from '@/lib/helpers';
import { INDIAN_SERVICES, CATEGORY_ICONS } from '@/lib/indianServices';

const CATEGORIES = ['Entertainment', 'Productivity', 'Music', 'Cloud Storage', 'AI Tools', 'News & Media', 'Fitness', 'Education', 'Other'];

const defaultForm = () => ({
  name: '', amount: '', cycle: 'monthly',
  cat: 'Entertainment', status: 'active',
  date: nd(30), tdays: '',
  currency: 'INR',
});

// Flat list of all services with their default plan pre-selected
const SERVICE_OPTIONS = INDIAN_SERVICES.map(s => ({
  id: s.id,
  name: s.name,
  category: s.category,
  color: s.color,
  amount: s.plans[s.defaultPlan].amount,
  cycle: s.plans[s.defaultPlan].cycle,
}));

export default function AddModal({ isOpen, onClose }) {
  const { addSub } = useSubs();
  const [form, setForm] = useState(defaultForm());
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Filter services by query
  const filtered = query.length > 0
    ? SERVICE_OPTIONS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : SERVICE_OPTIONS.slice(0, 8);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectService(service) {
    setSelectedService(service);
    setQuery(service.name);
    setShowDropdown(false);
    setForm(f => ({
      ...f,
      name: service.name,
      amount: service.amount,
      cycle: service.cycle,
      cat: service.category,
      currency: 'INR',
    }));
  }

  function clearService() {
    setSelectedService(null);
    setQuery('');
    setForm(f => ({ ...f, name: '' }));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const handleSubmit = () => {
    if (!form.name.trim())            return alert('Please enter a service name');
    if (!form.amount || +form.amount <= 0) return alert('Please enter a valid amount');
    if (!form.date)                   return alert('Please select a renewal date');
    addSub(form);
    handleClose();
  };

  const handleClose = () => {
    setForm(defaultForm());
    setQuery('');
    setSelectedService(null);
    setShowDropdown(false);
    onClose();
  };

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Subscription</div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {/* ── Service picker ─────────────────────────────────────── */}
        <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
          <label className="form-label">Service Name *</label>

          {selectedService ? (
            // Selected state — show chip with clear button
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--accent)',
              background: 'var(--surface)',
              cursor: 'default',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: selectedService.color,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedService.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {CATEGORY_ICONS[selectedService.category]} {selectedService.category}
                </div>
              </div>
              <button
                onClick={clearService}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16, padding: 4,
                }}
              >✕</button>
            </div>
          ) : (
            // Search input
            <>
              <input
                ref={inputRef}
                className="form-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowDropdown(true); set('name', e.target.value); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search Netflix, Spotify… or type any name"
                autoComplete="off"
              />

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0, right: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  zIndex: 200,
                  overflow: 'hidden',
                  marginTop: 4,
                }}>
                  {/* Quick-pick header */}
                  <div style={{
                    padding: '8px 14px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {query ? 'Matching services' : 'Popular services'}
                  </div>

                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {filtered.length > 0 ? filtered.map(service => (
                      <button
                        key={service.id}
                        onMouseDown={() => selectService(service)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s',
                          color: 'inherit',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover, rgba(255,255,255,0.06))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {/* Color dot */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: service.color, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14,
                        }}>
                          {CATEGORY_ICONS[service.category]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{service.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {service.category} · ₹{service.amount.toLocaleString('en-IN')}/{service.cycle === 'yearly' ? 'yr' : 'mo'}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: 'var(--accent)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}>
                          Auto-fill →
                        </div>
                      </button>
                    )) : (
                      <div style={{ padding: '14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                        No match — we'll use "{query}" as the name
                      </div>
                    )}
                  </div>

                  {/* Type manually hint */}
                  <div style={{
                    padding: '8px 14px',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center',
                  }}>
                    Don't see it? Just type the name and fill in details below
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Amount + Billing Cycle ──────────────────────────────── */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                className="form-select"
                style={{ width: 90, flexShrink: 0 }}
                value={form.currency}
                onChange={e => set('currency', e.target.value)}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                className="form-input"
                type="number" step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Billing Cycle</label>
            <select className="form-select" value={form.cycle} onChange={e => set('cycle', e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* ── Category + Status ───────────────────────────────────── */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.cat} onChange={e => set('cat', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="trial">Free Trial</option>
            </select>
          </div>
        </div>

        {/* ── Renewal Date ────────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Next Renewal Date</label>
          <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>

        {form.status === 'trial' && (
          <div className="form-group">
            <label className="form-label">Trial Days Remaining</label>
            <input className="form-input" type="number" value={form.tdays} onChange={e => set('tdays', e.target.value)} placeholder="e.g. 14" />
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleSubmit}>Add Subscription</button>
        </div>
      </div>
    </div>
  );
}
