'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from './supabase';
import { DEFAULT_SUBS, CATEGORY_ICONS, CATEGORY_COLORS } from './data';
import { KNOWN_SERVICES } from './services';

const SubsContext = createContext(null);
const STORAGE_KEY = 'subtrack_subs';

export function SubsProvider({ children }) {
  const { data: session } = useSession();
  const [subs, setSubs] = useState([]);
  const [toast, setToast] = useState({ visible: false, icon: '', text: '' });
  const toastTimer = useRef(null);
  const hydrated = useRef(false);

  // Helper: map DB row to App object
  const mapFromDB = (row) => ({
    id: row.id,
    name: row.service_name,
    amount: parseFloat(row.amount),
    cycle: row.billing_cycle,
    cat: row.category,
    status: row.status,
    date: row.renewal_date,
    // Derive icon/color from known services or defaults
    icon: KNOWN_SERVICES.find(s => s.name === row.service_name)?.icon || CATEGORY_ICONS[row.category] || '📦',
    color: KNOWN_SERVICES.find(s => s.name === row.service_name)?.color || CATEGORY_COLORS[row.category] || '#6b7280',
  });

  // Load subscriptions
  useEffect(() => {
    const loadData = async () => {
      if (session?.user?.id) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('renewal_date', { ascending: true });

        if (!error && data) {
          setSubs(data.map(mapFromDB));
        }
      } else if (!session) {
        // Fallback to localStorage for guests
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setSubs(parsed.subs || DEFAULT_SUBS);
          } else {
            setSubs(DEFAULT_SUBS);
          }
        } catch (_) {
          setSubs(DEFAULT_SUBS);
        }
      }
      hydrated.current = true;
    };

    loadData();
  }, [session]);

  // Sync to localStorage for guest users ONLY
  useEffect(() => {
    if (!hydrated.current || session?.user?.id) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ subs }));
  }, [subs, session]);

  const showToast = useCallback((icon, text) => {
    setToast({ visible: true, icon, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  // ── CRUD ──

  const addSub = useCallback(async (fields) => {
    const { name, amount, cycle, cat, status, date } = fields;
    
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: session.user.id,
          service_name: name,
          amount: parseFloat(amount),
          billing_cycle: cycle,
          category: cat,
          status,
          renewal_date: date,
          currency: 'USD'
        }])
        .select()
        .single();

      if (error) {
        console.error("DB Insert Error:", error);
        showToast('❌', 'Failed to save: ' + error.message);
        return;
      }
      setSubs(prev => [...prev, mapFromDB(data)]);
    } else {
      // Guest mode
      const sub = {
        id: Date.now().toString(),
        name,
        amount: parseFloat(amount),
        cycle,
        cat,
        status,
        date,
        icon: CATEGORY_ICONS[cat] || '📦',
        color: CATEGORY_COLORS[cat] || '#6b7280',
      };
      setSubs(prev => [...prev, sub]);
    }
    showToast('✅', `${name} added!`);
  }, [session, showToast]);

  const deleteSub = useCallback(async (id) => {
    const subToDelete = subs.find(s => s.id === id);
    
    if (session?.user?.id) {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) {
        showToast('❌', 'Failed to delete');
        return;
      }
    }
    
    setSubs(prev => prev.filter(x => x.id !== id));
    showToast('🗑', `${subToDelete?.name} removed`);
  }, [subs, session, showToast]);

  const togglePause = useCallback(async (id) => {
    const sub = subs.find(s => s.id === id);
    if (!sub) return;
    
    const nextStatus = sub.status === 'paused' ? 'active' : 'paused';

    if (session?.user?.id) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) {
        showToast('❌', 'Update failed');
        return;
      }
    }

    setSubs(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
    showToast(nextStatus === 'paused' ? '⏸' : '▶', `${sub.name} ${nextStatus}`);
  }, [subs, session, showToast]);

  const activate = useCallback(async (id) => {
    const sub = subs.find(s => s.id === id);
    if (!sub) return;

    if (session?.user?.id) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) {
        showToast('❌', 'Activation failed');
        return;
      }
    }

    setSubs(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    showToast('✅', `${sub.name} moved to active`);
  }, [subs, session, showToast]);

  const importAll = useCallback(async (found) => {
    if (session?.user?.id) {
      const toInsert = found.map(s => ({
        user_id: session.user.id,
        service_name: s.name,
        amount: s.amount,
        billing_cycle: s.cycle,
        category: s.cat,
        status: s.status,
        renewal_date: s.date,
        currency: 'USD'
      }));

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(toInsert)
        .select();

      if (error) {
        console.error("Bulk Import Error:", error);
        showToast('❌', 'Bulk import failed');
        return;
      }
      setSubs(prev => [...prev, ...data.map(mapFromDB)]);
    } else {
      // Guest mode
      const newSubs = found.map(s => ({
        ...s,
        id: Math.random().toString(36).substr(2, 9),
      }));
      setSubs(prev => [...prev, ...newSubs]);
    }
    showToast('🎉', `${found.length} subscriptions imported!`);
  }, [session, showToast]);

  const exportCSV = useCallback(() => {
    const rows = [
      ['Name', 'Category', 'Amount', 'Cycle', 'Status', 'Renewal Date'],
      ...subs.map(s => [s.name, s.cat, s.amount.toFixed(2), s.cycle, s.status, s.date]),
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'subtrack-export.csv';
    a.click();
    showToast('📊', 'CSV exported!');
  }, [subs, showToast]);

  return (
    <SubsContext.Provider value={{ subs, addSub, deleteSub, togglePause, activate, importAll, exportCSV, toast }}>
      {children}
    </SubsContext.Provider>
  );
}

export function useSubs() {
  const ctx = useContext(SubsContext);
  if (!ctx) throw new Error('useSubs must be used inside <SubsProvider>');
  return ctx;
}
