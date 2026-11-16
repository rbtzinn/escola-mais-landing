import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AlunoPage } from '@/components/dia/AlunoPage';

export const metadata: Metadata = {
  title: 'Aluno · Escola+',
  description:
    'Registre a chegada atrasada e responda a merenda de hoje com a turma e a matrícula.',
};

/** Tela do celular do aluno: sem o menu do site, só o registro. */
export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1}>
      {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
      <Suspense>
        <AlunoPage />
      </Suspense>
    </main>
  );
}
