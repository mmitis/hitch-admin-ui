import { Topbar } from '@/components/layout/topbar';
import { QrGenerator } from '@/components/management/qr-generator';
import { QrPdfButton } from '@/components/management/qr-pdf-button';
import { ParticipantActions } from '@/components/management/participant-actions';
import { ContestActions } from '@/components/management/contest-actions';

export default function ManagementPage() {
  return (
    <>
      <Topbar title="Management" />
      <main className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-2 gap-4 max-w-4xl">
          <QrGenerator />
          <QrPdfButton />
          <ParticipantActions />
          <ContestActions />
        </div>
      </main>
    </>
  );
}
