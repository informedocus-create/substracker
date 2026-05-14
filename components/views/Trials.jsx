'use client';
import { useSubs } from '@/lib/context';
import { useSession, signIn } from 'next-auth/react';
import TrialCard from '@/components/ui/TrialCard';

export default function Trials({ onOpenAdd }) {
  const { subs } = useSubs();
  const { data: session } = useSession();
  const trials = subs.filter(s => s.status === 'trial');

  return (
    <div className="view-enter">
      <div className="section-heading" style={{ marginBottom: 20 }}>
        <div className="section-title">⏳ Free Trials Tracker</div>
        {session && (
          <button className="btn btn-accent btn-sm" onClick={onOpenAdd}>+ Add Trial</button>
        )}
      </div>

      {!trials.length ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-title">No active trials</div>
          {!session ? (
            <>
              <div className="empty-desc">Sign in to track free trials and get alerts before you are charged.</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn btn-accent" onClick={() => signIn('google')}>Sign in</button>
              </div>
            </>
          ) : (
            <div className="empty-desc">Add a free trial subscription to track when it converts to paid.</div>
          )}
        </div>
      ) : (
        <div className="trials-grid">
          {trials.map(s => <TrialCard key={s.id} sub={s} />)}
        </div>
      )}
    </div>
  );
}
