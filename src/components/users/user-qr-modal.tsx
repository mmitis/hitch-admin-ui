'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface Props {
  contestId: string;
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserQrModal({ contestId, userId, userName, isOpen, onClose }: Props) {
  const { apiKey } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      return;
    }
    if (!apiKey) return;
    setLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/contest/${encodeURIComponent(contestId)}/qr?userId=${encodeURIComponent(userId)}`,
      { headers: { Authorization: `ApiKey ${apiKey}` } },
    )
      .then((r) => r.blob())
      .then((blob) => setBlobUrl(URL.createObjectURL(blob)))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contestId, userId, apiKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">QR — {userName}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>
        <div className="flex justify-center py-2">
          {loading && <p className="text-sm text-zinc-400">Loading…</p>}
          {blobUrl && <img src={blobUrl} alt={`QR for ${userName}`} className="w-52 h-52" />}
        </div>
      </div>
    </div>
  );
}
