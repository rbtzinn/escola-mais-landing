import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { MerendaView } from '@/components/dia/MerendaView';

export const metadata: Metadata = {
  title: 'Merenda · Dia a dia | Escola+',
  description:
    'Tela da cozinha: quantas refeições preparar hoje, por turma, com as respostas dos alunos.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <MerendaView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
