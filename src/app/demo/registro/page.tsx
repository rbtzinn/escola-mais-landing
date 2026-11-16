import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { EntradaHub } from '@/components/registro/EntradaHub';

export const metadata: Metadata = {
  title: 'Registro de atrasos | Escola+',
  description:
    'Simule o registro de atrasos: um QR na entrada para o aluno e telas para portaria, professor e coordenação, com avisos às famílias pelo WhatsApp.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        {/* A hora da demo é lida no navegador: o conteúdo vem depois da pré-renderização. */}
        <Suspense>
          <EntradaHub />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
