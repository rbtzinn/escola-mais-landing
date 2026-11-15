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

/** Sem faltas: o painel não é aberto direto, passa pela conferência de colunas. */
const CSV_SEM_FALTAS = ['Aluno;Turma;Português', 'Ana;6A;8', 'Bia;6A;4'].join('\r\n');

const setup = () =>
  render(
    <ToastProvider>
      <DemoApp />
    </ToastProvider>,
  );

const upload = async (
  user: ReturnType<typeof userEvent.setup>,
  file: File,
  id = 'arquivo-planilha',
) => {
  // applyAccept desligado: o teste de extensão inválida precisa passar pelo input.
  const input = document.getElementById(id) as HTMLInputElement;
  await user.upload(input, file);
};

const tab = (name: string) => screen.getByRole('tab', { name });

describe('DemoApp', () => {
  it('abre o painel direto quando reconhece as colunas e mostra o veredito', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv', { type: 'text/csv' }));

    expect(await screen.findByText('3. Seu painel')).toBeInTheDocument();
    const veredito = screen.getByRole('region', { name: '1 aluno precisa de atenção.' });
    expect(within(veredito).getByText(/Situação da escola: Crítica/)).toBeInTheDocument();
    expect(within(veredito).getByText(/A turma 6A é a mais crítica/)).toBeInTheDocument();

    const acoes = screen.getByRole('region', { name: 'O que fazer hoje' });
    expect(within(acoes).getByText('Falar com a família de Bia')).toBeInTheDocument();
  });

  it('abre a ficha do aluno com o link do WhatsApp a partir da ação', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv'));
    await user.click(await screen.findByRole('button', { name: /Falar com a família de Bia/ }));

    const ficha = screen.getByRole('dialog', { name: 'Bia' });
    expect(within(ficha).getByText(/Frequência 70% \(mínimo 75%\)/)).toBeInTheDocument();
    const link = within(ficha).getByRole('link', { name: /Avisar a família no WhatsApp/ });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=Ol%C3%A1/);
  });

  it('navega pelas abas: turmas e alunos com filtro', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv'));

    await user.click(await screen.findByRole('tab', { name: 'Turmas' }));
    expect(tab('Turmas')).toHaveAttribute('aria-selected', 'true');
    const freq = screen.getByRole('region', { name: /Frequência por turma/ });
    expect(within(freq).getByText('80,0%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^6A/ }));
    expect(screen.getByRole('dialog', { name: 'Turma 6A' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(tab('Alunos'));
    const lista = screen.getByRole('list', { name: 'Lista de alunos' });
    expect(within(lista).getByText('Bia')).toBeInTheDocument();
    expect(within(lista).queryByText('Ana')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Atrasos (2)' }));
    expect(
      within(screen.getByRole('list', { name: 'Lista de alunos' })).getByText('Caio'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Todos (4)' }));
    await user.type(screen.getByLabelText('Buscar aluno pelo nome'), 'dav');
    const filtrada = screen.getByRole('list', { name: 'Lista de alunos' });
    expect(within(filtrada).getAllByRole('listitem')).toHaveLength(1);
    expect(within(filtrada).getByText('Davi')).toBeInTheDocument();
  });

  it('troca de aba pelo teclado', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv'));
    (await screen.findByRole('tab', { name: 'Resumo' })).focus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Turmas')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Turmas')).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(tab('Alunos')).toHaveAttribute('aria-selected', 'true');
  });

  it('recalcula quando o critério muda', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'turmas.csv'));
    await user.click(await screen.findByRole('button', { name: /Critérios/ }));
    const input = screen.getByLabelText('Frequência mínima (%)');
    await user.clear(input);
    await user.type(input, '85');
    await user.click(screen.getByRole('button', { name: 'Ver painel' }));
    expect(
      screen.getByRole('region', { name: '2 alunos precisam de atenção.' }),
    ).toBeInTheDocument();
  });

  it('passa pela conferência de colunas quando não reconhece tudo', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV_SEM_FALTAS], 'notas.csv'));
    expect(await screen.findByText('2. Confira as colunas')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Coluna do aluno/ })).toHaveTextContent('Aluno');
    expect(screen.getByRole('checkbox', { name: 'Português' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: /Gerar painel/ }));
    expect(await screen.findByText('3. Seu painel')).toBeInTheDocument();
  });

  it('abre a escola de exemplo e compara com o bimestre anterior', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Ver com escola de exemplo/ }));
    expect(screen.getByText('Escola de exemplo')).toBeInTheDocument();
    expect(screen.getByText(/A turma 7º B é a mais crítica/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usar bimestre anterior do exemplo' }));
    expect(screen.getByText(/Comparando com:/)).toBeInTheDocument();
    expect(screen.getByText(/Desde a planilha anterior:/)).toBeInTheDocument();
    expect(screen.getAllByText(/\(piorou\)|\(melhorou\)/).length).toBeGreaterThan(0);
  });

  it('compara com uma planilha anterior enviada', async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    await upload(user, new File([CSV], 'atual.csv'));
    await screen.findByText('3. Seu painel');
    const antes = CSV.replace('Bia;6A;30;4;5;4', 'Bia;6A;5;4;8;8');
    await upload(user, new File([antes], 'anterior.csv'), 'arquivo-anterior');
    expect((await screen.findByText(/Comparando com:/)).closest('p')).toHaveTextContent(
      'anterior.csv',
    );
    expect(screen.getByText(/0 saíram do risco/)).toBeInTheDocument();
    expect(screen.getByText(/1 entrou/)).toBeInTheDocument();
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
