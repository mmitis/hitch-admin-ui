'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

interface ScheduleEvent { id: string; title: string; startTime: string; }

export function ScheduleEvents({ contestId }: { contestId: string }) {
  const { apiKey } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const authHeader = { Authorization: `ApiKey ${apiKey}` };
  const authJson = { ...authHeader, 'Content-Type': 'application/json' };

  const { data: events } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', contestId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/contest/${encodeURIComponent(contestId)}/schedule/list`, { headers: authHeader });
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
    enabled: !!apiKey,
  });

  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/contest/${encodeURIComponent(contestId)}/schedule`, {
        method: 'POST',
        headers: authJson,
        body: JSON.stringify({ title, startTime: new Date(startTime).toISOString() }),
      });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule', contestId] }); setTitle(''); setStartTime(''); },
  });

  const remove = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(
        `${BASE}/contest/${encodeURIComponent(contestId)}/schedule/${encodeURIComponent(eventId)}`,
        { method: 'DELETE', headers: authHeader },
      );
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', contestId] }),
  });

  const inputClass = "rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-zinc-400 mb-2">Schedule</p>
      <div className="flex gap-2 mb-2 flex-wrap">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className={`flex-1 min-w-0 ${inputClass}`} />
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending || !title.trim() || !startTime}
          className="px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          Add
        </button>
      </div>
      {(events ?? []).length > 0 && (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="pb-1 pr-4">Title</th>
              <th className="pb-1 pr-4">Start</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((ev) => (
              <tr key={ev.id} className="border-b border-zinc-100">
                <td className="py-1.5 pr-4">{ev.title}</td>
                <td className="py-1.5 pr-4">{new Date(ev.startTime).toLocaleString()}</td>
                <td className="py-1.5">
                  <button
                    onClick={() => remove.mutate(ev.id)}
                    disabled={remove.isPending}
                    className="px-2 py-0.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
