'use client';
import { useSubs } from '@/lib/context';

export default function Toast() {
  const { toast } = useSubs();
  return (
    <div className={`notification${toast.visible ? ' show' : ''}`}>
      <span>{toast.icon}</span>
      <span>{toast.text}</span>
    </div>
  );
}
