'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContest } from '@/contexts/contest-context';
import { contestControllerGetNews, contestControllerAddNews } from '@/client/sdk.gen';
import type { NewsItemDto } from '@/client/types.gen';
import { NewsItem } from './news-item';

export function NewsList() {
  const { contestId } = useContest();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { data, isLoading, isError } = useQuery<NewsItemDto[]>({
    queryKey: ['news', contestId],
    queryFn: async () => {
      const { data } = await contestControllerGetNews({ path: { contestId: contestId! } });
      return data ?? [];
    },
    enabled: !!contestId,
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await contestControllerAddNews({
        path: { contestId: contestId! },
        body: { title: newTitle, description: newDescription },
      });
      if (error) throw new Error('Failed to add news');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news', contestId] });
      setNewTitle('');
      setNewDescription('');
    },
  });

  const inputClass = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;
  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (isError) return <p className="text-sm text-red-600">Failed to load news.</p>;

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
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description"
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
