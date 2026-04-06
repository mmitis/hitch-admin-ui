'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  contestControllerGetContestList,
  contestControllerGetContestById,
  contestControllerGetLogos,
  contestControllerDeleteContest,
} from '@/client/sdk.gen';
import type { CurrentContestDto, LogoItemDto } from '@/client/types.gen';
import { ContestFormModal } from './contest-form-modal';
import { ScheduleEvents } from './schedule-events';
import { LogoUploader } from './logo-uploader';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type ContestWithLogo = CurrentContestDto & { logoFilename: string | null };

export function ContestsList() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CurrentContestDto | undefined>(undefined);
  const [deleteError, setDeleteError] = useState('');

  const { data: contests, isLoading } = useQuery<ContestWithLogo[]>({
    queryKey: ['contests'],
    queryFn: async () => {
      const [listResult, logosResult] = await Promise.all([
        contestControllerGetContestList(),
        contestControllerGetLogos(),
      ]);
      const list = listResult.data ?? [];
      const logos: LogoItemDto[] = logosResult.data ?? [];

      const details = await Promise.all(
        list.map(async (c) => {
          const { data } = await contestControllerGetContestById({ path: { contestId: c.id } });
          return data!;
        }),
      );

      const logoUrlToFilename = Object.fromEntries(
        logos.map((l) => [`/resources/${l.filename}`, l.filename]),
      );

      return details.map((c) => ({
        ...c,
        logoFilename: c.logoUrl ? logoUrlToFilename[c.logoUrl as unknown as string] ?? null : null,
      }));
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await contestControllerDeleteContest({ path: { contestId: id } });
      if (error) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
      qc.invalidateQueries({ queryKey: ['contest-list'] });
    },
    onError: (e) => setDeleteError(e instanceof Error ? e.message : 'Delete failed'),
  });

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Contest
        </button>
      </div>

      {(contests ?? []).map((c) => (
        <div key={c.id} className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-zinc-400">
                {new Date(c.dateStart).toLocaleDateString()} – {new Date(c.dateEnd).toLocaleDateString()}
                {c.startingPosition && ` · ${c.startingPosition.name} → ${c.targetPosition?.name ?? '?'}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setEditing(c); setModalOpen(true); }}
                className="px-2 py-1 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                onClick={() => { if (window.confirm('Delete this contest?')) remove.mutate(c.id); }}
                disabled={remove.isPending}
                className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          <LogoUploader
            contestId={c.id}
            logoUrl={c.logoUrl ? `${BASE}${c.logoUrl as unknown as string}` : null}
            currentLogoFilename={c.logoFilename}
          />
          <ScheduleEvents contestId={c.id} />
        </div>
      ))}

      <ContestFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
      />
    </div>
  );
}
