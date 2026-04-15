import { Topbar } from '@/components/layout/topbar';
import { QrGenerator } from '@/components/management/qr-generator';
import { QrPdfButton } from '@/components/management/qr-pdf-button';

export default function QrPage() {
  return (
    <>
      <Topbar title="QR Codes" />
      <main className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <QrGenerator />
          <QrPdfButton />
        </div>
      </main>
    </>
  );
}
