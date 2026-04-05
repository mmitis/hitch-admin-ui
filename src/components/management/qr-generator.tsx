'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useContest } from '@/contexts/contest-context';
import { useAuth } from '@/contexts/auth-context';

export function QrGenerator() {
  const { contestId } = useContest();
  const { apiKey } = useAuth();
  const [userId, setUserId] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

  async function generate() {
    if (!contestId) { setError('Select a contest first'); return; }
    if (!userId.trim()) { setError('Enter a user number'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(
        `${BASE}/contest/${encodeURIComponent(contestId)}/qr?userId=${encodeURIComponent(userId)}`,
        { headers: { Authorization: `ApiKey ${apiKey}` } },
      );
      if (!res.ok) throw new Error(res.statusText);
      if (qrUrl) URL.revokeObjectURL(qrUrl);
      setQrUrl(URL.createObjectURL(await res.blob()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function prepopulate() {
    if (!contestId) { setError('Select a contest first'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(
        `${BASE}/contest/${encodeURIComponent(contestId)}/prepopulate-randomly`,
        { method: 'POST', headers: { Authorization: `ApiKey ${apiKey}` } },
      );
      if (!res.ok) throw new Error(res.statusText);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><h2 className="text-sm font-bold">QR Generator</h2></CardHeader>
      <CardContent className="flex flex-col gap-3 pb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">User Number</label>
          <input
            type="number"
            placeholder="1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            min={1}
            className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" isDisabled={loading} onPress={generate} className="flex-1">
            {loading ? 'Loading…' : 'Generate QR'}
          </Button>
          <Button variant="ghost" isDisabled={loading} onPress={prepopulate} className="flex-1">
            Prepopulate
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {qrUrl && <img src={qrUrl} alt="QR code" className="w-40 h-40 self-center rounded" />}
      </CardContent>
    </Card>
  );
}
