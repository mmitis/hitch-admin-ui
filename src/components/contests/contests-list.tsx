'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { ContestFormModal } from './contest-form-modal';
import { ScheduleEvents } from './schedule-events';
import { LogoUploader } from './logo-uploader';

interface ContestItem {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string;
  startingPosition?: { name: string };
  targetPosition?: { name: string };
  logoUrl?: string | null;
}

export function ContestsList() {
  const { apiKey } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContestItem | undefined>(undefined);

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const authHeader = { Authorization: `ApiKey ${apiKey}` };

  const { data: contests, isLoading } = useQuery<ContestItem[]>({
    queryKey: ['contests'],
    queryFn: async () => {
      const [listRes, logosRes] = await Promise.all([
        fetch(`${BASE}/contest/list`, { headers: authHeader }),
        fetch(`${BASE}/contest/logos`, { headers: authHeader }),
      ]);
      if (!listRes.ok) throw new Error(listRes.statusText);
      const list: ContestItem[] = await listRes.json();
      const logos: Record<string, string> = logosRes.ok ? await logosRes.json() : {};
      return list.map((c) => ({ ...c, logoUrl: logos[c.id] ?? null }));
    },
    enabled: !!apiKey,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/contest/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeader });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  });

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
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
          <LogoUploader contestId={c.id} logoUrl={c.logoUrl} />
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
