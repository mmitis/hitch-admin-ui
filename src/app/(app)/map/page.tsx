'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(
  () => import('@/components/map/map-view').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
        Loading map…
      </div>
    ),
  },
);

export default function MapPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <MapView />
    </div>
  );
}
