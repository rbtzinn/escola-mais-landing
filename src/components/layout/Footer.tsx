'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Modal } from '@/components/ui/Modal';
import { NAV_LINKS } from '@/data/content';
import { Logo } from './Logo';

export function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <footer className="border-t border-fg">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo className="!text-4xl" />
          <p className="mt-5 max-w-sm font-display text-xl leading-snug text-fg-muted italic">
            Gestão mais simples para quem cuida do dia a dia da escola pública.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <h2 className="eyebrow mb-3 text-fg-muted">Nesta página</h2>
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex min-h-9 items-center decoration-accent decoration-2 underline-offset-4 hover:underline"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="eyebrow mb-3 text-fg-muted">Institucional</h2>
          <ul>
            <li>
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="inline-flex min-h-9 items-center decoration-accent decoration-2 underline-offset-4 hover:underline"
              >
                Política de privacidade
              </button>
            </li>
            <li>
              <Link
                href="/#demonstracao"
                className="inline-flex min-h-9 items-center decoration-accent decoration-2 underline-offset-4 hover:underline"
              >
                Solicitar demonstração
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-fg/20">
        <Container className="eyebrow flex flex-col gap-1 py-5 text-fg-muted sm:flex-row sm:justify-between">
          <p>© 2026 Escola+ · projeto demonstrativo</p>
          <p>Dados, números e depoimentos são fictícios</p>
        </Container>
      </div>

      <Modal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Política de privacidade"
      >
        <p>
          <strong className="text-fg">Texto ilustrativo.</strong> Esta página é uma demonstração
          visual do Escola+ e não coleta, armazena nem envia dados pessoais.
        </p>
        <p>
          O formulário de demonstração apenas simula o envio no seu navegador. Nenhuma informação
          digitada sai do seu dispositivo.
        </p>
        <p>
          Em uma versão real, esta política descreveria as finalidades, as bases legais, o tempo de
          guarda e os direitos do titular, conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
      </Modal>
    </footer>
  );
}
