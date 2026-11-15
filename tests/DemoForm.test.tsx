import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DemoForm } from '@/components/sections/DemoForm';
import { ToastProvider } from '@/components/ui/Toast';

const setup = () =>
  render(
    <ToastProvider>
      <DemoForm />
    </ToastProvider>,
  );

describe('DemoForm', () => {
  it('mostra erros inline e foca o primeiro campo inválido', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Solicitar demonstração' }));
    expect(screen.getByText('Informe seu nome completo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome completo')).toHaveFocus();
    expect(screen.queryByText('Solicitação registrada!')).not.toBeInTheDocument();
  });

  it('preenche, envia e mostra o toast de sucesso', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza');
    await user.type(screen.getByLabelText('E-mail institucional'), 'ana@educacao.gov.br');
    await user.type(screen.getByLabelText('Município'), 'Olinda');

    await user.click(screen.getByRole('combobox', { name: /Cargo/ }));
    await user.click(screen.getByRole('option', { name: /Diretor/ }));

    await user.type(screen.getByRole('combobox', { name: 'UF' }), 'pern');
    await user.click(screen.getByRole('option', { name: /Pernambuco/ }));

    await user.click(screen.getByRole('combobox', { name: /Tamanho/ }));
    await user.click(screen.getByRole('option', { name: /201 a 500/ }));

    await user.click(screen.getByRole('button', { name: 'Solicitar demonstração' }));
    expect(
      await screen.findByText('Solicitação registrada!', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Nome completo')).toHaveValue(''));
  });
});
