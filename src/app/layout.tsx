import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Escola+ | Gestão escolar pública mais simples e transparente',
  description:
    'Plataforma de gestão para redes municipais e estaduais de ensino: frequência digital, indicadores, merenda, manutenção e prestação de contas em um só lugar.',
  openGraph: {
    title: 'Escola+ | Gestão escolar pública mais simples e transparente',
    description:
      'Frequência digital, indicadores, merenda e transparência (LAI) para secretarias de educação e escolas públicas.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#12100e' },
  ],
};

// Roda antes da primeira pintura: aplica o tema salvo (ou o do sistema) e marca que há JS.
const themeScript = `(function(){try{var d=document.documentElement;d.setAttribute('data-js','');var t=null;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
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
