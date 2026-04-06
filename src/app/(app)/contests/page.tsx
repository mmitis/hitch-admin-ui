import { Topbar } from '@/components/layout/topbar';
import { ContestsList } from '@/components/contests/contests-list';
import { ContestActions } from '@/components/management/contest-actions';

export default function ContestsPage() {
  return (
    <>
      <Topbar title="Contests" />
      <main className="flex-1 overflow-auto p-5">
        <div className="flex flex-col gap-6 max-w-3xl">
          <ContestsList />
          <ContestActions />
        </div>
      </main>
    </>
  );
}
