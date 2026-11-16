import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ChamadaView } from '@/components/dia/ChamadaView';

export const metadata: Metadata = {
  title: 'Chamada · Dia a dia | Escola+',
  description:
    'Chamada do 1º horário: o professor marca só quem faltou e quem entrou atrasado, com desfazer de 5 minutos.',
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
