import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from '@/config';
import { FieldView } from '@/components/FieldView';
import { Icon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';
import { hideCpf } from '@/lib/cpf';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draft';
import { toRow } from '@/lib/row';
import { OUTRO, buildSteps, isVisible, type Field, type Values } from '@/lib/schema';
import { submitMatricula, type SubmitResult } from '@/lib/submit';
import { firstInvalidStep, validateStep } from '@/lib/validate';

type Phase = 'form' | 'review' | 'done';
type Sending = 'idle' | 'sending' | Exclude<SubmitResult, { status: 'ok' }>;

const STEPS = buildSteps(CONFIG);

/** Valor legível de um campo, para a revisão. */
function display(f: Field, v: Values): string {
  const t = (id: string) => (typeof v[id] === 'string' ? (v[id] as string).trim() : '');
  if (f.kind === 'consent') return t(f.id) === 'sim' ? 'Concordo' : '';
  if (f.kind === 'grid') return (f.rows ?? []).map((r) => `${r}: ${t(`${f.id}:${r}`) || '—'}`).join(' · ');
  if (f.kind === 'multi') {
    const sel = Array.isArray(v[f.id]) ? (v[f.id] as string[]) : [];
    return sel.map((s) => (s === OUTRO ? `Outro: ${t(`${f.id}_outro`)}` : s)).join(', ');
  }
  const val = t(f.id);
  return f.other && val === OUTRO ? `Outro: ${t(`${f.id}_outro`)}` : val;
}

/** Baixa as respostas em CSV (quando a planilha ainda não foi ligada). */
function downloadCsv(values: Values) {
  const { columns, row } = toRow(STEPS, values);
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = `\uFEFF${columns.map(esc).join(';')}\n${row.map(esc).join(';')}\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'matricula.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label="Modo escuro"
      className="flex size-11 items-center justify-center rounded-full text-cream hover:bg-cream/15"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export default function App() {
  const draft = useMemo(() => loadDraft(), []);
  const [values, setValues] = useState<Values>(draft?.values ?? {});
  const [step, setStep] = useState(Math.min(draft?.step ?? 0, STEPS.length - 1));
  const [phase, setPhase] = useState<Phase>('form');
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [sending, setSending] = useState<Sending>('idle');
  const [protocolo, setProtocolo] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const current = STEPS[step];
  const errors = useMemo(() => validateStep(current, values), [current, values]);
  const shown = Object.fromEntries(
    Object.entries(errors).filter(([id]) => showAll || touched.has(id)),
  );

  useEffect(() => {
    if (phase !== 'done') saveDraft({ values, step });
  }, [values, step, phase]);

  // A cada troca de etapa: volta ao topo e leva o foco ao título (leitor de tela anuncia a etapa).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step, phase]);

  const onChange = (id: string, value: string | string[]) => setValues((v) => ({ ...v, [id]: value }));
  const onPatch = (patch: Values) => setValues((v) => ({ ...v, ...patch }));
  const onBlur = (id: string) => setTouched((t) => (t.has(id) ? t : new Set(t).add(id)));

  const goTo = (i: number) => {
    setStep(i);
    setShowAll(false);
    setTouched(new Set());
    setPhase('form');
  };

  const next = () => {
    const ids = Object.keys(errors);
    if (ids.length) {
      setShowAll(true);
      document.getElementById(ids[0])?.focus();
      return;
    }
    if (returnToReview) {
      setReturnToReview(false);
      setPhase('review');
      return;
    }
    if (step === STEPS.length - 1) setPhase('review');
    else goTo(step + 1);
  };

  const submit = async () => {
    const bad = firstInvalidStep(STEPS, values);
    if (bad >= 0) {
      goTo(bad);
      setShowAll(true);
      return;
    }
    setSending('sending');
    const { columns, row } = toRow(STEPS, values);
    const r = await submitMatricula(CONFIG.appsScriptUrl, {
      token: CONFIG.token,
      cpf: String(values.aluno_cpf ?? ''),
      columns,
      row,
    });
    if (r.status === 'ok') {
      setProtocolo(r.protocolo);
      clearDraft();
      setPhase('done');
      setSending('idle');
    } else setSending(r);
  };

  const reset = () => {
    clearDraft();
    setValues({});
    setConfirmReset(false);
    setSending('idle');
    goTo(0);
  };

  const progress = phase === 'form' ? step / STEPS.length : 1;

  return (
    <div className="min-h-screen">
      <header className="paper-blue text-cream">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p className="text-xl font-bold tracking-tight">
            Escola<span aria-hidden="true">+</span>
            <span className="sr-only">mais</span>
          </p>
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-5xl px-5 pt-2 pb-6 sm:px-8 sm:pb-8">
          <p className="font-display text-xl font-bold text-cream/85">{CONFIG.escola}</p>
          <h1 className="font-pixel text-6xl leading-[0.85] uppercase sm:text-7xl">Matrícula {CONFIG.ano}</h1>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso da matrícula"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-2 bg-cream/20"
        >
          <div className="h-full bg-pink transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-12">
        <nav aria-label="Etapas" className="hidden lg:block">
          <ol className="sticky top-6 space-y-1">
            {STEPS.map((s, i) => {
              const done = phase !== 'form' || i < step;
              const here = phase === 'form' && i === step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!done && !here}
                    onClick={() => goTo(i)}
                    aria-current={here ? 'step' : undefined}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors',
                      here ? 'bg-primary font-semibold text-on-primary' : done ? 'hover:bg-muted' : 'text-fg-muted',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold',
                        here ? 'bg-on-primary text-primary' : done ? 'bg-ok text-cream' : 'border border-fg/30',
                      )}
                    >
                      {done && !here ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    {s.short}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="min-w-0">
          {phase === 'form' && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm font-semibold text-fg-muted">
                  Etapa {step + 1} de {STEPS.length}
                </p>
                <h2 ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight font-extrabold outline-none">
                  {current.title}
                </h2>
                {current.description && <p className="mt-2 max-w-prose leading-relaxed text-fg-muted">{current.description}</p>}
              </div>

              <div className="space-y-5">
                {current.fields
                  .filter((f) => isVisible(f, values))
                  .map((f) => (
                    <FieldView
                      key={f.id}
                      field={f}
                      values={values}
                      error={shown[f.id]}
                      onChange={onChange}
                      onPatch={onPatch}
                      onBlur={onBlur}
                    />
                  ))}
              </div>

              {showAll && Object.keys(errors).length > 0 && (
                <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 font-semibold text-danger">
                  <Icon name="alert" size={20} />
                  Falta corrigir {Object.keys(errors).length === 1 ? '1 campo' : `${Object.keys(errors).length} campos`} nesta etapa.
                </p>
              )}

              <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-fg/10 bg-bg/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-fg/25 px-5 font-semibold hover:border-fg"
                  >
                    <Icon name="back" size={20} />
                    Voltar
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-110 sm:flex-none"
                >
                  {returnToReview ? 'Voltar para a revisão' : step === STEPS.length - 1 ? 'Revisar' : 'Continuar'}
                  <Icon name="arrow" size={20} />
                </button>
              </div>
            </form>
          )}

          {phase === 'review' && (
            <section aria-labelledby="revisao" className="space-y-6">
              <div>
                <h2 id="revisao" ref={headingRef} tabIndex={-1} className="font-display text-4xl font-extrabold outline-none">
                  Confira antes de enviar
                </h2>
                <p className="mt-2 text-fg-muted">Depois de enviar, só a secretaria consegue mudar os dados.</p>
              </div>
              {STEPS.slice(1).map((s) => {
                const i = STEPS.indexOf(s);
                const items = s.fields.filter((f) => isVisible(f, values)).map((f) => [f, display(f, values)] as const);
                return (
                  <section key={s.id} className="rounded-2xl border-2 border-fg/15 bg-surface p-4 sm:p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-display text-2xl font-extrabold">{s.title}</h3>
                      <button
                        type="button"
                        aria-label={`Editar ${s.title}`}
                        onClick={() => {
                          goTo(i);
                          setReturnToReview(true);
                        }}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-muted"
                      >
                        <Icon name="edit" size={16} />
                        Editar
                      </button>
                    </div>
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {items.map(([f, val]) => (
                        <div key={f.id} className={clsx('min-w-0', f.kind === 'grid' && 'sm:col-span-2')}>
                          <dt className="text-xs text-fg-muted">{f.label}</dt>
                          <dd className="break-words font-medium">{val || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              })}

              <div role="status" aria-live="polite">
                {sending !== 'idle' && sending !== 'sending' && (
                  <div className="rounded-2xl border-2 border-danger/50 bg-danger/10 p-4">
                    {sending.status === 'cpf_duplicado' && (
                      <p className="font-semibold">
                        Esse CPF já foi matriculado. Procure a secretaria da escola. Suas respostas continuam salvas neste aparelho.
                      </p>
                    )}
                    {sending.status === 'erro' && (
                      <p className="font-semibold">
                        Não foi possível enviar agora ({sending.message}). Suas respostas estão salvas: tente de novo em instantes.
                      </p>
                    )}
                    {sending.status === 'sem_configuracao' && (
                      <>
                        <p className="font-semibold">
                          Demonstração: a planilha da escola ainda não foi ligada a este formulário.
                        </p>
                        <button
                          type="button"
                          onClick={() => downloadCsv(values)}
                          className="mt-2 font-semibold text-primary underline underline-offset-4"
                        >
                          Baixar as respostas (CSV)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => goTo(STEPS.length - 1)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-fg/25 px-5 font-semibold hover:border-fg"
                >
                  <Icon name="back" size={20} />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={sending === 'sending'}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-pink px-6 font-display text-xl font-extrabold text-cream disabled:opacity-60 sm:flex-none"
                >
                  <Icon name={sending === 'sending' ? 'refresh' : 'send'} size={20} />
                  {sending === 'sending' ? 'Enviando…' : sending !== 'idle' && sending.status === 'erro' ? 'Tentar de novo' : 'Enviar matrícula'}
                </button>
              </div>
            </section>
          )}

          {phase === 'done' && (
            <section aria-labelledby="enviada" className="space-y-5 text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok text-cream">
                <Icon name="check" size={36} strokeWidth={2.5} />
              </span>
              <h2 id="enviada" ref={headingRef} tabIndex={-1} className="font-display text-4xl font-extrabold outline-none">
                Matrícula enviada!
              </h2>
              <p className="text-lg">
                Protocolo <strong className="font-mono">{protocolo}</strong>
              </p>
              <p className="text-fg-muted">
                CPF {hideCpf(String(values.aluno_cpf ?? ''))}. Tire um print desta tela. Se precisar corrigir algo, procure a secretaria.
              </p>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-fg/25 px-5 font-semibold hover:border-fg"
              >
                Fazer outra matrícula neste aparelho
              </button>
            </section>
          )}

          {phase !== 'done' && (
            <div className="mt-10 border-t border-fg/10 pt-4 text-sm text-fg-muted">
              {confirmReset ? (
                <p className="flex flex-wrap items-center gap-3">
                  Apagar tudo o que foi preenchido neste aparelho?
                  <button type="button" onClick={reset} className="font-semibold text-danger underline underline-offset-4">
                    Sim, apagar
                  </button>
                  <button type="button" onClick={() => setConfirmReset(false)} className="font-semibold underline underline-offset-4">
                    Não
                  </button>
                </p>
              ) : (
                <p>
                  Suas respostas ficam salvas neste aparelho até enviar.{' '}
                  <button type="button" onClick={() => setConfirmReset(true)} className="font-semibold underline underline-offset-4">
                    Começar de novo
                  </button>
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
