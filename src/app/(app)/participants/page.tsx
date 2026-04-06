import { Topbar } from '@/components/layout/topbar';
import { ParticipantsTable } from '@/components/participants/participants-table';

export default function ParticipantsPage() {
  return (
    <>
      <Topbar title="Participants" />
      <main className="flex-1 overflow-auto p-5">
        <ParticipantsTable />
      </main>
    </>
  );
}
