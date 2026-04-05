'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useContest } from '@/contexts/contest-context';
import { useAuth } from '@/contexts/auth-context';

export function ParticipantActions() {
  const { contestId } = useContest();
  const { apiKey } = useAuth();
  const [addId, setAddId] = useState('');
  const [finishId, setFinishId] = useState('');
  const [resetId, setResetId] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const authHeader = { Authorization: `ApiKey ${apiKey}` };

  async function post(url: string, successMsg: string) {
    if (!contestId) { setError('Select a contest first'); return; }
    setMsg(''); setError('');
    try {
      const res = await fetch(url, { method: 'POST', headers: authHeader });
      if (!res.ok) throw new Error(res.statusText);
      setMsg(successMsg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  const inputClass = "w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <Card>
      <CardHeader><h2 className="text-sm font-bold">Participants</h2></CardHeader>
      <CardContent className="flex flex-col gap-3 pb-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Add #</label>
            <input type="number" value={addId} onChange={(e) => setAddId(e.target.value)} min={1} className={inputClass} />
          </div>
          <Button variant="ghost" onPress={() =>
            post(`${BASE}/contest/${encodeURIComponent(contestId!)}/populate?userId=${encodeURIComponent(addId)}`, `#${addId} added`)
          } className="shrink-0 border border-green-200 text-green-700 hover:bg-green-50">Add</Button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Finish #</label>
            <input type="number" value={finishId} onChange={(e) => setFinishId(e.target.value)} min={1} className={inputClass} />
          </div>
          <Button variant="ghost" onPress={() =>
            post(`${BASE}/hitch/contest/${encodeURIComponent(contestId!)}/finish/${encodeURIComponent(finishId)}`, `#${finishId} finished`)
          } className="shrink-0 border border-amber-200 text-amber-700 hover:bg-amber-50">Finish</Button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Reset #</label>
            <input type="number" value={resetId} onChange={(e) => setResetId(e.target.value)} min={1} className={inputClass} />
          </div>
          <Button variant="ghost" onPress={() =>
            post(`${BASE}/hitch/contest/${encodeURIComponent(contestId!)}/reset/${encodeURIComponent(resetId)}`, `#${resetId} reset`)
          } className="shrink-0 border border-red-200 text-red-700 hover:bg-red-50">Reset</Button>
        </div>
        {msg && <p className="text-xs text-green-600">{msg}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
