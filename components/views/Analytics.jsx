'use client';
import { useSubs } from '@/lib/context';
import { monthly } from '@/lib/helpers';
import MetricCard from '@/components/ui/MetricCard';

const COLORS = ['#00e5a0', '#4f8ef7', '#f5a623', '#ff5f5f', '#9b78f8', '#00b4d8', '#fb923c'];
const MONTHS  = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
const HEIGHTS = [28, 42, 35, 55, 80];

export default function Analytics() {
  const { subs } = useSubs();
  const active = subs.filter(s => s.status !== 'paused');
  const mo     = active.reduce((a, s) => a + monthly(s), 0);
  const risk   = subs.filter(s => s.status === 'trial').reduce((a, s) => a + s.amount, 0);
  const top    = subs.length ? subs.reduce((a, b) => monthly(a) > monthly(b) ? a : b) : null;

  const cats = {};
  active.forEach(s => { cats[s.cat] = (cats[s.cat] || 0) + monthly(s); });
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;

  return (
    <div className="view-enter">
      <div className="metrics-grid">
        <MetricCard label="This Month"       value={`$${mo.toFixed(2)}`}           sub="total subscription cost"       color="var(--accent)" />
        <MetricCard label="Avg Per Day"      value={`$${(mo / 30).toFixed(2)}`}    sub="daily subscription cost" />
        <MetricCard label="Most Expensive"   value={top ? top.name : '—'}           sub={top ? `$${top.amount}/${top.cycle}` : '—'} color="var(--red)" />
        <MetricCard label="Trial Cost at Risk" value={`$${risk.toFixed(2)}`}        sub="if trials convert to paid"     color="var(--amber)" />
      </div>

      <div className="analytics-grid">
        {/* Category spend */}
        <div className="chart-card">
          <div className="chart-title">📊 Spend by Category</div>
          {!entries.length ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Add subscriptions to see analytics
            </div>
          ) : entries.map(([cat, amt], i) => (
            <div className="cat-item" key={cat}>
              <div className="cat-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <div className="cat-name">{cat}</div>
              <div className="cat-bar-wrap">
                <div className="cat-bar" style={{ width: `${((amt / max) * 100).toFixed(0)}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <div className="cat-amount">${amt.toFixed(2)}</div>
            </div>
          ))}
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
