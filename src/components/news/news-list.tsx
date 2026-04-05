'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useContest } from '@/contexts/contest-context';
import { NewsItem } from './news-item';

interface NewsItemData { id: string; title: string; body: string; }

export function NewsList() {
  const { apiKey } = useAuth();
  const { contestId } = useContest();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const newsUrl = `${BASE}/contest/${encodeURIComponent(contestId ?? '')}/news`;
  const authHeader = { Authorization: `ApiKey ${apiKey}` };
  const authJson = { ...authHeader, 'Content-Type': 'application/json' };

  const { data, isLoading } = useQuery<NewsItemData[]>({
    queryKey: ['news', contestId],
    queryFn: async () => {
      const res = await fetch(newsUrl, { headers: authHeader });
      return res.json();
    },
    enabled: !!contestId && !!apiKey,
  });

  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch(newsUrl, {
        method: 'POST',
        headers: authJson,
        body: JSON.stringify({ title: newTitle, body: newBody }),
      });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news', contestId] });
      setNewTitle('');
      setNewBody('');
    },
  });

  const inputClass = "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;
  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Add form */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
        <p className="text-sm font-semibold">Add News Item</p>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Title"
          className={inputClass}
        />
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Body"
          rows={2}
          className={inputClass}
        />
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending || !newTitle.trim()}
          className="self-start px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {add.isPending ? 'Adding…' : 'Add'}
        </button>
        {add.isError && <p className="text-xs text-red-600">{String(add.error)}</p>}
      </div>

      {/* News items */}
      {(data ?? []).map((item) => <NewsItem key={item.id} item={item} />)}
    </div>
  );
}
