import { Topbar } from '@/components/layout/topbar';
import { ContestsList } from '@/components/contests/contests-list';

export default function ContestsPage() {
  return (
    <>
      <Topbar title="Contests" />
      <main className="flex-1 overflow-auto p-5">
        <ContestsList />
      </main>
    </>
  );
}
