import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed, Jersey_15, Martian_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

// Texto: Barlow (clara em tela pequena). Títulos: Barlow Condensed pesada.
// Título pixel da landing: Jersey 15. Linhas de dado e de máquina: Martian Mono.
const body = Barlow({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
const condensed = Barlow_Condensed({
  variable: '--font-condensed',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});
const bitmap = Jersey_15({
  variable: '--font-bitmap',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});
const code = Martian_Mono({
  variable: '--font-code',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Escola+ | Sua escola organizada, sem passar o dia em planilhas',
  description:
    'Plataforma para direção e coordenação escolar: planilhas viram painéis, mensagens automáticas aos pais, busca ativa de alunos em risco, merenda e relatórios prontos.',
  openGraph: {
    title: 'Escola+ | Sua escola organizada, sem passar o dia em planilhas',
    description:
      'Planilhas viram painéis, os pais são avisados automaticamente e alunos em risco aparecem cedo, para direção e coordenação escolar.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fef1cf' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1236' },
  ],
};

// Roda antes da primeira pintura: aplica o tema salvo (ou o do sistema) e marca que há JS.
const themeScript = `(function(){try{var d=document.documentElement;d.setAttribute('data-js','');var t=null;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${body.variable} ${condensed.variable} ${bitmap.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#conteudo"
          className="sr-only z-[100] rounded-md bg-primary px-4 py-2 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
