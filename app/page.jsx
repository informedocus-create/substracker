'use client';
import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Landing() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') return null;

  return (
    <div className="landing-page">
      <div className="hero">
        <h1>Track every subscription.<br/>Never get surprised again.</h1>
        <p>Substracker automatically finds your subscriptions, tracks renewals, and alerts you before you're charged.</p>
        <button onClick={() => signIn('google')}>Get Started Free →</button>
      </div>

      <div className="features">
        <div className="feature-card">⚡ Auto-detect via Gmail</div>
        <div className="feature-card">🔔 Renewal alerts</div>
        <div className="feature-card">📊 Spending analytics</div>
        <div className="feature-card">🆓 Free trial tracker</div>
      </div>
    </div>
  );
}
