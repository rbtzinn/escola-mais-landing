'use client';

import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { type Comparison, studentKey } from '@/lib/spreadsheet/compare';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis, Student } from '@/lib/spreadsheet/types';
import { familyMessage, normalizePhone, whatsappUrl } from '@/lib/spreadsheet/whatsapp';
import { DeltaTag } from './levels';

/** Ficha do aluno: números, motivos do alerta e mensagem pronta para a família. */
export function StudentSheet({
  analysis,
  comparison,
  student,
  onClose,
}: {
  analysis: Analysis;
  comparison: Comparison | null;
  student: Student | null;
  onClose: () => void;
}) {
  const toast = useToast();
  if (!student) return null;
  const s = student;
  const { options } = analysis;
  const motivos = analysis.risco.find((r) => r.student === s)?.motivos ?? [];
  const d = comparison?.alunos[studentKey(s.aluno, s.turma)];
  const message = familyMessage(s, options);
  const phone = normalizePhone(s.telefone);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.show({ title: 'Mensagem copiada', description: 'Cole no WhatsApp ou no SMS.' });
    } catch {
      toast.show({ title: 'Não foi possível copiar', description: 'Selecione o texto e copie.' });
    }
  };

  return (
    <Modal open onClose={onClose} title={s.aluno}>
      <p className="font-semibold text-fg">Turma {s.turma}</p>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-bg p-2">
          <dt className="text-xs font-semibold">Frequência</dt>
          <dd
            className={clsx(
              'font-display text-xl font-extrabold',
              s.frequencia !== null && s.frequencia < options.freqMin ? 'text-danger' : 'text-fg',
            )}
          >
            {s.frequencia === null ? '—' : `${formatNumber(s.frequencia, 0)}%`}
          </dd>
          {d && (
            <dd>
              <DeltaTag value={d.frequencia} higherIsBetter unit=" p.p." decimals={0} />
            </dd>
          )}
        </div>
        <div className="rounded-xl bg-bg p-2">
          <dt className="text-xs font-semibold">Média</dt>
          <dd
            className={clsx(
              'font-display text-xl font-extrabold',
              s.media !== null && s.media < options.mediaMin ? 'text-danger' : 'text-fg',
            )}
          >
            {s.media === null ? '—' : formatNumber(s.media)}
          </dd>
          {d && (
            <dd>
              <DeltaTag value={d.media} higherIsBetter />
            </dd>
          )}
        </div>
        <div className="rounded-xl bg-bg p-2">
          <dt className="text-xs font-semibold">Faltas · Atrasos</dt>
          <dd className="font-display text-xl font-extrabold text-fg">
            {s.faltas ?? '—'} · {s.atrasos ?? '—'}
          </dd>
        </div>
      </dl>

      {motivos.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {Object.keys(s.notas).length > 0 && (
        <p className="text-sm">
          {Object.entries(s.notas)
            .map(([disc, n]) => `${disc}: ${formatNumber(n)}`)
            .join(' · ')}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-bg p-3">
        <h3 className="text-sm font-semibold text-fg">Mensagem para a família</h3>
        <p className="mt-1 text-sm">{message}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <ButtonLink
            href={whatsappUrl(s.telefone, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="!min-h-10 text-sm"
          >
            <Icon name="message" size={18} />
            Avisar a família no WhatsApp
          </ButtonLink>
          <Button variant="secondary" onClick={copy} className="!min-h-10 text-sm">
            <Icon name="copy" size={18} />
            Copiar texto
          </Button>
        </div>
        <p className="mt-2 text-xs">
          {phone
            ? 'Abre a conversa com o telefone da planilha. Você revisa antes de enviar.'
            : 'Sem telefone na planilha: o WhatsApp abre para você escolher o contato.'}
        </p>
      </div>
      {d?.estavaEmRisco === false && motivos.length > 0 && (
        <p className="text-sm font-semibold text-danger">Entrou na lista de risco neste período.</p>
      )}
    </Modal>
  );
}
