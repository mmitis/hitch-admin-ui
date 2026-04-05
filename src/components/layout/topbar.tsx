'use client';

import { useContest } from '@/contexts/contest-context';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { contestName, contestId } = useContest();

  return (
    <div className="bg-white border-b border-zinc-200 px-6 py-3.5 shrink-0">
      <h1 className="text-base font-bold text-zinc-900">{title}</h1>
      <p className="text-xs text-zinc-400">
        {contestId ? contestName : 'No contest selected'}
      </p>
    </div>
  );
}
