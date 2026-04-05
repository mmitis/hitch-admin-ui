'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useContest } from '@/contexts/contest-context';

interface NewsItemData {
  id: string;
  title: string;
  body: string;
}

export function NewsItem({ item }: { item: NewsItemData }) {
  const { apiKey } = useAuth();
  const { contestId } = useContest();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const url = `${BASE}/contest/${encodeURIComponent(contestId!)}/news/${encodeURIComponent(item.id)}`;
  const authJson = { Authorization: `ApiKey ${apiKey}`, 'Content-Type': 'application/json' };

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(url, { method: 'PATCH', headers: authJson, body: JSON.stringify({ title, body }) });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['news', contestId] }); setEditing(false); },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `ApiKey ${apiKey}` } });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news', contestId] }),
  });

  const inputClass = "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
      {editing ? (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={inputClass}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body"
            rows={3}
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setTitle(item.title); setBody(item.body); setEditing(false); }}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
          {save.isError && <p className="text-xs text-red-600">{String(save.error)}</p>}
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-zinc-500 whitespace-pre-wrap">{item.body}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this news item?')) {
                  remove.mutate();
                }
              }}
              disabled={remove.isPending}
              className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
          {remove.isError && <p className="text-xs text-red-600">Delete failed. Please try again.</p>}
        </>
      )}
    </div>
  );
}
