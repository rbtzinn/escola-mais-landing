import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ChamadaView } from '@/components/dia/ChamadaView';

export const metadata: Metadata = {
  title: 'Professor(a) · Registro de atrasos | Escola+',
  description:
    'Tela do professor: marca quem entrou atrasado na chamada e pode desfazer por 5 minutos.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <ChamadaView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
