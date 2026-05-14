'use client';
import { signIn, signOut, useSession } from "next-auth/react";

const TITLES = {
  dashboard:     ['Dashboard',     'Welcome back, Alex 👋'],
  subscriptions: ['Subscriptions', 'Manage all your recurring charges'],
  trials:        ['Free Trials',   'Track trials before they convert to paid'],
  analytics:     ['Analytics',     'Understand your spending patterns'],
  settings:      ['Settings',      'Customize your Substracker experience'],
};

export default function Topbar({ view, onOpenAdd, onOpenScan }) {
  const { data: session } = useSession();
  
  const firstName = session?.user?.name?.split(' ')[0] || '';
  const welcomeMsg = firstName ? `Welcome back, ${firstName} 👋` : 'Welcome 👋';
  
  const dynamicTitles = {
    ...TITLES,
    dashboard: ['Dashboard', welcomeMsg]
  };

  const [title, sub] = dynamicTitles[view] ?? ['', ''];

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">{sub}</div>
      </div>
      <div className="topbar-actions">
        {!session ? (
          <button className="btn btn-accent" onClick={() => signIn("google")}>
            Sign In
          </button>
        ) : (
          <>
            <button className="btn btn-blue" onClick={onOpenScan}>
              📧 Scan Gmail
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--accent)' }}
                />
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => signOut()}>
                Logout
              </button>
            </div>
          </>
        )}
        {session && (
          <button className="btn btn-accent" onClick={onOpenAdd}>+ Add Subscription</button>
        )}
      </div>
    </div>
  );
}
