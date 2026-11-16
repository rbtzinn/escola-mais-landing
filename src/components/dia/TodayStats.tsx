'use client';

import { formatHHMM } from '@/lib/attendance/clock';
import clsx from 'clsx';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icons';
import { useRegistro } from './useRegistro';

/** Os números do dia, cada um levando à tela que cuida dele. */
export function TodayStats({ compact = false }: { compact?: boolean }) {
  const {
    presenceTotal: p,
    records,
    pendentes,
    refeicoes,
    merendaAberta,
    mealDeadline,
    faltando,
  } = useRegistro();

  const items: {
    href: string;
    icon: IconName;
    label: string;
    value: string;
    detail: string;
    alert?: boolean;
  }[] = [
    {
      href: '/demo/dia/chamada',
      icon: 'users',
      label: 'Presentes hoje',
      value: p.turmasComChamada ? `${p.presentes}/${p.alunosComChamada}` : '—',
      detail: `Chamada em ${p.turmasComChamada} de ${p.turmas} turmas`,
      alert: p.turmasComChamada < p.turmas,
    },
    {
      href: '/demo/dia/coordenacao',
      icon: 'clock',
      label: 'Atrasos',
      value: String(records.length),
      detail: `${pendentes} ${pendentes === 1 ? 'aviso pendente' : 'avisos pendentes'}`,
      alert: pendentes > 0,
    },
    {
      href: '/demo/dia/merenda',
      icon: 'utensils',
      label: 'Merenda',
      value: String(refeicoes),
      detail: merendaAberta
        ? `refeições · respostas até ${formatHHMM(mealDeadline)}`
        : 'refeições · conta fechada',
    },
    {
      href: '/demo/dia/horario',
      icon: 'calendar',
      label: 'Professores faltando',
      value: String(faltando),
      detail: faltando ? 'veja o horário remanejado' : 'horário normal',
      alert: faltando > 0,
    },
  ];

  return (
    <ul className={clsx('grid grid-cols-2 gap-2 sm:gap-3', !compact && 'lg:grid-cols-4')}>
      {items.map((it) => (
        <li key={it.href}>
          <Link
            href={it.href}
            className="flex h-full flex-col rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-primary hover:bg-muted sm:p-4"
          >
            <span className="flex items-center justify-between gap-2 text-sm font-semibold text-fg-muted">
              {it.label}
              <Icon name={it.icon} size={18} className="text-primary" />
            </span>
            <span className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
              {it.value}
            </span>
            <span
              className={clsx('text-xs sm:text-sm', it.alert ? 'text-danger' : 'text-fg-muted')}
            >
              {it.detail}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
