import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CoordenacaoView } from '@/components/dia/CoordenacaoView';

export const metadata: Metadata = {
  title: 'Coordenação · Registro de atrasos | Escola+',
  description:
    'Tela da coordenação: corrige os registros, avisa as famílias e acompanha os reincidentes.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <CoordenacaoView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
