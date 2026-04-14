'use client';

import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import type { PositionHistoryDto } from '@/client/types.gen';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  entries: PositionHistoryDto[];
}

export function HistoryMap({ entries }: Props) {
  const positions: [number, number][] = entries.map(e => [e.position.lat, e.position.lng]);
  const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));

  return (
    <div className="h-[400px] rounded-lg overflow-hidden border border-zinc-200">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [30, 30] }}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#3b82f6" weight={3} opacity={0.7} />
        {entries.map((entry, i) => (
          <CircleMarker
            key={i}
            center={[entry.position.lat, entry.position.lng]}
            radius={i === 0 ? 6 : i === entries.length - 1 ? 6 : 3}
            fillColor={i === 0 ? '#22c55e' : i === entries.length - 1 ? '#ef4444' : '#3b82f6'}
            color="#fff"
            weight={1}
            fillOpacity={0.9}
          >
            <Popup>
              <div className="text-xs">
                <strong>{i === 0 ? 'Start' : i === entries.length - 1 ? 'Latest' : `#${i + 1}`}</strong><br />
                {new Date(entry.timestamp).toLocaleString()}<br />
                {entry.position.lat.toFixed(5)}, {entry.position.lng.toFixed(5)}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
