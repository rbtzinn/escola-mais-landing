import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChamadaView } from '@/components/dia/ChamadaView';

export const metadata: Metadata = {
  title: 'Chamada · Dia a dia | Escola+',
  description:
    'Chamada no celular do professor: P, F ou A para cada aluno, como no diário de papel, e um toque para salvar.',
};

/** Tela de app no celular do professor: sem o menu do site. */
export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1}>
      <Suspense>
        <ChamadaView />
      </Suspense>
    </main>
  );
}
