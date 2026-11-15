import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DemoApp } from '@/components/demo/DemoApp';

export const metadata: Metadata = {
  title: 'Testar com sua planilha | Escola+',
  description:
    'Envie uma planilha da escola (CSV ou Excel) e veja frequência, notas, alunos em risco e atrasos em um painel, direto no navegador.',
};

export default function DemoPage() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <DemoApp />
      </main>
      <Footer />
    </>
  );
}
