'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Toast from '@/components/ui/Toast';
import AddModal from '@/components/modals/AddModal';
import ScanModal from '@/components/modals/ScanModal';
import Dashboard from '@/components/views/Dashboard';
import Subscriptions from '@/components/views/Subscriptions';
import Trials from '@/components/views/Trials';
import Analytics from '@/components/views/Analytics';
import Settings from '@/components/views/Settings';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView]       = useState('dashboard');
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') return null;

  const views = {
    dashboard:     <Dashboard     onOpenAdd={() => setAddOpen(true)} />,
    subscriptions: <Subscriptions onOpenAdd={() => setAddOpen(true)} />,
    trials:        <Trials        onOpenAdd={() => setAddOpen(true)} />,
    analytics:     <Analytics />,
    settings:      <Settings      onOpenScan={() => setScanOpen(true)} />,
  };

  return (
    <>
      <Sidebar active={view} onNavigate={setView} />

      <div className="main">
        <Topbar
          view={view}
          onOpenAdd={() => setAddOpen(true)}
          onOpenScan={() => setScanOpen(true)}
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
