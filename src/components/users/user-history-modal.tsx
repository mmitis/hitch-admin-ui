'use client';

import { useQuery } from '@tanstack/react-query';
import { hitchControllerGetUserHistoryAdmin } from '@/client/sdk.gen';
import type { PositionHistoryDto } from '@/client/types.gen';

interface Props {
  contestId: string;
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserHistoryModal({ contestId, userId, userName, isOpen, onClose }: Props) {
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
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">History — {userName}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-auto flex-1">
          {isLoading && <p className="text-sm text-zinc-400">Loading…</p>}
          {!isLoading && (!data || data.length === 0) && (
            <p className="text-sm text-zinc-400">No history recorded.</p>
          )}
          {(data ?? []).map((entry, i) => (
            <div key={i} className="text-xs border-b border-zinc-100 py-1.5">
              <span className="font-medium">{new Date(entry.timestamp).toLocaleString()}</span>
              {' — '}{entry.position.lat.toFixed(5)}, {entry.position.lng.toFixed(5)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
