import Image from 'next/image';
import Link from 'next/link';
import { PhoneScreen } from './PhoneScreen';

/**
 * Topo da landing, construído a partir da imagem aprovada (.impeccable/mocks/comp-2-celular.jpg):
 * metade rosa com o título pixel, metade azul com a promessa e a ação, e a coordenadora no meio
 * mostrando o painel no celular. No celular, as metades empilham.
 */
export function Hero() {
  return (
    <section
      id="topo"
      aria-labelledby="hero-titulo"
      className="relative isolate overflow-hidden lg:grid lg:min-h-[max(40rem,47.3vw)] lg:grid-cols-2"
    >
      {/* Metade rosa: título, prédio desenhado ao fundo e adesivos. */}
      <div className="paper-pink relative min-h-[34rem] pt-20 sm:min-h-[40rem] lg:min-h-0 lg:pt-0">
        <Image
          src="/plates/predio.png"
          alt=""
          width={1341}
          height={569}
          className="pointer-events-none absolute bottom-0 left-0 w-[58%] max-w-none opacity-80 lg:w-[58%]"
        />
        <h1
          id="hero-titulo"
          className="hero-title relative px-5 font-pixel text-[24vw] leading-[0.73] text-cream uppercase sm:px-8 sm:text-[17vw] lg:absolute lg:top-[29%] lg:left-[6.6%] lg:px-0 lg:text-[10.8vw]"
        >
          <span className="block">Hoje</span>
          <span className="block">na</span>
          <span className="block">escola</span>
        </h1>
        <Image
          src="/plates/adesivos.png"
          alt=""
          width={2912}
          height={1440}
          className="pointer-events-none absolute bottom-6 left-5 w-[34%] max-w-[14rem] sm:left-8 lg:top-[80.5%] lg:bottom-auto lg:left-[6.6%] lg:w-[32%] lg:max-w-none"
        />
      </div>

      {/* Metade azul: a promessa, a linha de confiança e a ação principal. */}
      <div className="paper-blue relative flex flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 lg:block lg:p-0">
        <div className="lg:absolute lg:top-[30.5%] lg:left-[28.7%] lg:w-[68%]">
          <p className="font-display text-[13vw] leading-[0.92] font-extrabold text-balance text-cream sm:text-[9vw] lg:text-[5.25vw]">
            A escola inteira no seu celular.
          </p>
          <p className="mt-6 max-w-[32ch] font-mono text-[0.95rem] leading-relaxed text-cream sm:text-lg lg:mt-[2.2vw] lg:max-w-none lg:text-[1.43vw]">
            Funciona com a planilha que você já usa. Nada é enviado.
          </p>
          <Link
            href="/demo"
            className="mt-8 flex min-h-16 items-center justify-center rounded-2xl bg-cream px-6 text-center font-display text-[1.6rem] leading-none font-extrabold text-blue transition-transform hover:-translate-y-0.5 hover:-rotate-1 focus-visible:outline-cream sm:text-3xl lg:mt-[2.4vw] lg:min-h-[5.6vw] lg:text-[2.6vw]"
          >
            Testar com a minha planilha
          </Link>
        </div>
      </div>

      {/* A coordenadora atravessa as duas metades e mostra o painel. Foto gerada por IA. */}
      <figure className="hero-person pointer-events-none absolute right-0 bottom-[calc(100%-34rem)] w-[62vw] max-w-[24rem] sm:bottom-[calc(100%-40rem)] sm:w-[44vw] sm:max-w-[26rem] lg:top-[11%] lg:right-auto lg:bottom-0 lg:left-[28.6%] lg:w-auto lg:max-w-none">
        <div className="relative aspect-[1856/2304] w-full lg:h-full lg:w-auto">
          <Image
            src="/plates/coordenadora.png"
            alt="Coordenadora escolar sorrindo e mostrando no celular o painel do Escola+ (imagem gerada por IA)"
            fill
            priority
            sizes="(min-width: 1024px) 38vw, (min-width: 640px) 44vw, 62vw"
            className="object-contain object-bottom"
          />
          <PhoneScreen />
        </div>
        <figcaption className="sr-only">
          Exemplo do painel: 3 turmas precisam de atenção hoje; 142 de 144 alunos presentes, 5
          atrasos e 133 refeições.
        </figcaption>
      </figure>
    </section>
  );
}
