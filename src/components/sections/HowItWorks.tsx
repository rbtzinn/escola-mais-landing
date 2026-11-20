import Link from 'next/link';
import { QrCode } from '@/components/dia/QrCode';
import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { STEPS } from '@/data/content';

// O QR do cartaz abre a tela do aluno da demonstração publicada.
const ALUNO_URL = 'https://escola-mais-landing.vercel.app/demo/dia/aluno';

/** O cartaz da entrada, colado na parede rosa: QR ou plaquinha NFC para o aluno registrar. */
function EntrancePoster() {
  return (
    <div className="paper-pink relative rounded-3xl px-6 pt-12 pb-10 sm:px-10">
      <div className="tape qr-light relative mx-auto max-w-xs -rotate-2 rounded-xl border-4 border-blue bg-surface p-5 text-center text-ink shadow-card">
        <p className="font-display text-2xl leading-tight font-extrabold">Chegou atrasado?</p>
        <p className="mt-1 text-sm leading-snug font-semibold">
          Aponte a câmera ou encoste o celular
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <QrCode
            value={ALUNO_URL}
            label="QR de exemplo da entrada: abre a tela do aluno"
            className="size-36"
          />
          <Icon name="nfc" size={36} className="text-ink" />
        </div>
      </div>
      <p className="relative mx-auto -mt-3 w-fit translate-x-16 rotate-6 rounded-lg border-2 border-ink bg-cream px-3 py-1.5 font-display text-xl leading-none font-extrabold text-ink shadow-card">
        Registrado às 7h12
      </p>
      <p className="mt-6 text-center text-base font-semibold text-ink">
        Sem celular? A portaria registra pelo nome.{' '}
        <Link
          href="/demo/dia"
          className="underline decoration-2 underline-offset-4 hover:decoration-cream"
        >
          Ver o dia a dia
        </Link>
      </p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-titulo"
      className="border-t-2 border-line py-16 sm:py-24"
    >
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              id="como-titulo"
              title="O Escola+ da sua escola, montado com a sua planilha"
              description="Não é um pacote igual para todas: cada escola recebe o seu, feito a partir do que ela já usa."
            />
          </Reveal>
          <ol className="mt-10 space-y-7">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 80} className="grid grid-cols-[4rem_1fr] gap-x-4">
                  <span
                    aria-hidden="true"
                    className="font-pixel text-7xl leading-[0.8] text-secondary"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-[1.75rem] leading-[1.05] font-extrabold">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-lg leading-relaxed text-fg-muted">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <Reveal delay={260}>
            <ButtonLink href="/demo" className="mt-10">
              Testar com a planilha da sua escola
              <Icon name="arrow" size={20} />
            </ButtonLink>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <EntrancePoster />
        </Reveal>
      </Container>
    </section>
  );
}
