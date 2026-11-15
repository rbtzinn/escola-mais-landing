import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { RegistroApp } from '@/components/registro/RegistroApp';

export const metadata: Metadata = {
  title: 'Registro de atrasos | Escola+',
  description:
    'Simule o registro de atrasos na entrada: totem com QR, portaria, professor e coordenação no mesmo lugar, com avisos às famílias pelo WhatsApp.',
};

export default function RegistroPage() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Suspense>
          <RegistroApp />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
