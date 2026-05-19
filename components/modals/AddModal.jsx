'use client';
import { useState } from 'react';
import { useSubs } from '@/lib/context';
import { nd, CURRENCIES } from '@/lib/helpers';

const CATEGORIES = ['Entertainment', 'Productivity', 'Music', 'Cloud Storage', 'AI Tools', 'News & Media', 'Fitness', 'Education', 'Other'];

const defaultForm = () => ({
  name: '', amount: '', cycle: 'monthly',
  cat: 'Entertainment', status: 'active',
  date: nd(30), tdays: '',
  currency: 'INR',   // default to INR for Indian users
});

export default function AddModal({ isOpen, onClose }) {
  const { addSub } = useSubs();
  const [form, setForm] = useState(defaultForm());

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim())       return alert('Please enter a service name');
    if (!form.amount || +form.amount <= 0) return alert('Please enter a valid amount');
    if (!form.date)              return alert('Please select a renewal date');
    addSub(form);
    setForm(defaultForm());
    onClose();
  };

  const handleClose = () => {
    setForm(defaultForm());
    onClose();
  };

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Subscription</div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Service Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Netflix, Spotify..." />
        </div>

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
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

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
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

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
