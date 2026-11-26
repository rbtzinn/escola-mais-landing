import { useState } from 'react';
import { CONFIG } from '@/config';
import type { Rec } from '@/lib/adminData';
import type { Step } from '@/lib/schema';
import { Button, Notice } from './ui';

/** Reemite o comprovante de matrícula de um aluno (o mesmo PDF que ele baixou ao enviar). */
export function ReceiptButton({
  rec,
  header,
  steps,
  proximos,
}: {
  rec: Rec;
  header: string[];
  steps: Step[];
  proximos: string;
}) {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');

  const baixar = async () => {
    setBusy(true);
    setErro('');
    try {
      const { downloadComprovante, fromRow, logoPng } = await import('@/lib/comprovante');
      await downloadComprovante(
        fromRow(steps, header, rec.row, {
          cabecalho: CONFIG.cabecalho,
          ano: CONFIG.ano,
          protocolo: rec.protocolo,
          enviadoEm: rec.enviadoEm,
          proximos,
          logo: await logoPng(CONFIG.logo),
        }),
      );
    } catch {
      setErro('Não foi possível gerar o comprovante. Tente de novo.');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <Button variant="ghost" icon="download" onClick={() => void baixar()} disabled={busy}>
        {busy ? 'Gerando…' : 'Comprovante de matrícula (PDF)'}
      </Button>
      {erro && <Notice tone="error">{erro}</Notice>}
    </div>
  );
}
