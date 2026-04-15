'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useContest } from '@/contexts/contest-context';
import { contestControllerGetRanking } from '@/client/sdk.gen';
import type { RankingDto } from '@/client/types.gen';
import { UserHistoryModal } from './user-history-modal';
import { UserQrModal } from './user-qr-modal';

const ACTIVITY_COLORS: Record<string, string> = {
  FINISHED: 'bg-green-100 text-green-700',
  ON_ROAD: 'bg-blue-100 text-blue-700',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
  WAITING: 'bg-zinc-100 text-zinc-600',
  NOT_STARTED: 'bg-purple-100 text-purple-700',
};

export function UsersTable() {
  const { contestId } = useContest();
  const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
  const [qrUser, setQrUser] = useState<{ id: string; name: string } | null>(null);

  const { data: rows, isLoading } = useQuery<RankingDto[]>({
    queryKey: ['ranking', contestId],
    queryFn: async () => {
      const { data } = await contestControllerGetRanking({ path: { contestId: contestId! } });
      return data ?? [];
    },
    enabled: !!contestId,
  });

  const displayStatus = (row: RankingDto) => row.sent ? row.activityStatus : 'NOT_STARTED';
  const activityClass = (s: string) => ACTIVITY_COLORS[s] ?? ACTIVITY_COLORS.WAITING;

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;
  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 font-semibold">
              <th className="pb-2 pr-4">#</th>
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Distance</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.user.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 pr-4 text-zinc-500">{row.user.id}</td>
                <td className="py-2 pr-4 font-medium">{row.user.name}</td>
                <td className="py-2 pr-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${activityClass(displayStatus(row))}`}>
                    {displayStatus(row).replace('_', ' ')}
                  </span>
                </td>
                <td className="py-2 pr-4 text-zinc-500">
                  {row.distance != null ? `${row.distance.toFixed(1)} km` : '—'}
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setHistoryUser({ id: row.user.id, name: row.user.name })}
                      className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                    >
                      History
                    </button>
                    <button
                      onClick={() => setQrUser({ id: row.user.id, name: row.user.name })}
                      className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                    >
                      QR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contestId && historyUser && (
        <UserHistoryModal
          contestId={contestId}
          userId={historyUser.id}
          userName={historyUser.name}
          isOpen={!!historyUser}
          onClose={() => setHistoryUser(null)}
        />
      )}
      {contestId && qrUser && (
        <UserQrModal
          contestId={contestId}
          userId={qrUser.id}
          userName={qrUser.name}
          isOpen={!!qrUser}
          onClose={() => setQrUser(null)}
        />
      )}
    </>
  );
}
