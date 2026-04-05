'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

interface Props { contestId: string; logoUrl?: string | null; }

export function LogoUploader({ contestId, logoUrl }: Props) {
  const { apiKey } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const url = `${BASE}/contest/${encodeURIComponent(contestId)}/logo`;
  const authHeader = { Authorization: `ApiKey ${apiKey}` };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(url, { method: 'POST', headers: authHeader, body: form });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  });

  const clear = useMutation({
    mutationFn: async () => {
      const res = await fetch(url, { method: 'DELETE', headers: authHeader });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  });

  return (
    <div className="flex items-center gap-2 mt-1">
      {logoUrl && <img src={logoUrl} alt="logo" className="w-8 h-8 rounded object-cover border" />}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) upload.mutate(e.target.files[0]); }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        className="px-2 py-1 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50"
      >
        {upload.isPending ? 'Uploading…' : 'Upload logo'}
      </button>
      {logoUrl && (
        <button
          onClick={() => clear.mutate()}
          disabled={clear.isPending}
          className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {clear.isPending ? 'Clearing…' : 'Clear'}
        </button>
      )}
    </div>
  );
}
