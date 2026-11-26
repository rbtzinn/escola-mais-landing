import clsx from 'clsx';
import { useRef, type ReactNode } from 'react';
import { CONFIG } from '@/config';
import { Icon, type IconName } from '@/components/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useTheme } from '@/hooks/useTheme';
import type { Session } from '@/lib/adminApi';

export interface NavTab<T extends string> {
  id: T;
  label: string;
  icon: IconName;
  /** Linha de apoio no menu "Mais" do celular. */
  hint?: string;
  /** Fica na barra de baixo do celular (as outras vão para "Mais"). */
  bar?: boolean;
}

const PAPEL = { direcao: 'Direção', coordenacao: 'Coordenação' } as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={clsx('font-bold tracking-tight', compact ? 'text-lg' : 'text-xl')}>
        Escola<span aria-hidden="true">+</span>
        <span className="sr-only">mais</span>{' '}
        <span className={clsx('font-pixel uppercase', compact ? 'text-xl' : 'text-2xl')}>
          Painel
        </span>
      </p>
      <p className={clsx('text-sm text-cream/80', compact && 'truncate')}>
        {CONFIG.escola} · Matrícula {CONFIG.ano}
      </p>
    </div>
  );
}

/** Menu lateral do computador (a partir de 1024 px). */
export function Sidebar<T extends string>({
  tabs,
  current,
  onSelect,
  session,
  onLogout,
}: {
  tabs: NavTab<T>[];
  current: T;
  onSelect: (t: T) => void;
  session: Session;
  onLogout: () => void;
}) {
  const { theme, toggle } = useTheme();
  return (
    <aside className="paper-blue sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto px-4 py-5 text-cream lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav aria-label="Seções do painel" className="flex-1">
        <ul className="space-y-1">
          {tabs.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                aria-current={current === t.id ? 'page' : undefined}
                onClick={() => onSelect(t.id)}
                className={clsx(
                  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-semibold transition-colors',
                  current === t.id
                    ? 'bg-cream text-ink'
                    : 'text-cream/85 hover:bg-cream/15 hover:text-cream',
                )}
              >
                <Icon name={t.icon} size={20} />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-cream/20 pt-4">
        <p className="px-3 pb-2">
          <span className="block truncate font-semibold">{session.nome}</span>
          <span className="text-sm text-cream/75">{PAPEL[session.papel]}</span>
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={theme === 'dark'}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 font-semibold text-cream/85 hover:bg-cream/15 hover:text-cream"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          Modo escuro
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 font-semibold text-cream/85 hover:bg-cream/15 hover:text-cream"
        >
          <Icon name="logout" size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}

/** Barra de cima do celular e do tablet: só a marca (as seções ficam embaixo). */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="paper-blue sticky top-0 z-30 text-cream lg:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-8">
        <Brand compact />
        {children}
      </div>
    </header>
  );
}

/** Barra de baixo do celular, como num aplicativo: as seções principais e "Mais". */
export function BottomNav<T extends string>({
  tabs,
  current,
  onSelect,
  onMore,
  moreOpen,
}: {
  tabs: NavTab<T>[];
  current: T;
  onSelect: (t: T) => void;
  onMore: () => void;
  moreOpen: boolean;
}) {
  const bar = tabs.filter((t) => t.bar);
  const inMore = !bar.some((t) => t.id === current);
  const item = (active: boolean) =>
    clsx(
      'flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-semibold',
      active ? 'text-primary' : 'text-fg-muted hover:text-fg',
    );
  const pill = (active: boolean) =>
    clsx(
      'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
      active && 'bg-primary/15',
    );
  return (
    <nav
      aria-label="Atalhos do painel"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-fg/15 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {bar.map((t) => (
          <li key={t.id} className="flex-1">
            <button
              type="button"
              aria-current={current === t.id ? 'page' : undefined}
              onClick={() => onSelect(t.id)}
              className={item(current === t.id)}
            >
              <span className={pill(current === t.id)}>
                <Icon name={t.icon} size={22} />
              </span>
              {t.label}
            </button>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={onMore}
            className={item(inMore)}
          >
            <span className={pill(inMore)}>
              <Icon name="menu" size={22} />
            </span>
            Mais
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Folha que sobe com as outras seções e a conta (tema e sair). Sem <dialog> nativo. */
export function MoreSheet<T extends string>({
  tabs,
  current,
  onSelect,
  onClose,
  session,
  onLogout,
}: {
  tabs: NavTab<T>[];
  current: T;
  onSelect: (t: T) => void;
  onClose: () => void;
  session: Session;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  const { theme, toggle } = useTheme();
  const rest = tabs.filter((t) => !t.bar);
  const row =
    'flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left font-semibold hover:bg-muted';
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <div className="fade-in absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mais-titulo"
        className="sheet-enter relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-bg px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div aria-hidden="true" className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-fg/20" />
        <div className="flex items-center justify-between px-3 pb-2">
          <h2 id="mais-titulo" className="font-display text-2xl font-extrabold">
            Mais
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
          >
            <Icon name="close" />
          </button>
        </div>
        {rest.length > 0 && (
          <ul className="space-y-1">
            {rest.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-current={current === t.id ? 'page' : undefined}
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                  className={clsx(row, current === t.id && 'bg-muted')}
                >
                  <span
                    className={clsx(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      current === t.id ? 'bg-primary text-on-primary' : 'bg-surface text-primary',
                    )}
                  >
                    <Icon name={t.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{t.label}</span>
                    {t.hint && (
                      <span className="block text-sm font-normal text-fg-muted">{t.hint}</span>
                    )}
                  </span>
                  <Icon name="arrow" size={18} className="shrink-0 text-fg-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={clsx('space-y-1', rest.length > 0 && 'mt-3 border-t border-fg/10 pt-3')}>
          <p className="px-3 pb-1 text-sm text-fg-muted">
            Entrou como <span className="font-semibold text-fg">{session.nome}</span> ·{' '}
            {PAPEL[session.papel]}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggle}
            className={row}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            </span>
            <span className="flex-1">Modo escuro</span>
            <span
              aria-hidden="true"
              className={clsx(
                'flex h-7 w-12 items-center rounded-full p-1 transition-colors',
                theme === 'dark' ? 'bg-primary' : 'bg-fg/20',
              )}
            >
              <span
                className={clsx(
                  'size-5 rounded-full bg-surface shadow transition-transform',
                  theme === 'dark' && 'translate-x-5',
                )}
              />
            </span>
          </button>
          <button type="button" onClick={onLogout} className={clsx(row, 'text-danger')}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
              <Icon name="logout" size={20} />
            </span>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
