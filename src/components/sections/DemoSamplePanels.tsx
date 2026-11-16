'use client';

import clsx from 'clsx';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { ClassGrid } from '@/components/demo/ClassGrid';
import { KpiCards } from '@/components/demo/KpiCards';
import { Verdict } from '@/components/demo/Verdict';
import { QrCode } from '@/components/dia/QrCode';
import { Icon } from '@/components/icons';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Button } from '@/components/ui/Button';
import { formatHora } from '@/lib/attendance/clock';
import { publicName } from '@/lib/attendance/codes';
import { lateMessage } from '@/lib/attendance/message';
import type { RegisterResult } from '@/lib/attendance/records';
import { CHANNEL_LABEL, type LateRecord, type RosterEntry } from '@/lib/attendance/types';
import { type Chamadas, absentKeys } from '@/lib/daily/attendance';
import { type Meals, mealCount, mealTotal } from '@/lib/daily/meals';
import { AULAS, type Aula, planDay } from '@/lib/daily/timetable';
import { riskShare } from '@/lib/spreadsheet/insights';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';

/** Título pequeno de bloco, com uma linha de explicação. */
function BlockTitle({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-2xl leading-tight font-medium">{title}</h3>
      {text && <p className="mt-1 text-fg-muted">{text}</p>}
    </div>
  );
}

/** Botão de marcar/desmarcar em formato de etiqueta (o estado vai em aria-pressed). */
function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx(
        'min-h-10 rounded-md border px-3 text-sm font-semibold transition-colors',
        on ? 'border-danger bg-danger/10 text-danger' : 'border-fg/30 hover:border-fg',
      )}
    >
      {children}
    </button>
  );
}

// ---------- A. Painel da planilha ----------

export function PainelPanel({
  analysis,
  initialTurma,
}: {
  analysis: Analysis;
  initialTurma: string;
}) {
  const [turma, setTurma] = useState(initialTurma);
  const summary = analysis.turmas.find((t) => t.turma === turma);
  const emRisco = analysis.risco.filter((r) => r.student.turma === turma);

  return (
    <div className="space-y-5">
      <Verdict analysis={analysis} comparison={null} />
      <KpiCards analysis={analysis} comparison={null} />
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <div>
          <ClassGrid analysis={analysis} comparison={null} onOpen={setTurma} />
          <p className="mt-2 text-sm text-fg-muted">
            Toque em uma turma para ver quem precisa de atenção.
          </p>
        </div>
        {summary && (
          <section
            aria-live="polite"
            aria-label={`Turma ${turma}`}
            className="border-t-2 border-fg pt-3"
          >
            <p className="eyebrow text-fg-muted">Turma selecionada</p>
            <h3 className="mt-1 font-display text-3xl leading-tight font-medium">{turma}</h3>
            <p className="text-fg-muted">
              {summary.emRisco} de {summary.alunos} alunos em risco (
              {formatNumber(riskShare(summary.emRisco, summary.alunos), 0)}%)
            </p>
            {emRisco.length === 0 ? (
              <p className="mt-4 border-t border-border pt-3">Nenhum aluno em risco nesta turma.</p>
            ) : (
              <ul className="mt-4 border-t border-border">
                {emRisco.slice(0, 4).map((r) => (
                  <li key={r.student.aluno} className="border-b border-border py-2.5">
                    <span className="block font-semibold">{r.student.aluno}</span>
                    <span className="block text-sm text-fg-muted">{r.motivos.join(' · ')}</span>
                  </li>
                ))}
              </ul>
            )}
            {emRisco.length > 4 && (
              <p className="mt-2 text-sm text-fg-muted">
                e mais {emRisco.length - 4}. Na demo, cada aluno abre uma ficha com o aviso pronto
                para a família.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- B. QR da entrada e celular do aluno ----------

// O endereço completo do link só existe no navegador (no servidor, usa o caminho).
const subscribeNoop = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => '',
  );

/** Lista do que já foi registrado hoje, do jeito que a coordenação vê. */
function RecordList({ records }: { records: LateRecord[] }) {
  if (records.length === 0)
    return (
      <p className="border-y border-border py-3 text-fg-muted">Nenhum atraso registrado ainda.</p>
    );
  return (
    <ul className="border-t border-border">
      {records.map((r) => (
        <li key={r.id} className="flex items-baseline gap-3 border-b border-border py-2.5">
          <span className="font-mono text-sm">{formatHora(new Date(r.at))}</span>
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{r.aluno}</span>{' '}
            <span className="text-sm text-fg-muted">
              {r.turma} · {r.minutos} min · {CHANNEL_LABEL[r.channel]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EntradaPanel({
  students,
  roster,
  records,
  chamadas,
  meals,
  onRegister,
  onMeal,
}: {
  students: RosterEntry[];
  roster: RosterEntry[];
  records: LateRecord[];
  chamadas: Chamadas;
  meals: Meals;
  onRegister: (entry: RosterEntry) => RegisterResult;
  onMeal: (key: string, vai: boolean) => void;
}) {
  const origin = useOrigin();
  const [aluno, setAluno] = useState<RosterEntry | null>(null);
  const [repetido, setRepetido] = useState(false);
  const registro = aluno ? records.find((r) => r.key === aluno.key) : undefined;
  const refeicoes = mealTotal(mealCount(roster, chamadas, records, meals));
  const resposta = aluno ? meals[aluno.key] : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
      {/* celular do aluno */}
      <div className="mx-auto w-full max-w-[22rem] rounded-[2.25rem] border-[9px] border-fg bg-fg">
        <div className="flex justify-center pb-2" aria-hidden="true">
          <span className="h-1.5 w-16 rounded-full bg-bg/30" />
        </div>
        <div className="min-h-[25rem] rounded-[1.6rem] bg-bg p-4">
          {!aluno ? (
            <>
              <p className="font-display text-2xl font-medium">Olá! Quem é você?</p>
              <p className="mt-1 text-sm text-fg-muted">
                Na escola, o aluno informa turma e matrícula (e o aniversário na 1ª vez). Aqui,
                escolha um aluno de exemplo:
              </p>
              <ul className="mt-4 space-y-2">
                {students.map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setAluno(s);
                        setRepetido(false);
                      }}
                      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-fg/30 bg-surface px-4 text-left font-semibold transition-colors hover:border-fg"
                    >
                      <span>{publicName(s.aluno)}</span>
                      <span className="font-mono text-xs font-normal text-fg-muted">{s.turma}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-medium">Olá, {publicName(aluno.aluno)}</p>
              <p className="text-sm text-fg-muted">Turma {aluno.turma}</p>

              <div className="mt-4" role="status">
                {registro ? (
                  <div className="rounded-md border-2 border-primary/50 bg-primary/10 p-3 text-center">
                    <p className="font-display text-lg font-semibold">
                      Chegada registrada às {formatHora(new Date(registro.at))}
                    </p>
                    <p className="text-sm text-fg-muted">
                      {repetido
                        ? 'Você já tinha registrado hoje: vale um registro por dia.'
                        : `${registro.minutos} min depois da entrada. A coordenação já está vendo.`}
                    </p>
                  </div>
                ) : null}
              </div>
              {!registro && (
                <Button
                  className="w-full"
                  onClick={() => setRepetido(onRegister(aluno).status === 'duplicado')}
                >
                  Registrar chegada atrasada
                </Button>
              )}

              <p className="mt-5 text-sm font-semibold" id="amostra-merenda">
                Vai comer a merenda hoje?
              </p>
              <div
                role="group"
                aria-labelledby="amostra-merenda"
                className="mt-2 grid grid-cols-2 gap-2"
              >
                {(
                  [
                    [true, 'Vou comer'],
                    [false, 'Hoje não'],
                  ] as const
                ).map(([vai, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={resposta === vai}
                    onClick={() => onMeal(aluno.key, vai)}
                    className={clsx(
                      'min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors',
                      resposta === vai
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-fg/30 bg-surface hover:border-fg',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setAluno(null)}
                className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline underline-offset-4"
              >
                Trocar de aluno
              </button>
            </>
          )}
        </div>
      </div>

      {/* o que a escola vê */}
      <div>
        <BlockTitle
          title="O aluno lê o QR, a escola vê na hora"
          text="Um cartaz na entrada resolve: sem aplicativo, sem senha. Registre um atraso no celular ao lado e acompanhe aqui."
        />
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="qr-light w-36 border border-fg bg-surface p-3 text-center text-fg">
            <QrCode
              value={`${origin}/demo/dia/aluno`}
              label="QR da entrada, que abre a tela do aluno"
              className="w-full"
            />
            <p className="eyebrow mt-2 text-fg-muted">Cartaz da entrada</p>
          </div>
          <div>
            <dl className="grid grid-cols-2 border-y border-fg/60">
              <div className="border-r border-border px-1 py-3">
                <dt className="text-sm text-fg-muted">Atrasos hoje</dt>
                <dd className="font-display text-4xl font-medium">{records.length}</dd>
              </div>
              <div className="py-3 pl-4">
                <dt className="text-sm text-fg-muted">Refeições a preparar</dt>
                <dd className="font-display text-4xl font-medium">{refeicoes}</dd>
              </div>
            </dl>
            <p className="eyebrow mt-5 mb-1 text-fg-muted">Registros de hoje</p>
            <div aria-live="polite">
              <RecordList records={records} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- C. Chamada e horário ----------

/** Grade de exemplo: mostramos sempre a segunda-feira, para a amostra ser igual em qualquer dia. */
const DIA = 1;
const SHOWN = 8;

export function RoutinePanel({
  turma,
  students,
  ausentes,
  records,
  onToggleAbsent,
  grade,
  faltaram,
  onToggleTeacher,
}: {
  turma: string;
  students: RosterEntry[];
  ausentes: string[];
  records: LateRecord[];
  onToggleAbsent: (key: string) => void;
  grade: Aula[];
  faltaram: string[];
  onToggleTeacher: (professor: string) => void;
}) {
  const teachers = useMemo(
    () => [
      ...new Set(grade.filter((a) => a.turma === turma && a.dia === DIA).map((a) => a.professor)),
    ],
    [grade, turma],
  );
  const plan = useMemo(
    () => planDay(grade, DIA, faltaram).find((p) => p.turma === turma),
    [grade, faltaram, turma],
  );
  // Quem registrou atraso está na escola, mesmo marcado como ausente na chamada.
  const fora = absentKeys({ [turma]: { turma, ausentes, por: '', em: '' } }, records);
  const presentes = students.length - students.filter((s) => fora.has(s.key)).length;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <section aria-labelledby="amostra-chamada">
        <h3 id="amostra-chamada" className="font-display text-2xl leading-tight font-medium">
          Chamada do {turma}
        </h3>
        <p className="mt-1 mb-4 text-fg-muted">
          O professor marca só quem faltou. O resto conta como presente.
        </p>
        <ul className="border-t border-border">
          {students.slice(0, SHOWN).map((s) => {
            const on = ausentes.includes(s.key);
            return (
              <li
                key={s.key}
                className="flex items-center justify-between gap-3 border-b border-border py-1.5"
              >
                <span className={clsx(on && 'text-fg-muted line-through')}>{s.aluno}</span>
                <Chip on={on} onClick={() => onToggleAbsent(s.key)}>
                  {on ? 'Faltou' : 'Presente'}
                </Chip>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-fg-muted">
          Mostrando {Math.min(SHOWN, students.length)} de {students.length} alunos.
        </p>
        <p className="mt-3 border-t-2 border-fg pt-3" aria-live="polite">
          <span className="font-display text-4xl font-medium">
            {presentes}/{students.length}
          </span>{' '}
          <span className="text-fg-muted">presentes hoje</span>
        </p>
      </section>

      <section aria-labelledby="amostra-horario">
        <h3 id="amostra-horario" className="font-display text-2xl leading-tight font-medium">
          Um professor faltou?
        </h3>
        <p className="mt-1 mb-4 text-fg-muted">
          Marque quem não veio e o horário do {turma} se reorganiza sozinho.
        </p>
        <div role="group" aria-label="Professores do dia" className="flex flex-wrap gap-2">
          {teachers.map((p) => (
            <Chip key={p} on={faltaram.includes(p)} onClick={() => onToggleTeacher(p)}>
              {p}
              {faltaram.includes(p) && ' faltou'}
            </Chip>
          ))}
        </div>
        <ol className="mt-5 border-t border-fg/60" aria-live="polite">
          {plan?.slots.map((s) => (
            <li
              key={s.aula}
              className={clsx(
                'grid grid-cols-[3.5rem_1fr] items-baseline gap-3 border-b border-border px-1 py-2.5',
                s.tipo === 'adiantada' && 'bg-accent/20',
                s.tipo === 'vaga' && 'bg-danger/10',
              )}
            >
              <span className="font-mono text-sm text-fg-muted">{AULAS[s.aula - 1].inicio}</span>
              <span>
                {s.tipo === 'vaga' && (
                  <>
                    <span className="font-semibold text-danger">Horário vago</span>
                    {s.livres && s.livres.length > 0 && (
                      <span className="block text-sm text-fg-muted">
                        Livres para cobrir: {s.livres.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </>
                )}
                {s.tipo === 'sem-aula' && <span className="text-fg-muted">Sem aula</span>}
                {s.sugerida && (
                  <>
                    <span className="font-semibold">{s.sugerida.disciplina}</span>{' '}
                    <span className="text-sm text-fg-muted">
                      · {s.sugerida.professor.replace(/\s*\(.*\)$/, '')}
                    </span>
                    {s.tipo === 'adiantada' && (
                      <span className="block text-sm">Adiantada da {s.de}ª aula</span>
                    )}
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
        {plan?.saiAs && (
          <p className="mt-3 text-sm font-semibold">A turma pode sair às {plan.saiAs}.</p>
        )}
      </section>
    </div>
  );
}

// ---------- D. Merenda e avisos da coordenação ----------

export function KitchenPanel({
  roster,
  chamadas,
  records,
  meals,
  onSampleLate,
  onNotify,
}: {
  roster: RosterEntry[];
  chamadas: Chamadas;
  records: LateRecord[];
  meals: Meals;
  onSampleLate: () => void;
  onNotify: (id: string) => void;
}) {
  const byClass = mealCount(roster, chamadas, records, meals);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <section aria-labelledby="amostra-cozinha">
        <h3 id="amostra-cozinha" className="font-display text-2xl leading-tight font-medium">
          Quanto a cozinha prepara
        </h3>
        <p className="mt-1 mb-4 text-fg-muted">
          Sai da chamada e das respostas dos alunos. Quem faltou ou disse “hoje não” sai da conta.
        </p>
        <p className="border-t-2 border-fg pt-3" aria-live="polite">
          <span className="font-display text-6xl leading-none font-medium">
            {mealTotal(byClass)}
          </span>{' '}
          <span className="text-fg-muted">refeições</span>
        </p>
        <table className="mt-4 w-full text-left">
          <caption className="sr-only">Refeições por turma</caption>
          <thead>
            <tr className="eyebrow border-b border-fg/60 text-fg-muted">
              <th scope="col" className="py-2 font-medium">
                Turma
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Refeições
              </th>
              <th scope="col" className="py-2 pl-4 font-medium">
                Base
              </th>
            </tr>
          </thead>
          <tbody>
            {byClass.map((c) => (
              <tr key={c.turma} className="border-b border-border">
                <th scope="row" className="py-2 font-semibold">
                  {c.turma}
                </th>
                <td className="py-2 text-right font-mono">{c.vaoComer}</td>
                <td className="py-2 pl-4 text-sm text-fg-muted">
                  {c.estimado ? 'estimativa, sem chamada' : 'chamada feita'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="amostra-coordenacao">
        <h3 id="amostra-coordenacao" className="font-display text-2xl leading-tight font-medium">
          Avisar a família do atraso
        </h3>
        <p className="mt-1 mb-4 text-fg-muted">
          A coordenação revisa e envia. A mensagem leva só nome, turma e horário.
        </p>
        {records.length === 0 ? (
          <div className="border-y border-border py-4">
            <p className="text-fg-muted">
              Nenhum atraso registrado ainda. Registre um na aba “QR da entrada” ou use o atalho:
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={onSampleLate}>
              Registrar um atraso pela portaria
            </Button>
          </div>
        ) : (
          <ul className="border-t border-border" aria-live="polite">
            {records.map((r) => (
              <li key={r.id} className="border-b border-border py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>
                    <span className="font-semibold">{r.aluno}</span>{' '}
                    <span className="text-sm text-fg-muted">
                      {r.turma} · chegou às {formatHora(new Date(r.at))}
                    </span>
                  </p>
                  {r.aviso === 'enviado' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Icon name="check" size={18} />
                      Aviso enviado
                    </span>
                  ) : (
                    <Button variant="whatsapp" size="sm" onClick={() => onNotify(r.id)}>
                      <WhatsAppIcon size={18} />
                      Avisar a família
                    </Button>
                  )}
                </div>
                {r.aviso === 'enviado' && (
                  <p className="mt-2 border-l-2 border-whatsapp bg-bg px-3 py-2 text-sm leading-relaxed">
                    {lateMessage(r)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-fg-muted">
          Envio simulado: nesta amostra nenhuma mensagem sai de verdade.
        </p>
      </section>
    </div>
  );
}
