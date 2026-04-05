'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

interface Props { contestId: string; logoUrl?: string | null; currentLogo?: string | null; }

export function LogoUploader({ contestId, logoUrl, currentLogo }: Props) {
  const { apiKey } = useAuth();
  const qc = useQueryClient();
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const authHeader = { Authorization: `ApiKey ${apiKey}` };

  const { data: logos } = useQuery<string[]>({
    queryKey: ['logos'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/contest/logos`, { headers: authHeader });
      if (!res.ok) throw new Error(res.statusText);
      // logos endpoint returns Record<string, string> or string[] — handle both
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return Object.keys(data);
    },
    enabled: !!apiKey,
  });

  const setLogo = useMutation({
    mutationFn: async (logo: string | null) => {
      const res = await fetch(`${BASE}/contest/${encodeURIComponent(contestId)}/logo`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo }),
      });
      if (!res.ok) throw new Error(res.statusText);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  });

  return (
    <div className="flex items-center gap-2 mt-1">
      {logoUrl && <img src={logoUrl} alt="logo" className="w-8 h-8 rounded object-cover border" />}
      <select
        value={currentLogo ?? ''}
        onChange={(e) => setLogo.mutate(e.target.value || null)}
        disabled={setLogo.isPending}
        className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">No logo</option>
        {(logos ?? []).map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      {setLogo.isError && <p className="text-xs text-red-600">Failed to update logo</p>}
    </div>
  );
}
