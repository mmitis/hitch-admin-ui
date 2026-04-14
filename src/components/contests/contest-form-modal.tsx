'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestControllerCreateContest, contestControllerUpdateContest } from '@/client/sdk.gen';
import type { CurrentContestDto } from '@/client/types.gen';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: CurrentContestDto;
}

function toLocalDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function ContestFormModal({ isOpen, onClose, initial }: Props) {
  const qc = useQueryClient();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [members, setMembers] = useState('30');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [startName, setStartName] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endName, setEndName] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setId(initial?.id ?? '');
    setName(initial?.name ?? '');
    setMembers(String(initial?.members ?? 30));
    setDateStart(initial?.dateStart ? toLocalDatetimeLocal(initial.dateStart) : '');
    setDateEnd(initial?.dateEnd ? toLocalDatetimeLocal(initial.dateEnd) : '');
    setStartName(initial?.startingPosition?.name ?? '');
    setStartLat(String(initial?.startingPosition?.lat ?? ''));
    setStartLng(String(initial?.startingPosition?.lng ?? ''));
    setEndName(initial?.targetPosition?.name ?? '');
    setEndLat(String(initial?.targetPosition?.lat ?? ''));
    setEndLng(String(initial?.targetPosition?.lng ?? ''));
    setPhone(initial?.organizerPhoneNumber ?? '');
  }, [isOpen, initial]);

  const save = useMutation({
    mutationFn: async () => {
      const startingPosition = { name: startName, lat: parseFloat(startLat), lng: parseFloat(startLng) };
      const targetPosition = { name: endName, lat: parseFloat(endLat), lng: parseFloat(endLng) };

      if (initial?.id) {
        const { error } = await contestControllerUpdateContest({
          path: { contestId: initial.id },
          body: {
            name,
            members: parseInt(members),
            dateStart: new Date(dateStart).toISOString(),
            dateEnd: new Date(dateEnd).toISOString(),
            startingPosition,
            targetPosition,
            organizerPhoneNumber: phone,
          },
        });
        if (error) throw new Error('Update failed');
      } else {
        const { error } = await contestControllerCreateContest({
          body: {
            id,
            name,
            members: parseInt(members),
            dateStart: new Date(dateStart).toISOString(),
            dateEnd: new Date(dateEnd).toISOString(),
            startingPosition,
            targetPosition,
            organizerPhoneNumber: phone,
          },
        });
        if (error) throw new Error('Create failed');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
      qc.invalidateQueries({ queryKey: ['contest-list'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  const inputClass = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
  const isCreate = !initial?.id;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{isCreate ? 'New Contest' : 'Edit Contest'}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>

        {isCreate && (
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="ID (slug, e.g. summer-2026)" className={inputClass} />
        )}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
        <input type="number" value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Max members" className={inputClass} />
        <input type="datetime-local" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className={inputClass} />
        <input type="datetime-local" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className={inputClass} />

        <p className="text-xs font-semibold text-zinc-400 -mb-1">Starting position</p>
        <input value={startName} onChange={(e) => setStartName(e.target.value)} placeholder="City name" className={inputClass} />
        <div className="flex gap-2">
          <input value={startLat} onChange={(e) => setStartLat(e.target.value)} placeholder="Lat" type="number" step="any" className={inputClass} />
          <input value={startLng} onChange={(e) => setStartLng(e.target.value)} placeholder="Lng" type="number" step="any" className={inputClass} />
        </div>

        <p className="text-xs font-semibold text-zinc-400 -mb-1">Target position</p>
        <input value={endName} onChange={(e) => setEndName(e.target.value)} placeholder="City name" className={inputClass} />
        <div className="flex gap-2">
          <input value={endLat} onChange={(e) => setEndLat(e.target.value)} placeholder="Lat" type="number" step="any" className={inputClass} />
          <input value={endLng} onChange={(e) => setEndLng(e.target.value)} placeholder="Lng" type="number" step="any" className={inputClass} />
        </div>

        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Organizer phone" className={inputClass} />

        {save.isError && <p className="text-xs text-red-600">{String(save.error)}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50">Cancel</button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim() || !dateStart || !dateEnd || (isCreate && !id.trim())}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : isCreate ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
