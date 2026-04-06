import { Topbar } from '@/components/layout/topbar';
import { ScheduleTab } from '@/components/schedule/schedule-tab';

export default function SchedulePage() {
  return (
    <>
      <Topbar title="Schedule" />
      <main className="flex-1 overflow-auto p-5">
        <ScheduleTab />
      </main>
    </>
  );
}
