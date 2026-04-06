'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestControllerGetLogos, contestControllerSetContestLogo } from '@/client/sdk.gen';
import type { LogoItemDto } from '@/client/types.gen';

interface Props {
  contestId: string;
  logoUrl?: string | null;
  currentLogoFilename?: string | null;
}

export function LogoUploader({ contestId, logoUrl, currentLogoFilename }: Props) {
  const qc = useQueryClient();

  const { data: logos } = useQuery<LogoItemDto[]>({
    queryKey: ['logos'],
    queryFn: async () => {
      const { data } = await contestControllerGetLogos();
      return data ?? [];
    },
  });

  const setLogo = useMutation({
    mutationFn: async (filename: string | null) => {
      const { error } = await contestControllerSetContestLogo({
        path: { contestId },
        body: { logo: filename as never },
      });
      if (error) throw new Error('Failed to set logo');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  });

  return (
    <div className="flex items-center gap-2 mt-1">
      {logoUrl && <img src={logoUrl} alt="logo" className="w-8 h-8 rounded object-cover border" />}
      <select
        value={currentLogoFilename ?? ''}
        onChange={(e) => setLogo.mutate(e.target.value || null)}
        disabled={setLogo.isPending}
        className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">No logo</option>
        {(logos ?? []).map((logo) => (
          <option key={logo.filename} value={logo.filename}>{logo.filename}</option>
        ))}
      </select>
      {setLogo.isError && <p className="text-xs text-red-600">Failed to update logo</p>}
    </div>
  );
}
