'use client';
import { useSubs } from '@/lib/context';
import { useSession, signIn, signOut } from 'next-auth/react';

const NAV = [
  { id: 'dashboard',     icon: '📊', label: 'Dashboard' },
  { id: 'subscriptions', icon: '🔄', label: 'Subscriptions', badge: 'sub' },
  { id: 'trials',        icon: '⏳', label: 'Free Trials',   badge: 'trial', badgeClass: 'amber' },
  { id: 'analytics',     icon: '📈', label: 'Analytics' },
  { id: 'settings',      icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ active, onNavigate }) {
  const { subs } = useSubs();
  const { data: session } = useSession();

  const subCount   = subs.filter(s => s.status !== 'paused').length;
  const trialCount = subs.filter(s => s.status === 'trial').length;
  const badges = { sub: subCount, trial: trialCount };

  const userName = session?.user?.name || 'Guest User';
  const userInitials = session?.user?.name 
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : '??';

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-mark">⚡</div>
        <span className="sb-logo-text">Substracker</span>
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
            {item.badge && session && (
              <span className={`sb-badge${item.badgeClass ? ' ' + item.badgeClass : ''}`}>
                {badges[item.badge]}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="sb-bottom">
        {session ? (
          <div className="sb-user">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="avatar" />
            ) : (
              <div className="avatar">{userInitials}</div>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="sb-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user?.name || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user?.email || ''}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); signOut(); }} 
              className="action-btn" 
              title="Logout"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}
            >
              🚪
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 12px' }}>
            <button 
              className="btn"
              onClick={() => signIn()}
              style={{
                width: '100%',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '10px 0',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 2px 10px rgba(255,255,255,0.1)',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
