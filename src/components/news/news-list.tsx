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
  const [formOpen, setFormOpen] = useState(false);
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
      setFormOpen(false);
    },
  });

  const inputClass = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  if (!contestId) return <p className="text-sm text-zinc-400">Select a contest first.</p>;
  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (isError) return <p className="text-sm text-red-600">Failed to load news.</p>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-700">
          News {data && data.length > 0 ? `(${data.length})` : ''}
        </p>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {formOpen ? 'Cancel' : '+ New news'}
        </button>
      </div>

      {/* Add form (collapsible) */}
      {formOpen && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className={inputClass}
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              onClick={() => add.mutate()}
              disabled={add.isPending || !newTitle.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {add.isPending ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => setFormOpen(false)}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
          {add.isError && <p className="text-xs text-red-600">{String(add.error)}</p>}
        </div>
      )}

      {/* List */}
      {data && data.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">No news yet. Add the first item above.</p>
        </div>
      ) : (
        (data ?? []).map((item) => <NewsItem key={item.id} item={item} />)
      )}
    </div>
  );
}
