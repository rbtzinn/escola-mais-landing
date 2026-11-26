import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONFIG } from '@/config';
import { Icon } from '@/components/icons';
import {
  api,
  clearSession,
  loadSession,
  replyMessage,
  saveSession,
  type ApiReply,
  type Session,
} from '@/lib/adminApi';
import { stats, toRecords, type Rec } from '@/lib/adminData';
import { downloadDiploma, fillFromSaved } from '@/lib/diploma';
import { withDefaults } from '@/lib/diplomaConfig';
import { buildSteps } from '@/lib/schema';
import { warmUp } from '@/lib/submit';
import { Approved } from './Approved';
import { DiplomaSettings } from './DiplomaSettings';
import { Exceptions } from './Exceptions';
import { Login } from './Login';
import { Overview } from './Overview';
import { NextSteps } from './NextSteps';
import { Period } from './Period';
import { StudentSheet } from './StudentSheet';
import { Students } from './Students';
import type { PanelData } from './types';
import { BottomNav, MoreSheet, Sidebar, TopBar, type NavTab } from './Shell';
import { Notice, ThemeToggle } from './ui';
import { Users } from './Users';

const STEPS = buildSteps(CONFIG);

type Tab = 'geral' | 'alunos' | 'periodo' | 'excecoes' | 'aprovados' | 'diploma' | 'usuarios';
const TABS: (NavTab<Tab> & { direcao?: boolean })[] = [
  { id: 'geral', label: 'Visão geral', icon: 'chart', bar: true },
  { id: 'alunos', label: 'Matrículas', icon: 'users', bar: true },
  {
    id: 'periodo',
    label: 'Período',
    icon: 'calendar',
    direcao: true,
    hint: 'Quando o formulário fica aberto',
  },
  {
    id: 'excecoes',
    label: 'Exceções',
    icon: 'shield',
    direcao: true,
    hint: 'Liberar um aluno fora do período',
  },
  {
    id: 'aprovados',
    label: 'Aprovados',
    icon: 'file',
    direcao: true,
    hint: 'Lista para conferir na matrícula',
  },
  { id: 'diploma', label: 'Diploma', icon: 'school', direcao: true, bar: true },
  { id: 'usuarios', label: 'Usuários', icon: 'user', direcao: true, hint: 'Quem entra no painel' },
];

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [data, setData] = useState<PanelData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !!loadSession());
  const [tab, setTab] = useState<Tab>('geral');
  const [open, setOpen] = useState<string | null>(null);
  const [more, setMore] = useState(false);

  const logout = useCallback((message = '') => {
    clearSession();
    setMore(false);
    setSession(null);
    setData(null);
    setError(message);
  }, []);

  /** Aplica a resposta do pedido "painel". */
  const applyPanel = useCallback(
    (r: ApiReply) => {
      setLoading(false);
      if (r.status === 'ok') {
        setData(r as unknown as PanelData);
        setError('');
      } else if (r.status === 'sessao_expirada') logout(replyMessage(r));
      else setError(replyMessage(r));
    },
    [logout],
  );

  const load = useCallback(
    async (s: Session) => {
      setLoading(true);
      applyPanel(await api('painel', {}, s.sessao));
    },
    [applyPanel],
  );

  // Sem sessão guardada, o login vem primeiro: acorda o script enquanto a pessoa digita a senha.
  useEffect(() => {
    if (!loadSession()) warmUp(CONFIG.appsScriptUrl);
  }, []);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    void api('painel', {}, session.sessao).then((r) => {
      if (alive) applyPanel(r);
    });
    return () => {
      alive = false;
    };
  }, [session, applyPanel]);

  const run = useCallback(
    async (action: string, body: object): Promise<ApiReply> => {
      if (!session) return { status: 'sessao_expirada' };
      const r = await api(action, body, session.sessao);
      if (r.status === 'sessao_expirada') logout(replyMessage(r));
      else if (r.status === 'ok') {
        // O script devolve o painel já atualizado na própria resposta (uma viagem só). Se vier
        // sem ele (script antigo), pede de novo como antes.
        if (r.painel && typeof r.painel === 'object') applyPanel(r.painel as ApiReply);
        else await load(session);
      }
      return r;
    },
    [session, load, logout, applyPanel],
  );

  const recs = useMemo(() => (data ? toRecords(data.cabecalho, data.linhas) : []), [data]);
  const st = useMemo(() => stats(recs), [recs]);
  const diploma = useMemo(() => withDefaults(data?.diploma, CONFIG.cursos), [data]);
  const registros = useMemo(() => {
    const i = data?.cabecalho.indexOf('Registro escolar') ?? -1;
    return i >= 0 ? recs.map((r) => String(r.row[i] ?? '')) : [];
  }, [data, recs]);
  const direcao = session?.papel === 'direcao';
  const tabs = TABS.filter((t) => !t.direcao || direcao);
  const current = tabs.some((t) => t.id === tab) ? tab : 'geral';
  const openRec: Rec | undefined = recs.find((r) => r.protocolo === open);
  const select = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className={clsx('min-h-dvh', session && 'lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]')}>
      {session && (
        <Sidebar
          tabs={tabs}
          current={current}
          onSelect={select}
          session={session}
          onLogout={() => logout()}
        />
      )}
      <div className="min-w-0">
        <TopBar>{!session && <ThemeToggle />}</TopBar>
        {!session && (
          <header className="paper-blue hidden text-cream lg:block">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-8 py-4">
              <p className="text-xl font-bold tracking-tight">
                Escola<span aria-hidden="true">+</span>
                <span className="sr-only">mais</span>{' '}
                <span className="font-pixel text-2xl uppercase">Painel</span>
              </p>
              <ThemeToggle />
            </div>
          </header>
        )}
        <main
          className={clsx(
            'mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-8 sm:py-8',
            session && 'pb-[calc(var(--nav-space)+1.5rem)] lg:pb-10',
          )}
        >
          {!session ? (
            <>
              <Notice tone="error">{error}</Notice>
              <Login
                onLogin={(s) => {
                  saveSession(s);
                  setError('');
                  setLoading(true);
                  setSession(s);
                }}
              />
            </>
          ) : !data ? (
            <div className="space-y-4">
              <Notice tone="error">{error}</Notice>
              <p className="flex items-center gap-2 text-fg-muted" role="status">
                {loading && <Icon name="refresh" size={18} className="motion-safe:animate-spin" />}
                {loading ? 'Carregando a planilha…' : ''}
              </p>
              {!loading && error && (
                <button
                  type="button"
                  onClick={() => void load(session)}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-4xl font-extrabold">
                  {tabs.find((t) => t.id === current)?.label}
                </h1>
                <button
                  type="button"
                  onClick={() => void load(session)}
                  disabled={loading}
                  aria-label={loading ? 'Atualizando' : 'Atualizar'}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-primary hover:bg-muted disabled:opacity-60"
                >
                  <Icon
                    name="refresh"
                    size={18}
                    className={clsx(loading && 'motion-safe:animate-spin')}
                  />
                  <span className="max-sm:sr-only" aria-hidden="true">
                    {loading ? 'Atualizando…' : 'Atualizar'}
                  </span>
                </button>
              </div>
              <Notice tone="error">{error}</Notice>
              {current === 'geral' && (
                <Overview stats={st} recs={recs} onOpen={(r) => setOpen(r.protocolo)} />
              )}
              {current === 'alunos' && (
                <Students
                  recs={recs}
                  header={data.cabecalho}
                  onOpen={(r) => setOpen(r.protocolo)}
                  onDiploma={async (r) => {
                    const fill = fillFromSaved(STEPS, data.cabecalho, r.row, r.cpf, diploma);
                    // Falta algo (ex.: SISTEC)? A ficha abre mostrando o quê.
                    if (fill.missing.length) return setOpen(r.protocolo);
                    try {
                      await downloadDiploma(fill, fill.values.nome || r.nome);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : 'Não foi possível gerar o diploma.',
                      );
                    }
                  }}
                />
              )}
              {current === 'periodo' && (
                <div className="space-y-6">
                  <Period
                    key={`${data.periodo.inicio}|${data.periodo.fim}`}
                    periodo={data.periodo}
                    hoje={data.hoje}
                    run={run}
                  />
                  <NextSteps key={data.proximos ?? ''} texto={data.proximos ?? ''} run={run} />
                </div>
              )}
              {current === 'excecoes' && (
                <Exceptions list={data.excecoes ?? []} hoje={data.hoje} run={run} />
              )}
              {current === 'aprovados' && <Approved list={data.aprovados ?? []} run={run} />}
              {current === 'diploma' && (
                <DiplomaSettings
                  key={JSON.stringify(data.diploma ?? null)}
                  cfg={diploma}
                  run={run}
                />
              )}
              {current === 'usuarios' && <Users list={data.usuarios ?? []} run={run} />}
            </>
          )}
        </main>
      </div>

      {session && (
        <BottomNav
          tabs={tabs}
          current={current}
          onSelect={select}
          onMore={() => setMore(true)}
          moreOpen={more}
        />
      )}
      {session && more && (
        <MoreSheet
          tabs={tabs}
          current={current}
          onSelect={select}
          onClose={() => setMore(false)}
          session={session}
          onLogout={() => logout()}
        />
      )}

      {openRec && data && (
        <StudentSheet
          key={openRec.protocolo}
          rec={openRec}
          header={data.cabecalho}
          steps={STEPS}
          run={run}
          onClose={() => setOpen(null)}
          diploma={diploma}
          registrosUsados={registros}
          proximos={data.proximos ?? ''}
        />
      )}
    </div>
  );
}
