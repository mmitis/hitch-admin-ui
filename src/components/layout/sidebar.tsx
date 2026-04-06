'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useContest } from '@/contexts/contest-context';
import { contestControllerGetContestList } from '@/client/sdk.gen';

const NAV_ITEMS = [
  { href: '/participants', label: 'Participants', icon: '👥' },
  { href: '/qr',          label: 'QR',           icon: '📱' },
  { href: '/news',        label: 'News',          icon: '📰' },
  { href: '/contests',    label: 'Contests',      icon: '🏆' },
  { href: '/schedule',    label: 'Schedule',      icon: '📅' },
  { href: '/map',         label: 'Map',           icon: '🗺' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { apiKey, logout } = useAuth();
  const { contestId, setContest } = useContest();

  const { data: contests } = useQuery({
    queryKey: ['contest-list'],
    queryFn: async () => {
      const { data } = await contestControllerGetContestList();
      return data ?? [];
    },
    enabled: !!apiKey,
  });

  function handleContestChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const c = contests?.find((x) => x.id === id);
    if (id && c) setContest(id, c.name);
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-200">
        <div className="w-8 h-8 rounded-lg bg-blue-600 shrink-0" />
        <div>
          <p className="text-sm font-bold leading-tight">HitchHikersMate</p>
          <p className="text-xs text-zinc-400">Admin</p>
        </div>
      </div>

      {/* Contest selector */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-1.5">
          Contest
        </p>
        <select
          value={contestId ?? ''}
          onChange={handleContestChange}
          className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select contest</option>
          {(contests ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-zinc-200 px-2 py-2">
        <p className="px-3 py-1.5 text-[11px] text-zinc-400 truncate">
          🔑 {apiKey ? `${apiKey.slice(0, 8)}••••` : '—'}
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          ↩ Logout
        </button>
      </div>
    </aside>
  );
}
