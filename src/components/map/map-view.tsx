'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useContest } from '@/contexts/contest-context';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// Fix Leaflet default icon paths broken by webpack bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapUser {
  externalUserId: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
}

function FlyToUser({ position, onDone }: { position: [number, number] | null; onDone: () => void }) {
  const map = useMap();
  useEffect(() => { if (position) { map.flyTo(position, 13); onDone(); } }, [position, map, onDone]);
  return null;
}

function statusColor(status: string) {
  if (status === 'FINISHED') return '#38a169';
  if (status === 'ACTIVE') return '#3182ce';
  return '#718096';
}

export function MapView() {
  const { apiKey } = useAuth();
  const { contestId } = useContest();
  const router = useRouter();
  const [users, setUsers] = useState<MapUser[]>([]);
  const [search, setSearch] = useState('');
  const [liveOn, setLiveOn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearFlyTo = useCallback(() => setFlyTo(null), []);

  const fetchData = useCallback(async () => {
    if (!contestId || !apiKey) return;
    const headers = { Authorization: `ApiKey ${apiKey}` };
    try {
      const [mapRes, rankRes] = await Promise.all([
        fetch(`${BASE}/hitch/contest/${encodeURIComponent(contestId)}/map/admin`, { headers }),
        fetch(`${BASE}/hitch/contest/${encodeURIComponent(contestId)}/ranking`, { headers }),
      ]);
      const mapData: Array<{ externalUserId: string; latitude: number; longitude: number; status: string }> =
        mapRes.ok ? await mapRes.json() : [];
      const ranking: Array<{ user: { id: string; name: string } }> = rankRes.ok ? await rankRes.json() : [];
      const nameMap = Object.fromEntries(ranking.map((r) => [r.user.id, r.user.name]));
      setUsers(mapData.map((u) => ({ ...u, name: nameMap[u.externalUserId] ?? `#${u.externalUserId}` })));
    } catch { /* silent on fetch failure */ }
  }, [contestId, apiKey]);

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
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.externalUserId.includes(search),
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
                key={u.externalUserId}
                className="px-3 py-2 cursor-pointer hover:bg-zinc-50 text-sm flex items-center justify-between"
                onClick={() => setFlyTo([u.latitude, u.longitude])}
              >
                <span>
                  <span className="font-medium">#{u.externalUserId}</span>
                  <span className="text-zinc-500 ml-1">{u.name}</span>
                </span>
                <span className="text-[10px]" style={{ color: statusColor(u.status) }}>{u.status}</span>
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
          {users.map((u) => (
            <Marker
              key={u.externalUserId}
              position={[u.latitude, u.longitude]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:${statusColor(u.status)};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            >
              <Popup>
                <strong>#{u.externalUserId}</strong> {u.name}<br />
                <span style={{ color: statusColor(u.status) }}>{u.status}</span>
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
