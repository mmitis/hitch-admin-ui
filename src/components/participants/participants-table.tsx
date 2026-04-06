'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContest } from '@/contexts/contest-context';
import {
  contestControllerGetRanking,
  contestControllerAddParticipant,
  contestControllerPopulateUserNames,
  hitchControllerFinishContest,
  hitchControllerResetUser,
} from '@/client/sdk.gen';
import type { RankingDto } from '@/client/types.gen';

const ACTIVITY_COLORS: Record<string, string> = {
  FINISHED: 'bg-green-100 text-green-700',
  ON_ROAD:  'bg-blue-100 text-blue-700',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
  WAITING:  'bg-zinc-100 text-zinc-600',
};

export function ParticipantsTable() {
  const { contestId } = useContest();
  const qc = useQueryClient();

  // Add form
  const [addId, setAddId] = useState('');
  const [addName, setAddName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: rows, isLoading, refetch, isFetching } = useQuery<RankingDto[]>({
    queryKey: ['ranking', contestId],
    queryFn: async () => {
      const { data } = await contestControllerGetRanking({ path: { contestId: contestId! } });
      return data ?? [];
    },
    enabled: !!contestId,
  });

  const addParticipant = useMutation({
    mutationFn: async () => {
      const { error } = await contestControllerAddParticipant({
        path: { contestId: contestId! },
        body: { userId: addId, name: addName },
      });
      if (error) throw new Error('Failed to add participant');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ranking', contestId] });
      setAddId('');
      setAddName('');
    },
  });

  const rename = useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const { error } = await contestControllerPopulateUserNames({
        path: { contestId: contestId! },
        body: { [userId]: name },
      });
      if (error) throw new Error('Failed to rename');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ranking', contestId] });
      setEditingId(null);
    },
  });

  const finish = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await hitchControllerFinishContest({
        path: { contestId: contestId!, userId },
        headers: { Authorization: '' },
      });
      if (error) throw new Error('Failed to finish');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ranking', contestId] }),
  });

  const reset = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await hitchControllerResetUser({
        path: { contestId: contestId!, userId },
        headers: { Authorization: '' },
      });
      if (error) throw new Error('Failed to reset');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ranking', contestId] }),
  });

  const inputClass = 'rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;

  return (
    <div className="flex flex-col gap-4">
      {/* Add participant */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-zinc-400 mb-2">Add Participant</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="number"
            placeholder="#"
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            min={1}
            className={`w-20 ${inputClass}`}
          />
          <input
            type="text"
            placeholder="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className={`flex-1 min-w-[140px] ${inputClass}`}
          />
          <button
            onClick={() => addParticipant.mutate()}
            disabled={addParticipant.isPending || !addId.trim() || !addName.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {addParticipant.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addParticipant.isError && (
          <p className="text-xs text-red-600 mt-1">{String(addParticipant.error)}</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <p className="text-sm font-semibold">
            Participants {rows ? `(${rows.length})` : ''}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-2 py-1 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50"
          >
            {isFetching ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-400 p-4">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 font-semibold">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Distance</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((row) => (
                  <tr key={row.user.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-2 text-zinc-500 font-mono text-xs">{row.user.id}</td>
                    <td className="px-4 py-2">
                      {editingId === row.user.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="rounded border border-zinc-200 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') rename.mutate({ userId: row.user.id, name: editName });
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => rename.mutate({ userId: row.user.id, name: editName })}
                            disabled={rename.isPending}
                            className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {rename.isPending ? '…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium">{row.user.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_COLORS[row.activityStatus] ?? ACTIVITY_COLORS.WAITING}`}>
                        {row.activityStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">
                      {row.distance != null ? `${row.distance.toFixed(1)} km` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => { setEditingId(row.user.id); setEditName(row.user.name); }}
                          className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Finish #${row.user.id}?`)) finish.mutate(row.user.id); }}
                          disabled={finish.isPending}
                          className="px-2 py-0.5 text-xs border border-green-200 text-green-700 rounded hover:bg-green-50 disabled:opacity-50"
                        >
                          Finish
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Reset #${row.user.id}?`)) reset.mutate(row.user.id); }}
                          disabled={reset.isPending}
                          className="px-2 py-0.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(rows ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-400">
                      No participants yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
