'use client';
import { useSubs } from '@/lib/context';

const NAV = [
  { id: 'dashboard',     icon: '📊', label: 'Dashboard' },
  { id: 'subscriptions', icon: '🔄', label: 'Subscriptions', badge: 'sub' },
  { id: 'trials',        icon: '⏳', label: 'Free Trials',   badge: 'trial', badgeClass: 'amber' },
  { id: 'analytics',     icon: '📈', label: 'Analytics' },
  { id: 'settings',      icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ active, onNavigate }) {
  const { subs } = useSubs();

  const subCount   = subs.filter(s => s.status !== 'paused').length;
  const trialCount = subs.filter(s => s.status === 'trial').length;
  const badges = { sub: subCount, trial: trialCount };

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-mark">⚡</div>
        <span className="sb-logo-text">SubTrack</span>
      </div>

      <div className="sb-section-label">Menu</div>

      <ul className="sb-nav">
        {NAV.map(item => (
          <li
            key={item.id}
            className={active === item.id ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
          >
            <span className="ni">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className={`sb-badge${item.badgeClass ? ' ' + item.badgeClass : ''}`}>
                {badges[item.badge]}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="sb-bottom">
        <div className="sb-user">
          <div className="avatar">AJ</div>
          <div>
            <div className="sb-user-name">Alex Johnson</div>
            <div className="sb-user-plan">Pro Plan ✓</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
