import { Topbar } from '@/components/layout/topbar';

export default function NewsPage() {
  return (
    <>
      <Topbar title="News" />
      <main className="flex-1 overflow-auto p-5">
        <p className="text-zinc-400 text-sm">Coming soon…</p>
      </main>
    </>
  );
}
