'use client';

import { useQuery } from '@tanstack/react-query';
import { hitchControllerGetUserHistoryAdmin } from '@/client/sdk.gen';
import type { PositionHistoryDto } from '@/client/types.gen';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const HistoryMap = dynamic(() => import('./history-map').then(m => m.HistoryMap), { ssr: false });

interface Props {
  contestId: string;
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserHistoryModal({ contestId, userId, userName, isOpen, onClose }: Props) {
  const [tab, setTab] = useState<'map' | 'list'>('map');
  const { data, isLoading } = useQuery<PositionHistoryDto[]>({
    queryKey: ['user-history', contestId, userId],
    queryFn: async () => {
      const { data } = await hitchControllerGetUserHistoryAdmin({
        path: { contestId, userId },
        headers: { Authorization: '' },
      });
      return data ?? [];
    },
    enabled: isOpen && !!contestId && !!userId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">History — {userName}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setTab('map')}
            className={`px-3 py-1 text-xs rounded ${tab === 'map' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            Map
          </button>
          <button
            onClick={() => setTab('list')}
            className={`px-3 py-1 text-xs rounded ${tab === 'list' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            List
          </button>
        </div>

        <div className="overflow-auto flex-1">
          {isLoading && <p className="text-sm text-zinc-400">Loading…</p>}
          {!isLoading && (!data || data.length === 0) && (
            <p className="text-sm text-zinc-400">No history recorded.</p>
          )}
          {!isLoading && data && data.length > 0 && tab === 'map' && (
            <HistoryMap entries={data} />
          )}
          {!isLoading && data && data.length > 0 && tab === 'list' && (
            <div>
              {data.map((entry, i) => (
                <div key={i} className="text-xs border-b border-zinc-100 py-1.5">
                  <span className="font-medium">{new Date(entry.timestamp).toLocaleString()}</span>
                  {' — '}{entry.position.lat.toFixed(5)}, {entry.position.lng.toFixed(5)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
