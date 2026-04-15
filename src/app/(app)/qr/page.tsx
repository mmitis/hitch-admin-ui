import { Topbar } from '@/components/layout/topbar';
import { QrPdfButton } from '@/components/management/qr-pdf-button';

export default function QrPage() {
  return (
    <>
      <Topbar title="QR Codes" />
      <main className="flex-1 overflow-auto p-5">
        <div className="max-w-sm">
          <QrPdfButton />
        </div>
      </main>
    </>
  );
}
