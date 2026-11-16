import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { HorarioView } from '@/components/dia/HorarioView';

export const metadata: Metadata = {
  title: 'Horário do dia · Dia a dia | Escola+',
  description: 'Professor faltou? Adianta as aulas da turma e mostra quem está livre para cobrir.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <HorarioView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
