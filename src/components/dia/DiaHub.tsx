'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '@/components/icons';
import { Button, buttonClasses } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { simulatedMemory } from '@/lib/attendance/remember';
import { AlunoCheckin } from './AlunoCheckin';
import { QrCode } from './QrCode';
import { RegistroShell } from './RegistroShell';
import { TodayStats } from './TodayStats';
import { useRegistro } from './useRegistro';

const ALUNO_PATH = '/demo/dia/aluno';

const STAFF: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: '/demo/dia/chamada',
    icon: 'users',
    title: 'Chamada (professor)',
    text: 'Marca só quem faltou e quem entrou atrasado. Gera a contagem do dia.',
  },
  {
    href: '/demo/dia/portaria',
    icon: 'school',
    title: 'Portaria',
    text: 'Registra pelo nome quem não conseguiu ler o QR (sem celular ou internet).',
  },
  {
    href: '/demo/dia/merenda',
    icon: 'utensils',
    title: 'Merenda (cozinha)',
    text: 'Quantas refeições preparar, por turma, com as respostas dos alunos.',
  },
  {
    href: '/demo/dia/horario',
    icon: 'calendar',
    title: 'Horário do dia',
    text: 'Professor faltou? Adianta as aulas e mostra quem está livre para cobrir.',
  },
  {
    href: '/demo/dia/coordenacao',
    icon: 'inbox',
    title: 'Coordenação',
    text: 'Corrige os atrasos, avisa as famílias e vê os reincidentes.',
  },
];

// O endereço completo do link só existe no navegador (no servidor, usa o caminho).
const subscribeNoop = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => '',
  );

/** Cartaz para imprimir e colar na entrada. */
function Poster({ url }: { url: string }) {
  return (
    <div className="qr-light border border-fg bg-surface p-6 text-center text-fg">
      <p className="eyebrow text-fg-muted">Escola+</p>
      <p className="mt-1 font-display text-3xl font-medium">Chegou atrasado?</p>
      <p className="text-fg-muted">
        Aponte a câmera para o QR ou encoste o celular na plaquinha e registre sua chegada.
      </p>
      <QrCode
        value={url}
        label="QR para registrar a chegada atrasada"
        className="mx-auto my-4 size-56 max-w-full"
      />
      <p className="flex items-center justify-center gap-1.5 text-sm font-semibold">
        <Icon name="nfc" size={18} /> Encoste aqui (NFC)
      </p>
      <p className="mt-2 text-sm text-fg-muted">
        Não sabe a matrícula, ou está sem celular ou internet? Fale com a portaria.
      </p>
    </div>
  );
}

/** Entrada da escola: o QR (ou plaquinha NFC) que o aluno usa, o celular do aluno simulado e as telas da equipe. */
export function DiaHub() {
  const { roster, turmas, now } = useRegistro();
  const origin = useOrigin();
  const url = `${origin}${ALUNO_PATH}`;
  // Sem a coluna Nascimento, o link não tem como confirmar o aniversário do aluno.
  const semNascimento = roster.length > 0 && roster.every((r) => !r.nascimento);
  const toast = useToast();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.show({ title: 'Link copiado', description: 'Cole no app NFC Tools para gravar.' });
    } catch {
      toast.show({ title: 'Não foi possível copiar', description: url });
    }
  };

  return (
    <RegistroShell
      hub
      title="Hoje na escola"
      subtitle="Presença, atrasos, merenda e horário do dia, cada pessoa na sua tela e tudo no mesmo lugar."
    >
      <div className="mb-8">
        <TodayStats />
      </div>

      <p className="mb-8 flex items-start gap-2 border-l-2 border-primary bg-muted p-3 text-sm text-fg-muted">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-primary" />
        Demonstração sem servidor: os registros ficam só nesta aba e somem ao recarregar. Por isso o
        celular do aluno aparece simulado aqui ao lado; num celular de verdade o link abre, mas não
        conversa com esta tela.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="qr-titulo" className="space-y-3">
          <h2 id="qr-titulo" className="font-display text-2xl font-medium">
            1. O QR (ou a plaquinha) da entrada
          </h2>
          <p className="text-fg-muted">
            Imprima e cole na entrada. O aluno lê o QR com a câmera do próprio celular (ou encosta o
            celular na plaquinha NFC), informa turma e matrícula e então registra a chegada atrasada
            (só perto do horário de entrada) ou responde se vai comer a merenda. Na primeira vez em
            cada celular, ele confirma o dia e o mês do aniversário; depois, o celular lembra dele.
            Não sabe a matrícula? A portaria tem a lista impressa.
          </p>
          <Poster url={url} />
          {semNascimento && (
            <p className="flex items-start gap-2 border-l-2 border-accent bg-accent/20 p-3 text-sm">
              <Icon name="info" size={18} className="mt-0.5 shrink-0" />
              Sua planilha não tem a coluna Nascimento: o aluno entra só com turma e matrícula.
              Adicione a coluna para confirmar a identidade pelo aniversário.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="file" size={18} />
              Imprimir cartaz
            </Button>
            <Link href={ALUNO_PATH} className={buttonClasses('ghost', undefined, 'sm')}>
              Abrir o link do aluno
            </Link>
          </div>
          <details className="border border-border bg-surface p-3 text-sm">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold">
              <Icon name="nfc" size={18} className="text-primary" />
              Plaquinha NFC: encostar o celular em vez de ler o QR
            </summary>
            <div className="mt-2 space-y-2 text-fg-muted">
              <p>
                É uma etiqueta com chip (NTAG213 ou NTAG215, cerca de R$ 2 a R$ 5 cada) que guarda o
                mesmo link do QR. Não precisa mudar nada no sistema.
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Copie o link do aluno no botão abaixo.</li>
                <li>
                  No app gratuito NFC Tools, toque em Gravar, adicione um registro de URL e cole o
                  link.
                </li>
                <li>Encoste o celular na etiqueta para gravar.</li>
                <li>
                  Em Outras opções, use &quot;Bloquear etiqueta&quot; para ninguém regravar o link.
                </li>
                <li>Cole a etiqueta atrás do cartaz, no lugar do &quot;Encoste aqui&quot;.</li>
              </ol>
              <p>
                Mantenha o QR: nem todo celular tem NFC (alguns Android mais simples não têm, e no
                iPhone funciona a partir do XS). Em parede ou portão de metal, use etiqueta
                anti-metal.
              </p>
              <Button variant="secondary" size="sm" onClick={copyLink}>
                <Icon name="copy" size={18} />
                Copiar link do aluno
              </Button>
            </div>
          </details>
        </section>

        <section aria-labelledby="celular-titulo" className="space-y-3">
          <h2 id="celular-titulo" className="font-display text-2xl font-medium">
            2. O celular do aluno (simulado)
          </h2>
          <p className="text-fg-muted">
            É o que abre ao ler o QR ou encostar na plaquinha: registra a chegada atrasada e
            responde a merenda. Teste aqui:
          </p>
          <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-[10px] border-fg bg-fg p-0 shadow-card">
            <div className="flex justify-center bg-fg pb-2" aria-hidden="true">
              <span className="h-1.5 w-20 rounded-full bg-bg/30" />
            </div>
            <div className="min-h-[30rem] rounded-[1.75rem] bg-bg p-4">
              <AlunoCheckin
                roster={roster}
                turmas={turmas}
                now={now}
                demoHint
                idPrefix="simulado"
                memory={simulatedMemory}
              />
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="equipe-titulo" className="mt-10">
        <h2 id="equipe-titulo" className="mb-4 font-display text-2xl font-medium">
          3. As telas da equipe
        </h2>
        <ul className="grid gap-x-8 border-t border-fg sm:grid-cols-2 lg:grid-cols-3">
          {STAFF.map((s) => (
            <li key={s.href} className="border-b border-fg/20">
              <Link href={s.href} className="group flex h-full items-start gap-3 py-4">
                <Icon name={s.icon} size={22} className="mt-1 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-display text-xl font-medium decoration-accent decoration-2 underline-offset-4 group-hover:underline">
                    {s.title}
                    <Icon
                      name="arrow"
                      size={16}
                      className="text-fg-muted transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="block text-sm text-fg-muted">{s.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {origin &&
        createPortal(
          <div className="print-only p-10" aria-hidden="true">
            <Poster url={url} />
          </div>,
          document.body,
        )}
    </RegistroShell>
  );
}
