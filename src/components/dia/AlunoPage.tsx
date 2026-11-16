'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/layout/Logo';
import { AlunoCheckin } from './AlunoCheckin';
import { browserMemory } from '@/lib/attendance/remember';
import { useRegistro } from './useRegistro';

/** O que abre no celular do aluno ao ler o QR da entrada: só o registro, sem o menu do site. */
export function AlunoPage() {
  const { school, roster, turmas, now } = useRegistro();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col gap-6 px-4 py-6">
      <Logo />
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-card">
        {school ? (
          <AlunoCheckin roster={roster} turmas={turmas} now={now} memory={browserMemory} />
        ) : (
          <p className="text-fg-muted">Carregando…</p>
        )}
      </div>
      <p className="text-center text-xs text-fg-muted">
        Demonstração: o registro fica só neste aparelho. Na escola, ele chega na hora à portaria e à
        coordenação.
      </p>
    </div>
  );
}
