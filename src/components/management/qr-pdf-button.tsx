'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useContest } from '@/contexts/contest-context';
import { useAuth } from '@/contexts/auth-context';

function stripPolish(text: string): string {
  const map: Record<string, string> = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z',
  };
  return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] ?? ch);
}

function formatContestDate(isoString: string): string {
  const d = new Date(isoString);
  const months = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paz','lis','gru'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

async function loadFontAsBase64(path: string): Promise<string> {
  const res = await fetch(path);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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
      setProgress(`Loading fonts…`);

      const { jsPDF } = await import('jspdf');
      const [fontRegular, fontBold] = await Promise.all([
        loadFontAsBase64('/fonts/Roboto-Regular.ttf'),
        loadFontAsBase64('/fonts/Roboto-Bold.ttf'),
      ]);

      const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'pt' });
      doc.addFileToVFS('Roboto-Regular.ttf', fontRegular);
      doc.addFileToVFS('Roboto-Bold.ttf', fontBold);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

      const MARGIN = 40;
      const PAGE_W = 595;
      const PAGE_H = 842;
      const CONTENT_W = PAGE_W - MARGIN * 2;
      const QR_SIZE = 200;
      const QR_X = MARGIN + CONTENT_W - QR_SIZE;
      const QR_Y = MARGIN + 80;

      setProgress(`Generating… (0/${participantIds.length})`);

      for (let i = 0; i < participantIds.length; i++) {
        const n = participantIds[i];
        if (i > 0) doc.addPage();

        // Large participant number
        doc.setFont('Roboto', 'bold'); doc.setFontSize(72); doc.setTextColor(0);
        doc.text(`#${n}`, MARGIN, MARGIN + 68);

        // Participant name
        doc.setFont('Roboto', 'bold'); doc.setFontSize(22); doc.setTextColor(40);
        doc.text(stripPolish(nameMap[String(n)] ?? '—'), MARGIN, MARGIN + 100);

        // Separator line
        doc.setDrawColor(180); doc.setLineWidth(0.5);
        doc.line(MARGIN, MARGIN + 116, QR_X - 16, MARGIN + 116);

        // Contest info block
        doc.setFont('Roboto', 'bold'); doc.setFontSize(13); doc.setTextColor(0);
        doc.text(stripPolish(contestName), MARGIN, MARGIN + 140);
        doc.setFont('Roboto', 'normal'); doc.setFontSize(11); doc.setTextColor(60);
        doc.text(stripPolish(destination), MARGIN, MARGIN + 158);
        doc.setTextColor(100);
        doc.text(stripPolish(dateLabel), MARGIN, MARGIN + 174);

        // QR code
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
            doc.addImage(base64, 'PNG', QR_X, QR_Y, QR_SIZE, QR_SIZE);
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
        <p className="text-xs text-zinc-400">A4 · 1 card/page · registered participants only</p>
        <Button variant="primary" isDisabled={!!progress} onPress={generate} className="w-full">
          {progress || 'Download QR PDF'}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
