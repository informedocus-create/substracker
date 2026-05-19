'use client';
import { useState, useEffect } from 'react';

// ── Utility helpers ──

/** Returns an ISO date string N days from today */
export function nd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Formats "2026-05-15" → "May 15, 2026" */
export function fmtDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Returns number of days until a date string (can be negative) */
export function daysTo(s) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(s + 'T00:00:00') - t) / 86400000);
}

/** Normalises any billing cycle to a monthly cost (in the subscription's own currency) */
export function monthly(sub) {
  const amt = parseFloat(sub.amount) || 0;
  if (sub.cycle === 'yearly')  return amt / 12;
  if (sub.cycle === 'weekly')  return amt * 4.33;
  return amt;
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ)' },
];

export const FALLBACK_RATES = {
  INR: 1,
  USD: 83.5,
  GBP: 106.0,
  EUR: 90.0,
  AED: 22.7,
};

/** Returns the display symbol for a given currency code (e.g. "USD" → "$") */
export function currencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code ?? '₹';
}

/**
 * Converts an amount from one currency to another using exchange rates.
 */
export function convertAmount(amount, fromCurrency, toCurrency, rates) {
  if (!amount || amount === 0) return 0;
  if (fromCurrency === toCurrency) return amount;

  const r = rates || FALLBACK_RATES;
  const from = r[fromCurrency] ?? FALLBACK_RATES[fromCurrency] ?? 1;
  const to   = r[toCurrency]   ?? FALLBACK_RATES[toCurrency]   ?? 1;

  return (amount * from) / to;
}

/**
 * Returns the monthly amount of a subscription converted to the display currency.
 */
export function monthlyInDisplay(sub, displayCur, rates) {
  const raw = parseFloat(sub.amount) || 0;
  const cur = sub.currency || 'INR';

  let monthlyAmt = raw;
  if (sub.cycle === 'yearly')  monthlyAmt = raw / 12;
  if (sub.cycle === 'weekly')  monthlyAmt = raw * 4.33;

  return convertAmount(monthlyAmt, cur, displayCur, rates);
}

/**
 * Formats a number as a currency string.
 */
export function formatCurrency(amount, currencyCode) {
  const symbol = currencySymbol(currencyCode);
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Groups active subscriptions by original currency and sums their monthly costs.
 */
export function groupByCurrency(subs) {
  return subs
    .filter(s => s.status === 'active')
    .reduce((acc, sub) => {
      const cur = sub.currency || 'INR';
      const amt = parseFloat(sub.amount) || 0;
      let monthlyAmt = amt;
      if (sub.cycle === 'yearly')  monthlyAmt = amt / 12;
      if (sub.cycle === 'weekly')  monthlyAmt = amt * 4.33;
      acc[cur] = (acc[cur] || 0) + monthlyAmt;
      return acc;
    }, {});
}

