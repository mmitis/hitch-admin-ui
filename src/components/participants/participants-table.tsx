'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContest } from '@/contexts/contest-context';
import {
  contestControllerGetParticipants,
  contestControllerAddParticipant,
  contestControllerPopulateUserNames,
  hitchControllerFinishContest,
  hitchControllerResetUser,
  hitchControllerDeleteParticipant,
} from '@/client/sdk.gen';
import type { ContestControllerGetParticipantsResponse } from '@/client/types.gen';
import { UserQrModal } from '@/components/users/user-qr-modal';
import { UserHistoryModal } from '@/components/users/user-history-modal';

type Participant = NonNullable<ContestControllerGetParticipantsResponse>[number];

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const ACTIVITY_COLORS: Record<string, { bg: string; text: string }> = {
  FINISHED: { bg: 'bg-green-100', text: 'text-green-700' },
  ON_ROAD: { bg: 'bg-blue-100', text: 'text-blue-700' },
  WAITING: { bg: 'bg-zinc-100', text: 'text-zinc-600' },
  INACTIVE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

export function ParticipantsTable() {
  const { contestId } = useContest();
  const qc = useQueryClient();

  const [addId, setAddId] = useState('');
  const [addName, setAddName] = useState('');
  const [addNonTrackable, setAddNonTrackable] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');
  const [qrUser, setQrUser] = useState<{ id: string; name: string } | null>(null);
  const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);

  const { data: rows, isLoading, refetch, isFetching } = useQuery<Participant[]>({
    queryKey: ['participants', contestId],
    queryFn: async () => {
      const { data } = await contestControllerGetParticipants({ path: { contestId: contestId! } });
      return data ?? [];
    },
    enabled: !!contestId,
  });

  const filtered = (rows ?? []).filter((r) => {
    const q = search.toLowerCase();
    return (r.name ?? '').toLowerCase().includes(q) || (r.externalUserId ?? '').includes(q);
  });

  const addParticipant = useMutation({
    mutationFn: async () => {
      const { error } = await contestControllerAddParticipant({
        path: { contestId: contestId! },
        body: { userId: addId, name: addName, nonTrackable: addNonTrackable },
      });
      if (error) throw new Error('Failed to add participant');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', contestId] });
      setAddId('');
      setAddName('');
      setAddNonTrackable(false);
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
      qc.invalidateQueries({ queryKey: ['participants', contestId] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants', contestId] }),
  });

  const reset = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await hitchControllerResetUser({
        path: { contestId: contestId!, userId },
        headers: { Authorization: '' },
      });
      if (error) throw new Error('Failed to reset');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants', contestId] }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await hitchControllerDeleteParticipant({
        path: { contestId: contestId!, userId },
        headers: { Authorization: '' },
      });
      if (error) throw new Error('Failed to delete');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants', contestId] }),
  });

  const inputClass = 'rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;

  return (
    <div className="flex flex-col gap-4">
      {/* Add participant */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-zinc-400 mb-2">Add Participant</p>
        <div className="flex flex-col gap-2">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addId.trim() && addName.trim()) addParticipant.mutate();
              }}
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
          <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addNonTrackable}
              onChange={(e) => setAddNonTrackable(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            Non-trackable
          </label>
        </div>
        {addParticipant.isError && (
          <p className="text-xs text-red-600 mt-1">{String(addParticipant.error)}</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <p className="text-sm font-semibold shrink-0">
            Participants {rows ? `(${rows.length})` : ''}
          </p>
          <input
            type="search"
            placeholder="Search by name or #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0 px-2 py-1 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50"
          >
            {isFetching ? '↻…' : '↻ Refresh'}
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
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Last Update</th>
                  <th className="px-4 py-2.5">Finished</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const userId = row.externalUserId ?? '';
                  const name = row.name ?? '';
                  return (
                  <tr key={userId} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-2 text-zinc-500 font-mono text-xs">{userId}</td>
                    <td className="px-4 py-2">
                      {editingId === userId ? (
                        <div className="flex gap-1 items-center">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="rounded border border-zinc-200 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') rename.mutate({ userId, name: editName });
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => rename.mutate({ userId, name: editName })}
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
                        <span className="font-medium">{name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {row.nonTrackable ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                          Non-trackable
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Trackable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {(() => {
                        const status = (row as any).activityStatus ?? 'INACTIVE';
                        const colors = ACTIVITY_COLORS[status] ?? ACTIVITY_COLORS.INACTIVE;
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {status.replace('_', ' ')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs" title={formatDate((row as any).lastPositionUpdate)}>
                      {formatRelativeTime((row as any).lastPositionUpdate)}
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs">
                      {row.finishedAt ? (
                        <span className="text-green-600 font-medium">{formatDate(row.finishedAt)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => { setEditingId(userId); setEditName(name); }}
                          className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setQrUser({ id: userId, name })}
                          className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Finish #${userId}?`)) finish.mutate(userId); }}
                          disabled={finish.isPending}
                          className="px-2 py-0.5 text-xs border border-green-200 text-green-700 rounded hover:bg-green-50 disabled:opacity-50"
                        >
                          Finish
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Reset #${userId}?`)) reset.mutate(userId); }}
                          disabled={reset.isPending}
                          className="px-2 py-0.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setHistoryUser({ id: userId, name })}
                          className="px-2 py-0.5 text-xs border border-zinc-200 rounded hover:bg-zinc-50"
                        >
                          History
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete participant #${userId} "${name}"? This permanently removes the user and all their data.`)) deleteUser.mutate(userId); }}
                          disabled={deleteUser.isPending}
                          className="px-2 py-0.5 text-xs border border-red-300 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-zinc-400">
                      {search ? 'No participants match your search.' : 'No participants yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {contestId && qrUser && (
        <UserQrModal
          contestId={contestId}
          userId={qrUser.id}
          userName={qrUser.name}
          isOpen={!!qrUser}
          onClose={() => setQrUser(null)}
        />
      )}
      {contestId && historyUser && (
        <UserHistoryModal
          contestId={contestId}
          userId={historyUser.id}
          userName={historyUser.name}
          isOpen={!!historyUser}
          onClose={() => setHistoryUser(null)}
        />
      )}
    </div>
  );
}
