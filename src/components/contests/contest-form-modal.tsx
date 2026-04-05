'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

interface ContestFormData {
  id?: string;
  name: string;
  dateStart: string;
  dateEnd: string;
  startingPosition?: { name: string };
  targetPosition?: { name: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: ContestFormData;
}

export function ContestFormModal({ isOpen, onClose, initial }: Props) {
  const { apiKey } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [startPos, setStartPos] = useState('');
  const [endPos, setEndPos] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(initial?.name ?? '');
    setDateStart(initial?.dateStart?.slice(0, 16) ?? '');
    setDateEnd(initial?.dateEnd?.slice(0, 16) ?? '');
    setStartPos(initial?.startingPosition?.name ?? '');
    setEndPos(initial?.targetPosition?.name ?? '');
  }, [isOpen, initial]);

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

  const save = useMutation({
    mutationFn: async () => {
      const url = initial?.id ? `${BASE}/contest/${encodeURIComponent(initial.id)}` : `${BASE}/contest`;
      const res = await fetch(url, {
        method: initial?.id ? 'PATCH' : 'POST',
        headers: { Authorization: `ApiKey ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          dateStart: new Date(dateStart).toISOString(),
          dateEnd: new Date(dateEnd).toISOString(),
          startingPositionName: startPos,
          targetPositionName: endPos,
        }),
      });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contests'] }); onClose(); },
  });

  if (!isOpen) return null;

  const inputClass = "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{initial ? 'Edit Contest' : 'New Contest'}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
        <input type="datetime-local" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className={inputClass} />
        <input type="datetime-local" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className={inputClass} />
        <input value={startPos} onChange={(e) => setStartPos(e.target.value)} placeholder="Starting position" className={inputClass} />
        <input value={endPos} onChange={(e) => setEndPos(e.target.value)} placeholder="Target position" className={inputClass} />
        {save.isError && <p className="text-xs text-red-600">{String(save.error)}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50">Cancel</button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim() || !dateStart || !dateEnd}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : initial ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
