'use client';

export default function MetricCard({ label, value, sub, color, locked, lockText }) {
  if (locked) {
    return (
      <div className="metric-card locked">
        <div className="lock-overlay">
          <span className="lock-icon">🔒</span>
          <span className="lock-text">{lockText || 'Sign in to view'}</span>
        </div>
        <div className="stat-blur">
          <div className="mc-label">{label}</div>
          <div className="mc-value" style={color ? { color } : {}}>{value}</div>
          <div className="mc-sub">{sub}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className="mc-label">{label}</div>
      <div className="mc-value" style={color ? { color } : {}}>{value}</div>
      <div className="mc-sub">{sub}</div>
    </div>
  );
}
