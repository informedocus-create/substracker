'use client';

export default function MetricCard({ label, value, sub, color }) {
  return (
    <div className="metric-card">
      <div className="mc-label">{label}</div>
      <div className="mc-value" style={color ? { color } : {}}>{value}</div>
      <div className="mc-sub">{sub}</div>
    </div>
  );
}
