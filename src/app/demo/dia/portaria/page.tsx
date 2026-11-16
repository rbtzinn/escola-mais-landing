import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PortariaView } from '@/components/dia/PortariaView';

export const metadata: Metadata = {
  title: 'Portaria · Registro de atrasos | Escola+',
  description:
    'Tela da portaria: registra pelo nome a chegada do aluno que não conseguiu ler o QR.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <PortariaView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
