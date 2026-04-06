'use client';

import { useContest } from '@/contexts/contest-context';
import { ScheduleEvents } from '@/components/contests/schedule-events';

export function ScheduleTab() {
  const { contestId, contestName } = useContest();

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 max-w-2xl">
      <p className="text-sm font-semibold mb-1">{contestName}</p>
      <ScheduleEvents contestId={contestId} />
    </div>
  );
}
