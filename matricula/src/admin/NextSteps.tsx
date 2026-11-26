import clsx from 'clsx';
import { useState } from 'react';
import { FieldLabel, fieldClasses } from '@/components/ui/Field';
import { replyMessage } from '@/lib/adminApi';
import type { Run } from './types';
import { Button, Card, Notice } from './ui';

/** Texto dos "próximos passos" que sai no comprovante de matrícula de todos os alunos. */
export function NextSteps({ texto, run }: { texto: string; run: Run }) {
  const [value, setValue] = useState(texto);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const r = await run('comprovante', { texto: value.trim() });
    setBusy(false);
    setMsg(
      r.status === 'ok'
        ? { tone: 'ok', text: 'Salvo. Os próximos comprovantes já saem com este texto.' }
        : { tone: 'error', text: replyMessage(r) },
    );
  };

  return (
    <Card title="Comprovante de matrícula">
      <p className="mb-4 text-fg-muted">
        Depois de enviar, o aluno baixa um comprovante em PDF com o cabeçalho da escola, todas as
        respostas e linhas de assinatura. O texto abaixo aparece no quadro “Próximos passos”.
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void save();
        }}
        className="space-y-4"
      >
        <div>
          <FieldLabel id="proximos">Próximos passos</FieldLabel>
          <textarea
            id="proximos"
            rows={4}
            maxLength={1500}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex.: Entregue na secretaria, até 10/02, cópias do RG, CPF, comprovante de residência e histórico escolar."
            className={clsx(fieldClasses(false), 'resize-y')}
          />
        </div>
        <Notice tone={msg?.tone}>{msg?.text}</Notice>
        <Button type="submit" disabled={busy || value.trim() === texto.trim()} icon="check">
          {busy ? 'Salvando…' : 'Salvar texto'}
        </Button>
      </form>
    </Card>
  );
}
