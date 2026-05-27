'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSubs } from '@/lib/context';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Toast from '@/components/ui/Toast';
import AddModal from '@/components/modals/AddModal';
import ScanModal from '@/components/modals/ScanModal';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/views/Dashboard';
import Subscriptions from '@/components/views/Subscriptions';
import Trials from '@/components/views/Trials';
import Analytics from '@/components/views/Analytics';
import Settings from '@/components/views/Settings';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addSub } = useSubs();

  const [view, setView]             = useState('dashboard');
  const [addOpen, setAddOpen]       = useState(false);
  const [scanOpen, setScanOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Onboarding state ────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding]     = useState(false);
  const [checkingOnboard, setCheckingOnboard]   = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Check whether user has already completed onboarding
  useEffect(() => {
    async function checkOnboarded() {
      if (status === 'loading') return;

      if (session?.user?.id) {
        // Authenticated: check Supabase profiles table
        const { data } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', session.user.id)
          .single();

        if (!data || !data.onboarded) {
          setShowOnboarding(true);
        }
      } else if (session === null) {
        // Guest: check localStorage
        const guestOnboarded = localStorage.getItem('guest_onboarded');
        if (!guestOnboarded) {
          setShowOnboarding(true);
        }
      }

      setCheckingOnboard(false);
    }

    checkOnboarded();
  }, [session, status]);

  async function handleOnboardingComplete() {
    if (session?.user?.id) {
      // Mark as onboarded in Supabase — never shows again
      await supabase
        .from('profiles')
        .upsert({ id: session.user.id, onboarded: true });
    } else {
      // Guest fallback: persist in localStorage
      localStorage.setItem('guest_onboarded', 'true');
    }
    setShowOnboarding(false);
  }

  if (status === 'loading' || status === 'unauthenticated') return null;

  // Brief flash prevention while checking onboard status
  if (checkingOnboard) return null;

  const views = {
    dashboard:     <Dashboard     onOpenAdd={() => setAddOpen(true)} />,
    subscriptions: <Subscriptions onOpenAdd={() => setAddOpen(true)} />,
    trials:        <Trials        onOpenAdd={() => setAddOpen(true)} />,
    analytics:     <Analytics />,
    settings:      <Settings      onOpenScan={() => setScanOpen(true)} />,
  };

  return (
    <>
      {/* Onboarding overlay — shown only on first visit */}
      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          addSub={addSub}
        />
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar 
        active={view} 
        onNavigate={(v) => { setView(v); setSidebarOpen(false); }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Topbar
          view={view}
          onOpenAdd={() => setAddOpen(true)}
          onOpenScan={() => setScanOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="content">
          {views[view]}
        </div>
      </div>

      <AddModal  isOpen={addOpen}  onClose={() => setAddOpen(false)} />
      <ScanModal isOpen={scanOpen} onClose={() => setScanOpen(false)} />
      <Toast />
    </>
  );
}
