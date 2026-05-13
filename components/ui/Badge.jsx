'use client';

export default function Badge({ status, daysLeft }) {
  if (status === 'trial')  return <span className="badge badge-trial">⏳ Trial</span>;
  if (status === 'paused') return <span className="badge badge-paused">⏸ Paused</span>;
  if (daysLeft <= 3)       return (
    <span className="badge badge-renew">
      🔴 {daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
    </span>
  );
  return <span className="badge badge-active">✓ Active</span>;
}
