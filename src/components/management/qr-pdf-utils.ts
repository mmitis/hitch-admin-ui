import type { jsPDF as JsPDFType } from 'jspdf';

const MARGIN = 40;
const PAGE_W = 595;
const PAGE_H = 842;
const CONTENT_W = PAGE_W - MARGIN * 2;
const QR_SIZE = 200;
const QR_X = MARGIN + CONTENT_W - QR_SIZE;
const QR_Y = MARGIN + 80;
const LOGO_SIZE = 60;

export interface ParticipantCardParams {
  participantNumber: number;
  participantName: string;
  contestName: string;
  destination: string;
  fontRegular: string;
  fontBold: string;
  logoPng: string;
  qrBase64?: string;
}

export function renderParticipantCard(doc: JsPDFType, params: ParticipantCardParams): void {
  const { participantNumber, participantName, contestName, destination, fontRegular, fontBold, logoPng, qrBase64 } = params;

  doc.addFileToVFS('Roboto-Regular.ttf', fontRegular);
  doc.addFileToVFS('Roboto-Bold.ttf', fontBold);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(72);
  doc.setTextColor(0);
  doc.text(`#${participantNumber}`, MARGIN, MARGIN + 68);

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text(participantName || '—', MARGIN, MARGIN + 100);

  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + 116, QR_X - 16, MARGIN + 116);

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text(contestName, MARGIN, MARGIN + 140);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text(destination, MARGIN, MARGIN + 158);

  doc.addImage(logoPng, 'PNG', MARGIN, PAGE_H - MARGIN - LOGO_SIZE, LOGO_SIZE, LOGO_SIZE);

  if (qrBase64) {
    doc.addImage(qrBase64, 'PNG', QR_X, QR_Y, QR_SIZE, QR_SIZE);
  }
}
