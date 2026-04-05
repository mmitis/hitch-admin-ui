'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useContest } from '@/contexts/contest-context';
import { useAuth } from '@/contexts/auth-context';

function formatContestDate(isoString: string): string {
  const d = new Date(isoString);
  const months = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm}`;
}

export function QrPdfButton() {
  const { contestId } = useContest();
  const { apiKey } = useAuth();
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    if (!contestId) { setError('Select a contest first'); return; }
    if (!apiKey) { setError('Not authenticated'); return; }
    setError(''); setProgress('Generating… (0/?)');
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
    const headers = { Authorization: `ApiKey ${apiKey}` };

    try {
      const [contestRes, rankRes] = await Promise.all([
        fetch(`${BASE}/contest/${encodeURIComponent(contestId)}`, { headers }),
        fetch(`${BASE}/hitch/contest/${encodeURIComponent(contestId)}/ranking`, { headers }),
      ]);
      if (!contestRes.ok) throw new Error(`Contest fetch failed: ${contestRes.statusText}`);

      const contest = await contestRes.json();
      const destination: string = contest.targetPosition?.name ?? '?';
      const contestName: string = contest.name;
      const dateLabel = formatContestDate(contest.dateStart as string);

      const nameMap: Record<string, string> = {};
      if (rankRes.ok) {
        const ranking: Array<{ user: { id: string; name: string } }> = await rankRes.json();
        ranking.forEach((r) => { nameMap[String(r.user.id)] = r.user.name; });
      }

      const participantIds = Object.keys(nameMap).map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      if (participantIds.length === 0) {
        setError('No registered participants found');
        setProgress('');
        return;
      }
      setProgress(`Generating… (0/${participantIds.length})`);

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'pt' });
      const MARGIN = 20, PAGE_H = 842;
      const CARD_H = Math.floor((PAGE_H - MARGIN * 2) / 3);
      const CARD_W = 595 - MARGIN * 2;
      const QR_SIZE = 160;
      const QR_X = MARGIN + CARD_W - QR_SIZE - 10;

      for (let i = 0; i < participantIds.length; i++) {
        const n = participantIds[i];
        const cardIndex = i % 3;
        if (cardIndex === 0 && i > 0) doc.addPage();
        const cardY = MARGIN + cardIndex * CARD_H;

        if (cardIndex > 0) {
          doc.setDrawColor(180); doc.setLineWidth(0.5);
          doc.setLineDashPattern([4, 4], 0);
          doc.line(MARGIN, cardY, MARGIN + CARD_W, cardY);
          doc.setLineDashPattern([], 0); doc.setDrawColor(0);
        }

        doc.setFont('courier', 'bold'); doc.setFontSize(52); doc.setTextColor(0);
        doc.text(`#${n}`, MARGIN + 10, cardY + 58);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
        doc.text(nameMap[String(n)] ?? '—', MARGIN + 10, cardY + 83);

        const footerY = cardY + CARD_H - 70;
        doc.setLineWidth(0.5);
        doc.line(MARGIN + 8, footerY, QR_X - 8, footerY);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0);
        doc.text(contestName, MARGIN + 10, footerY + 16);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(destination, MARGIN + 10, footerY + 31);
        doc.setTextColor(80);
        doc.text(dateLabel, MARGIN + 10, footerY + 46);
        doc.setTextColor(0);

        const qrY = cardY + Math.floor((CARD_H - QR_SIZE) / 2);
        try {
          const qrRes = await fetch(
            `${BASE}/contest/${encodeURIComponent(contestId)}/qr?userId=${encodeURIComponent(n)}`,
            { headers },
          );
          if (qrRes.ok) {
            const blob = await qrRes.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            doc.addImage(base64, 'PNG', QR_X, qrY, QR_SIZE, QR_SIZE);
          }
        } catch { /* leave blank */ }

        setProgress(`Generating… (${i + 1}/${participantIds.length})`);
      }

      doc.save(`qr-codes-${contestId}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setProgress('');
    }
  }

  return (
    <Card>
      <CardHeader><h2 className="text-sm font-bold">QR PDF Download</h2></CardHeader>
      <CardContent className="flex flex-col gap-3 pb-4">
        <p className="text-xs text-zinc-400">A4 · 3 cards/page · registered participants only</p>
        <Button variant="primary" isDisabled={!!progress} onPress={generate} className="w-full">
          {progress || 'Download QR PDF'}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
