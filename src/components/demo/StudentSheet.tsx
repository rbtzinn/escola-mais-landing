'use client';

import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
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

  const stat = (label: string, value: string, low: boolean, delta?: React.ReactNode) => (
    <div className="rounded-xl bg-bg px-3 py-2">
      <dt className="text-xs font-semibold">{label}</dt>
      <dd className={clsx('font-display text-xl font-extrabold', low ? 'text-danger' : 'text-fg')}>
        {value}
      </dd>
      {delta && <dd>{delta}</dd>}
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      variant="side"
      title={s.aluno}
      subtitle={`Turma ${s.turma}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={copy}>
            <Icon name="copy" size={18} />
            Copiar texto
          </Button>
          <ButtonLink
            variant="whatsapp"
            size="sm"
            href={whatsappUrl(s.telefone, message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={20} />
            Avisar no WhatsApp
          </ButtonLink>
        </>
      }
    >
      <dl className="grid grid-cols-3 gap-2">
        {stat(
          'Frequência',
          s.frequencia === null ? '—' : `${formatNumber(s.frequencia, 0)}%`,
          s.frequencia !== null && s.frequencia < options.freqMin,
          d && <DeltaTag value={d.frequencia} higherIsBetter unit=" p.p." decimals={0} />,
        )}
        {stat(
          'Média',
          s.media === null ? '—' : formatNumber(s.media),
          s.media !== null && s.media < options.mediaMin,
          d && <DeltaTag value={d.media} higherIsBetter />,
        )}
        {stat('Faltas · Atrasos', `${s.faltas ?? '—'} · ${s.atrasos ?? '—'}`, false)}
      </dl>

      {motivos.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-semibold text-fg">Por que está em risco</h3>
          <ul className="space-y-1 text-sm">
            {motivos.map((m) => (
              <li key={m} className="flex gap-2">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-danger"
                  aria-hidden="true"
                />
                {m}
              </li>
            ))}
          </ul>
          {d?.estavaEmRisco === false && (
            <p className="mt-1.5 text-sm font-semibold text-danger">
              Entrou na lista de risco neste período.
            </p>
          )}
        </section>
      )}

      {Object.keys(s.notas).length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-semibold text-fg">Notas</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(s.notas).map(([disc, n]) => (
              <div key={disc} className="flex justify-between gap-2 border-b border-border py-1">
                <dt>{disc}</dt>
                <dd className={clsx('font-bold', n < options.mediaMin ? 'text-danger' : 'text-fg')}>
                  {formatNumber(n)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-fg">Mensagem para a família</h3>
        <blockquote className="rounded-xl border-l-4 border-whatsapp bg-bg px-4 py-3 text-sm text-fg">
          {message}
        </blockquote>
        <p className="mt-1.5 text-xs">
          {phone
            ? 'Abre a conversa com o telefone da planilha. Você revisa antes de enviar.'
            : 'Sem telefone na planilha: o WhatsApp abre para você escolher o contato.'}
        </p>
      </section>
    </Modal>
  );
}
