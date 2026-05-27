'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from './supabase';
import { DEFAULT_SUBS, CATEGORY_ICONS, CATEGORY_COLORS } from './data';
import { KNOWN_SERVICES } from './services';
import { FALLBACK_RATES, monthlyInDisplay, currencySymbol } from './helpers';

const SubsContext = createContext(null);
const STORAGE_KEY = 'substracker_subs';

export function SubsProvider({ children }) {
  const { data: session } = useSession();
  const [subs, setSubs] = useState([]);
  const [toast, setToast] = useState({ visible: false, icon: '', text: '' });
  const toastTimer = useRef(null);
  const hydrated = useRef(false);

  // ── Display currency (user preference) ────────────────────────
  const [displayCurrency, setDisplayCurrencyState] = useState('INR');

  // ── Live exchange rates ────────────────────────────────────────
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);

  // ── Fetch live exchange rates on mount ─────────────────────────
  useEffect(() => {
    async function fetchRates() {
      try {
        const res  = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
        const data = await res.json();

        // data.rates gives us "how many X per 1 INR"
        // We want "how many INR per 1 X" → invert each rate
        const inverted = { INR: 1 };
        for (const [code, rate] of Object.entries(data.rates)) {
          if (rate > 0) inverted[code] = 1 / rate;
        }

        setRates(inverted);
        console.log("[Rates] Live rates loaded ✓");
      } catch (err) {
        // Silently fall back — FALLBACK_RATES already set as default
        console.warn("[Rates] Live fetch failed, using fallback rates:", err.message);
      } finally {
        setRatesLoading(false);
      }
    }

    fetchRates();
  }, []);

  // ── Detect user location & auto-set display currency ──────────
  useEffect(() => {
    const saved = localStorage.getItem("substracker_currency");
    if (saved) {
      setDisplayCurrencyState(saved);
      return;
    }

    async function detectCurrency() {
      try {
        const res  = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const detected = data.currency ?? "INR";
        setDisplayCurrencyState(detected);
        localStorage.setItem("substracker_currency", detected);
        console.log(`[Location] Detected currency: ${detected} (${data.country_name})`);
      } catch {
        setDisplayCurrencyState("INR");
        console.warn("[Location] Detection failed, defaulting to INR");
      }
    }

    detectCurrency();
  }, []);

  const setDisplayCurrency = (code) => {
    setDisplayCurrencyState(code);
    localStorage.setItem("substracker_currency", code);
  };

  // Helper: map DB row to App object
  const mapFromDB = (row) => ({
    id: row.id,
    name: row.service_name,
    amount: parseFloat(row.amount),
    cycle: row.billing_cycle,
    cat: row.category,
    status: row.status,
    date: row.renewal_date,
    currency: row.currency || 'INR',   // ← read stored currency
    // Derive icon/color from known services or defaults
    icon: KNOWN_SERVICES.find(s => s.name === row.service_name)?.icon || CATEGORY_ICONS[row.category] || '📦',
    color: KNOWN_SERVICES.find(s => s.name === row.service_name)?.color || CATEGORY_COLORS[row.category] || '#6b7280',
  });

  const prevSessionId = useRef(undefined);

  // Load subscriptions
  useEffect(() => {
    const currentId = session?.user?.id || null;

    // If the user has changed (e.g. log in, log out, switch accounts),
    // immediately clear the subscriptions to prevent data leaking into the new session.
    if (prevSessionId.current !== undefined && prevSessionId.current !== currentId) {
      setSubs([]);
      hydrated.current = false; // Block localStorage sync until the new state is loaded
    }
    prevSessionId.current = currentId;

    const loadData = async () => {
      if (currentId) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentId)
          .order('renewal_date', { ascending: true });

        if (!error && data) {
          setSubs(data.map(mapFromDB));
        } else {
          setSubs([]);
        }
      } else if (session === null) {
        // Fallback to localStorage for guests
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            const isMockData = parsed.subs?.some?.(s => s.name === 'Netflix' && s.amount === 15.49);
            
            if (isMockData) {
              setSubs([]);
              localStorage.removeItem(STORAGE_KEY);
            } else {
              setSubs(parsed.subs || []);
            }
          } else {
            setSubs([]);
          }
        } catch (_) {
          setSubs([]);
        }
      }
      // Mark as hydrated so guest mode can start syncing future changes
      if (session === null) {
        hydrated.current = true;
      }
    };

    if (session !== undefined) {
      loadData();
    }
  }, [session]);

  // Sync to localStorage for guest users ONLY
  useEffect(() => {
    // Only write to localStorage if:
    // 1. We are completely hydrated (the guest data has been loaded).
    // 2. We are currently a guest (session is explicitly null).
    // 3. The current subs do not belong to an authenticated user (caught by hydration flag).
    if (!hydrated.current || session !== null) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ subs }));
  }, [subs, session]);

  const showToast = useCallback((icon, text) => {
    setToast({ visible: true, icon, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  // ── CRUD ──

  const addSub = useCallback(async (fields) => {
    const { name, amount, cycle, cat, status, date, currency } = fields;
    const subCurrency = currency || 'INR';  // default to INR for manual adds
    
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
          currency: subCurrency,   // ← store real currency
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
        currency: subCurrency,   // ← store real currency
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
        currency: s.currency || 'INR',  // ← use detected currency, not hardcoded
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
    a.download = 'substracker-export.csv';
    a.click();
    showToast('📊', 'CSV exported!');
  }, [subs, showToast]);

  const clearAllSubs = useCallback(async () => {
    if (subs.length === 0) return;
    if (session?.user?.id) {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', session.user.id);

      if (error) {
        showToast('❌', 'Failed to remove all');
        return;
      }
    }
    setSubs([]);
    showToast('🗑', 'All subscriptions removed');
  }, [subs, session, showToast]);

  // Computed values
  const monthlyTotal = subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + monthlyInDisplay(s, displayCurrency, rates), 0);

  const annualTotal = monthlyTotal * 12;

  const activeCount = subs.filter(s => s.status === 'active').length;
  const trialCount  = subs.filter(s => s.status === 'trial').length;

  return (
    <SubsContext.Provider
      value={{
        subs,
        addSub,
        deleteSub,
        togglePause,
        activate,
        importAll,
        exportCSV,
        clearAllSubs,
        toast,
        displayCurrency,
        setDisplayCurrency,
        rates,
        ratesLoading,
        monthlyTotal,
        annualTotal,
        activeCount,
        trialCount,
      }}
    >
      {children}
    </SubsContext.Provider>
  );
}

export function useSubs() {
  const ctx = useContext(SubsContext);
  if (!ctx) throw new Error('useSubs must be used inside <SubsProvider>');
  return ctx;
}

export function useCurrency() {
  const ctx = useSubs();
  const symbol = currencySymbol(ctx.displayCurrency);
  return { symbol, code: ctx.displayCurrency, setCurrency: ctx.setDisplayCurrency };
}
