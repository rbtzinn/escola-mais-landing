import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Newsreader, Source_Sans_3 } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

// Texto: Source Sans 3 (humanista, boa em tela pequena). Títulos: Newsreader (serifa de jornal).
// Rótulos e números de seção: IBM Plex Mono.
const body = Source_Sans_3({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});
const serif = Newsreader({
  variable: '--font-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
});
const code = IBM_Plex_Mono({
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
    { media: '(prefers-color-scheme: light)', color: '#f5f3ea' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1a16' },
  ],
};

// Roda antes da primeira pintura: aplica o tema salvo (ou o do sistema) e marca que há JS.
const themeScript = `(function(){try{var d=document.documentElement;d.setAttribute('data-js','');var t=null;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${body.variable} ${serif.variable} ${code.variable}`}
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
