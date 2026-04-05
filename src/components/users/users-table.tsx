'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useContest } from '@/contexts/contest-context';
import { UserHistoryModal } from './user-history-modal';
import { UserQrModal } from './user-qr-modal';

interface Participant {
  id: string;
  name: string;
  externalUserId: string;
  status: string;
}

type ParticipantWithRankName = Participant & { rankName: string };

const STATUS_COLORS: Record<string, string> = {
  FINISHED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  DEFAULT: 'bg-zinc-100 text-zinc-600',
};

export function UsersTable() {
  const { apiKey } = useAuth();
  const { contestId } = useContest();
  const qc = useQueryClient();
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const authHeader = { Authorization: `ApiKey ${apiKey}` };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
  const [qrUser, setQrUser] = useState<{ id: string; name: string } | null>(null);

  const { data: rows, isLoading } = useQuery<ParticipantWithRankName[]>({
    queryKey: ['participants', contestId],
    queryFn: async () => {
      const [pRes, rRes] = await Promise.all([
        fetch(`${BASE}/contest/${encodeURIComponent(contestId!)}/participants`, { headers: authHeader }),
        fetch(`${BASE}/hitch/contest/${encodeURIComponent(contestId!)}/ranking`, { headers: authHeader }),
      ]);
      const participants: Participant[] = await pRes.json();
      const ranking: Array<{ user: { id: string; name: string } }> = rRes.ok ? await rRes.json() : [];
      const nameMap = Object.fromEntries(ranking.map((r) => [r.user.id, r.user.name]));
      return participants.map((p) => ({ ...p, rankName: nameMap[p.externalUserId] ?? p.name }));
    },
    enabled: !!contestId && !!apiKey,
  });

  const saveName = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(
        `${BASE}/contest/${encodeURIComponent(contestId!)}/participants/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        },
      );
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', contestId] });
      setEditingId(null);
    },
  });

  const statusClass = (s: string) => STATUS_COLORS[s] ?? STATUS_COLORS.DEFAULT;

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
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 pr-4 text-zinc-500">{row.externalUserId}</td>
                <td className="py-2 pr-4">
                  {editingId === row.id ? (
                    <div className="flex gap-1 items-center">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded border border-zinc-200 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveName.mutate({ id: row.id, name: editName })}
                        disabled={saveName.isPending}
                        className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saveName.isPending ? '…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => { setEditingId(row.id); setEditName(row.rankName); }}
                    >
                      {row.rankName}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setHistoryUser({ id: row.externalUserId, name: row.rankName })}
                      className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                    >
                      History
                    </button>
                    <button
                      onClick={() => setQrUser({ id: row.externalUserId, name: row.rankName })}
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
