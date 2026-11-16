import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DiaHub } from '@/components/dia/DiaHub';

export const metadata: Metadata = {
  title: 'Hoje na escola · Dia a dia | Escola+',
  description:
    'O dia a dia da escola numa tela: presença pela chamada, atrasos pelo QR da entrada, merenda respondida pelo aluno e horário remanejado quando um professor falta.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <DiaHub />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
