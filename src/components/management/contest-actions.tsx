'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useContest } from '@/contexts/contest-context';
import { hitchControllerClearContest } from '@/client/sdk.gen';

export function ContestActions() {
  const { contestId, clearContest } = useContest();
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClear() {
    if (!contestId) return;
    setLoading(true);
    try {
      const { error: err } = await hitchControllerClearContest({ path: { contestId }, headers: { Authorization: '' } });
      if (err) throw new Error('Failed to clear contest');
      qc.invalidateQueries({ queryKey: ['ranking', contestId] });
      clearContest();
      setIsOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader><h2 className="text-sm font-bold">Contest Actions</h2></CardHeader>
        <CardContent className="pb-4">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <Button variant="danger" onPress={() => setIsOpen(true)} className="w-full">
            Clear Contest
          </Button>
        </CardContent>
      </Card>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold mb-2">Clear Contest</h3>
            <p className="text-sm text-zinc-500 mb-4">This clears all participant data for the selected contest. Are you sure?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50">Cancel</button>
              <button onClick={handleClear} disabled={loading} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Clearing…' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
