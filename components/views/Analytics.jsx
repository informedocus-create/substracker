'use client';
import { useSubs, useCurrency } from '@/lib/context';
import { currencySymbol, formatCurrency, monthlyInDisplay } from '@/lib/helpers';
import MetricCard from '@/components/ui/MetricCard';

const COLORS = ['#00e5a0', '#4f8ef7', '#f5a623', '#ff5f5f', '#9b78f8', '#00b4d8', '#fb923c'];
const MONTHS  = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
const HEIGHTS = [28, 42, 35, 55, 80];

export default function Analytics() {
  const { subs, monthlyTotal, rates } = useSubs();
  const { symbol, code } = useCurrency();
  const active = subs.filter(s => s.status !== 'paused');

  const moDisplay   = formatCurrency(monthlyTotal, code);
  const avgDisplay  = formatCurrency(monthlyTotal / 30, code);

  // Top subscription in display currency
  const top = subs.length ? subs.reduce((a, b) => monthlyInDisplay(a, code, rates) > monthlyInDisplay(b, code, rates) ? a : b) : null;
  const topSub = top ? `${currencySymbol(top.currency || 'INR')}${(parseFloat(top.amount) || 0).toFixed(2)}/${top.cycle}` : '—';

  // Trial cost at risk (in display currency)
  const trials = subs.filter(s => s.status === 'trial');
  const riskMonthly = trials.reduce((sum, s) => sum + monthlyInDisplay(s, code, rates), 0);
  const riskDisplay = formatCurrency(riskMonthly, code);

  // Category chart: group by category in display currency
  const cats = {};
  active.forEach(s => {
    cats[s.cat] = (cats[s.cat] || 0) + monthlyInDisplay(s, code, rates);
  });
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="view-enter">
      <div className="metrics-grid">
        <MetricCard label="This Month"         value={moDisplay}            sub="total subscription cost"       color="var(--accent)" />
        <MetricCard label="Avg Per Day"         value={avgDisplay}           sub="daily subscription cost" />
        <MetricCard label="Most Expensive"      value={top ? top.name : '—'} sub={topSub}                       color="var(--red)" />
        <MetricCard label="Trial Cost at Risk"  value={riskDisplay}          sub="if trials convert to paid"    color="var(--amber)" />
      </div>

      <div className="analytics-grid">
        {/* Category spend */}
        <div className="chart-card">
          <div className="chart-title">📊 Spend by Category</div>
          {!entries.length ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Add subscriptions to see analytics
            </div>
          ) : entries.map(([cat, val], i) => {
            const catDisplay = formatCurrency(val, code);
            return (
              <div className="cat-item" key={cat}>
                <div className="cat-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="cat-name">{cat}</div>
                <div className="cat-bar-wrap">
                  <div className="cat-bar" style={{ width: `${((val / max) * 100).toFixed(0)}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <div className="cat-amount">{catDisplay}</div>
              </div>
            );
          })}
        </div>

        {/* Monthly trend */}
        <div className="chart-card">
          <div className="chart-title">📅 Monthly Trend</div>
          <div className="bar-chart-wrap">
            {MONTHS.map((m, i) => (
              <div className="bar-col" key={m}>
                <div
                  className="bar-fill"
                  style={{
                    height: `${HEIGHTS[i]}%`,
                    background: i === 4
                      ? 'linear-gradient(180deg,var(--accent),rgba(0,229,160,.4))'
                      : 'linear-gradient(180deg,var(--blue),rgba(79,142,247,.4))',
                  }}
                />
                <div className="bar-lbl">{m}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>Current month in green</div>
        </div>
      </div>
    </div>
  );
}
