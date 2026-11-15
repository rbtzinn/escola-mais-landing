'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { Container } from '@/components/ui/Container';
import { Listbox } from '@/components/ui/Listbox';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { CARGOS, TAMANHOS_ESCOLA, UFS } from '@/data/options';
import { DEMO_BENEFITS } from '@/data/content';
import {
  EMPTY_DEMO_FORM,
  FIELD_ORDER,
  validateDemoForm,
  type DemoFormErrors,
  type DemoFormValues,
} from '@/lib/validateDemoForm';

const fieldId = (k: keyof DemoFormValues) => `demo-${k}`;

export function DemoForm() {
  const toast = useToast();
  const [values, setValues] = useState<DemoFormValues>(EMPTY_DEMO_FORM);
  const [errors, setErrors] = useState<DemoFormErrors>({});
  const [sending, setSending] = useState(false);

  const set = (key: keyof DemoFormValues) => (v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    // Limpa o erro do campo assim que a pessoa corrige.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const found = validateDemoForm(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((k) => found[k]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    // Envio simulado: nada sai do navegador.
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setValues(EMPTY_DEMO_FORM);
      toast.show({
        variant: 'success',
        title: 'Solicitação registrada!',
        description: 'Em uma versão real, nossa equipe entraria em contato em até 2 dias úteis.',
      });
    }, 800);
  };

  return (
    <section id="demonstracao" aria-labelledby="demo-titulo" className="py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal>
          <SectionHeading
            id="demo-titulo"
            eyebrow="Demonstração"
            title="Veja o Escola+ com os dados da sua escola"
            description="Preencha o formulário e agende uma conversa com a nossa equipe."
          />
          <ul className="mt-8 space-y-4">
            {DEMO_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Icon name="check" size={14} />
                </span>
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={100}>
          <form
            noValidate
            onSubmit={onSubmit}
            aria-labelledby="demo-titulo"
            className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  id={fieldId('nome')}
                  label="Nome completo"
                  autoComplete="name"
                  value={values.nome}
                  onChange={set('nome')}
                  error={errors.nome}
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id={fieldId('email')}
                  label="E-mail institucional"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="nome@escola.edu.br"
                  value={values.email}
                  onChange={set('email')}
                  error={errors.email}
                />
              </div>
              <div className="sm:col-span-2">
                <Listbox
                  id={fieldId('cargo')}
                  name="cargo"
                  label="Cargo"
                  options={CARGOS}
                  value={values.cargo}
                  onChange={set('cargo')}
                  error={errors.cargo}
                />
              </div>
              <TextField
                id={fieldId('municipio')}
                label="Município"
                autoComplete="off"
                value={values.municipio}
                onChange={set('municipio')}
                error={errors.municipio}
              />
              <Combobox
                id={fieldId('uf')}
                name="uf"
                label="UF"
                options={UFS}
                value={values.uf}
                onChange={set('uf')}
                placeholder="Buscar UF"
                emptyText="Nenhuma UF encontrada"
                error={errors.uf}
              />
              <div className="sm:col-span-2">
                <Listbox
                  id={fieldId('tamanho')}
                  name="tamanho"
                  label="Tamanho da escola"
                  options={TAMANHOS_ESCOLA}
                  value={values.tamanho}
                  onChange={set('tamanho')}
                  error={errors.tamanho}
                />
              </div>
            </div>

            <Button type="submit" disabled={sending} className="mt-7 w-full">
              {sending ? 'Enviando…' : 'Solicitar demonstração'}
            </Button>
            <p className="mt-4 flex items-start gap-2 text-sm text-fg-muted">
              <Icon name="info" size={18} className="mt-0.5 shrink-0" />
              Demonstração visual: nenhum dado é enviado ou armazenado.
            </p>
          </form>
        </Reveal>
      </Container>
    </section>
  );
}
