'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  contestControllerGetScheduleEvents,
  contestControllerAddScheduleEvent,
  contestControllerDeleteScheduleEvent,
} from '@/client/sdk.gen';
import type { ScheduleEventDto } from '@/client/types.gen';

function formatDuration(ms: number): string {
  if (!ms) return '—';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function ScheduleEvents({ contestId }: { contestId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [durationMin, setDurationMin] = useState('');

  const { data: events } = useQuery<ScheduleEventDto[]>({
    queryKey: ['schedule', contestId],
    queryFn: async () => {
      const { data } = await contestControllerGetScheduleEvents({ path: { contestId } });
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const durationMs = durationMin ? Math.round(parseFloat(durationMin) * 60000) : 0;
      const { error } = await contestControllerAddScheduleEvent({
        path: { contestId },
        body: { name, time: new Date(time).toISOString(), duration: durationMs },
      });
      if (error) throw new Error('Failed to add event');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', contestId] });
      setName('');
      setTime('');
      setDurationMin('');
    },
  });

  const remove = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await contestControllerDeleteScheduleEvent({
        path: { contestId, eventId },
      });
      if (error) throw new Error('Failed to delete event');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', contestId] }),
  });

  const inputClass = 'rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-zinc-400 mb-2">Schedule</p>
      <div className="flex gap-2 mb-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" className={`flex-1 min-w-[120px] ${inputClass}`} />
        <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        <input
          type="number"
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
          placeholder="min"
          min={0}
          className={`w-20 ${inputClass}`}
          title="Duration in minutes (optional)"
        />
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending || !name.trim() || !time}
          className="px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          Add
        </button>
      </div>
      {(events ?? []).length > 0 && (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="pb-1 pr-4">Name</th>
              <th className="pb-1 pr-4">Time</th>
              <th className="pb-1 pr-4">Duration</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((ev) => (
              <tr key={ev.id} className="border-b border-zinc-100">
                <td className="py-1.5 pr-4">{ev.name}</td>
                <td className="py-1.5 pr-4">{new Date(ev.time).toLocaleString()}</td>
                <td className="py-1.5 pr-4 text-zinc-400">{formatDuration(ev.duration)}</td>
                <td className="py-1.5">
                  <button
                    onClick={() => remove.mutate(ev.id!)}
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
