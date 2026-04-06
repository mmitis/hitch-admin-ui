'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useContest } from '@/contexts/contest-context';
import {
  contestControllerAddParticipant,
  hitchControllerFinishContest,
  hitchControllerResetUser,
} from '@/client/sdk.gen';

export function ParticipantActions() {
  const { contestId } = useContest();
  const [addId, setAddId] = useState('');
  const [addName, setAddName] = useState('');
  const [finishId, setFinishId] = useState('');
  const [resetId, setResetId] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const inputClass = 'w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  async function addParticipant() {
    if (!contestId) { setError('Select a contest first'); return; }
    if (!addId.trim() || !addName.trim()) { setError('Enter user number and name'); return; }
    setMsg(''); setError('');
    try {
      const { error: err } = await contestControllerAddParticipant({
        path: { contestId },
        body: { userId: addId, name: addName },
      });
      if (err) throw new Error('Failed to add participant');
      setMsg(`#${addId} added`);
      setAddId(''); setAddName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function finish() {
    if (!contestId) { setError('Select a contest first'); return; }
    if (!finishId.trim()) { setError('Enter a user number'); return; }
    setMsg(''); setError('');
    try {
      const { error: err } = await hitchControllerFinishContest({
        path: { contestId, userId: finishId },
        headers: { Authorization: '' },
      });
      if (err) throw new Error('Failed to finish user');
      setMsg(`#${finishId} finished`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function reset() {
    if (!contestId) { setError('Select a contest first'); return; }
    if (!resetId.trim()) { setError('Enter a user number'); return; }
    setMsg(''); setError('');
    try {
      const { error: err } = await hitchControllerResetUser({
        path: { contestId, userId: resetId },
        headers: { Authorization: '' },
      });
      if (err) throw new Error('Failed to reset user');
      setMsg(`#${resetId} reset`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <Card>
      <CardHeader><h2 className="text-sm font-bold">Participants</h2></CardHeader>
      <CardContent className="flex flex-col gap-3 pb-4">
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Add #</label>
            <input type="number" value={addId} onChange={(e) => setAddId(e.target.value)} min={1} className={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Name</label>
            <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="User name" className={inputClass} />
          </div>
          <Button variant="ghost" onPress={addParticipant} className="shrink-0 border border-green-200 text-green-700 hover:bg-green-50">Add</Button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Finish #</label>
            <input type="number" value={finishId} onChange={(e) => setFinishId(e.target.value)} min={1} className={inputClass} />
          </div>
          <Button variant="ghost" onPress={finish} className="shrink-0 border border-amber-200 text-amber-700 hover:bg-amber-50">Finish</Button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Reset #</label>
            <input type="number" value={resetId} onChange={(e) => setResetId(e.target.value)} min={1} className={inputClass} />
          </div>
          <Button variant="ghost" onPress={reset} className="shrink-0 border border-red-200 text-red-700 hover:bg-red-50">Reset</Button>
        </div>
        {msg && <p className="text-xs text-green-600">{msg}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
