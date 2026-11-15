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
    <footer className="border-t border-border bg-muted">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm leading-relaxed text-fg-muted">
            Gestão escolar mais simples para quem cuida do dia a dia da escola pública.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <h2 className="mb-3 text-sm font-bold tracking-[0.14em] uppercase">Navegação</h2>
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex min-h-9 items-center text-fg-muted hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 text-sm font-bold tracking-[0.14em] uppercase">Institucional</h2>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="inline-flex min-h-9 items-center text-fg-muted underline underline-offset-4 hover:text-primary"
              >
                Política de privacidade
              </button>
            </li>
            <li>
              <Link
                href="/#demonstracao"
                className="inline-flex min-h-9 items-center text-fg-muted hover:text-primary"
              >
                Solicitar demonstração
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col gap-1 py-5 text-sm text-fg-muted sm:flex-row sm:justify-between">
          <p>© 2026 Escola+ — projeto demonstrativo.</p>
          <p>Dados, números e depoimentos desta página são fictícios.</p>
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
