'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import { useContest } from '@/contexts/contest-context';
import { hitchControllerGetMapPositionsAdmin, hitchControllerGetRanking } from '@/client/sdk.gen';
import type { MapPositionDto, RankingDto } from '@/client/types.gen';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths broken by webpack bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapUser {
  id: string;
  name: string;
  activityStatus: string;
  sent: boolean;
  lat: number;
  lng: number;
}

interface MapMeta {
  startingPosition: { name: string; lat: number; lng: number } | null;
  targetPosition: { name: string; lat: number; lng: number } | null;
}

function FlyToUser({ position, onDone }: { position: [number, number] | null; onDone: () => void }) {
  const map = useMap();
  useEffect(() => { if (position) { map.flyTo(position, 13); onDone(); } }, [position, map, onDone]);
  return null;
}

function effectiveStatus(u: MapUser): string {
  return u.sent ? u.activityStatus : 'NOT_STARTED';
}

function statusColor(status: string) {
  if (status === 'FINISHED') return '#38a169';
  if (status === 'ON_ROAD') return '#3182ce';
  if (status === 'INACTIVE') return '#d69e2e';
  if (status === 'NOT_STARTED') return '#805ad5';
  return '#718096';
}

export function MapView() {
  const { contestId } = useContest();
  const router = useRouter();
  const [users, setUsers] = useState<MapUser[]>([]);
  const [meta, setMeta] = useState<MapMeta>({ startingPosition: null, targetPosition: null });
  const [search, setSearch] = useState('');
  const [liveOn, setLiveOn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearFlyTo = useCallback(() => setFlyTo(null), []);

  const fetchData = useCallback(async () => {
    if (!contestId) return;
    try {
      const [mapResult, rankResult] = await Promise.all([
        hitchControllerGetMapPositionsAdmin({ path: { contestId }, headers: { Authorization: '' } }),
        hitchControllerGetRanking({ path: { contestId } }),
      ]);

      const mapResponse = mapResult.data as {
        users: MapPositionDto[];
        startingPosition?: { name: string; lat: number; lng: number };
        targetPosition?: { name: string; lat: number; lng: number };
      } | undefined;
      const ranking: RankingDto[] = rankResult.data ?? [];

      const rankingMap = Object.fromEntries(ranking.map((r) => [r.user.id, r]));
      const positions = mapResponse?.users ?? [];

      setUsers(positions.map((u) => ({
        id: u.user.id,
        name: u.user.name,
        activityStatus: rankingMap[u.user.id]?.activityStatus ?? 'WAITING',
        sent: rankingMap[u.user.id]?.sent ?? false,
        lat: u.position.lat,
        lng: u.position.lng,
      })));
      setMeta({
        startingPosition: mapResponse?.startingPosition ?? null,
        targetPosition: mapResponse?.targetPosition ?? null,
      });
    } catch { /* silent on fetch failure */ }
  }, [contestId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (liveOn) {
      timer.current = setInterval(fetchData, 30_000);
    } else {
      if (timer.current) clearInterval(timer.current);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [liveOn, fetchData]);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search),
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-[280px] shrink-0 bg-white border-r border-zinc-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-100">
            <input
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-zinc-400 mt-1">{filtered.length} participants</p>
          </div>
          <ul className="flex-1 overflow-auto divide-y divide-zinc-50">
            {filtered.map((u) => (
              <li
                key={u.id}
                className="px-3 py-2 cursor-pointer hover:bg-zinc-50 text-sm flex items-center justify-between"
                onClick={() => setFlyTo([u.lat, u.lng])}
              >
                <span>
                  <span className="font-medium">#{u.id}</span>
                  <span className="text-zinc-500 ml-1">{u.name}</span>
                </span>
                <span className="text-[10px]" style={{ color: statusColor(effectiveStatus(u)) }}>{effectiveStatus(u)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Map area */}
      <div className="flex-1 relative">
        <MapContainer center={[52, 19]} zoom={6} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyToUser position={flyTo} onDone={clearFlyTo} />

          {/* Start marker */}
          {meta.startingPosition && (
            <Marker
              position={[meta.startingPosition.lat, meta.startingPosition.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:#2d6a4f;width:16px;height:16px;border-radius:3px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:bold">S</div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            >
              <Popup><strong>Start:</strong> {meta.startingPosition.name}</Popup>
            </Marker>
          )}

          {/* Target marker */}
          {meta.targetPosition && (
            <Marker
              position={[meta.targetPosition.lat, meta.targetPosition.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:#c1121f;width:16px;height:16px;border-radius:3px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:bold">F</div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            >
              <Popup><strong>Finish:</strong> {meta.targetPosition.name}</Popup>
            </Marker>
          )}

          {/* Participant markers */}
          {users.map((u) => (
            <Marker
              key={u.id}
              position={[u.lat, u.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:${statusColor(effectiveStatus(u))};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            >
              <Popup>
                <strong>#{u.id}</strong> {u.name}<br />
                <span style={{ color: statusColor(effectiveStatus(u)) }}>{effectiveStatus(u)}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Controls — top right */}
        <div className="absolute top-2 right-2 z-[1000] flex gap-1">
          <button
            className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 shadow-sm hover:bg-zinc-50"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰ {sidebarOpen ? 'Hide list' : 'Show list'}
          </button>
          <button
            className={`border rounded-md px-2 py-1 text-xs font-medium shadow-sm ${
              liveOn ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-zinc-200 text-zinc-500'
            }`}
            onClick={() => setLiveOn((v) => !v)}
          >
            ● Live
          </button>
          <button
            className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 shadow-sm hover:bg-zinc-50"
            onClick={() => router.push('/management')}
          >
            ✕ Exit
          </button>
        </div>
      </div>
    </div>
  );
}
