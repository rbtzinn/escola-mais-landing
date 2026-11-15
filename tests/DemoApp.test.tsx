import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DemoApp } from '@/components/demo/DemoApp';
import { ToastProvider } from '@/components/ui/Toast';

const CSV = [
  'Aluno;Turma;Faltas;Atrasos;Português;Matemática',
  'Ana;6A;10;0;8;6',
  'Bia;6A;30;4;5;4',
  'Caio;6B;0;3;10;10',
  'Davi;6B;20;;7;',
].join('\r\n');

const setup = () =>
  render(
    <ToastProvider>
      <DemoApp />
    </ToastProvider>,
  );

const upload = async (user: ReturnType<typeof userEvent.setup>, file: File) => {
  // applyAccept desligado: o teste de extensão inválida precisa passar pelo input.
  const input = document.getElementById('arquivo-planilha') as HTMLInputElement;
  await user.upload(input, file);
};

describe('DemoApp', () => {
  it('lê o CSV, sugere as colunas e gera o painel', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv', { type: 'text/csv' }));

    expect(await screen.findByText('2. Confira as colunas')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Coluna do aluno/ })).toHaveTextContent('Aluno');
    expect(screen.getByRole('combobox', { name: /Coluna da turma/ })).toHaveTextContent('Turma');
    expect(screen.getByRole('checkbox', { name: 'Português' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Matemática' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: /Gerar painel/ }));

    expect(await screen.findByText('3. Seu painel')).toBeInTheDocument();
    const risco = screen.getByRole('region', { name: /Alunos em risco/ });
    expect(within(risco).getByText('Bia')).toBeInTheDocument();
    expect(within(risco).getByText(/Frequência 70% \(mínimo 75%\)/)).toBeInTheDocument();
    const freq = screen.getByRole('region', { name: /Frequência por turma/ });
    expect(within(freq).getByText('6A')).toBeInTheDocument();
    expect(within(freq).getByText('80,0%')).toBeInTheDocument();
    const atrasos = screen.getByRole('region', { name: /Atrasos/ });
    expect(within(atrasos).getByText('Bia')).toBeInTheDocument();
  });

  it('recalcula quando o critério muda', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv'));
    await user.click(await screen.findByRole('button', { name: /Gerar painel/ }));
    const input = await screen.findByLabelText('Frequência mínima (%)');
    await user.clear(input);
    await user.type(input, '85');
    const risco = screen.getByRole('region', { name: /Alunos em risco/ });
    expect(within(risco).getByText('Davi')).toBeInTheDocument();
  });

  it('mostra erro inline para formato não aceito', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File(['x'], 'notas.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Envie um arquivo .csv ou .xlsx');
    expect(screen.getByText('1. Envie a planilha')).toBeInTheDocument();
  });

  it('mostra erro para planilha vazia', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File(['Aluno;Turma'], 'vazia.csv'));
    expect(await screen.findByRole('alert')).toHaveTextContent('vazia');
  });
});
