import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoApp } from '@/components/demo/DemoApp';
import { AlunoPage } from '@/components/registro/AlunoPage';
import { CoordenacaoView } from '@/components/registro/CoordenacaoView';
import { EntradaHub } from '@/components/registro/EntradaHub';
import { PortariaView } from '@/components/registro/PortariaView';
import { ProfessorView } from '@/components/registro/ProfessorView';
import { ToastProvider } from '@/components/ui/Toast';
import { buildRoster } from '@/lib/attendance/codes';
import { demoStore } from '@/lib/demoStore';
import { analyze } from '@/lib/spreadsheet/analyze';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';

const CSV = [
  'Matrícula;Aluno;Turma;Faltas;Atrasos;Telefone;Português',
  '111111;Ana Souza;6A;0;2;(81) 99999-0001;8',
  '222222;Bia Lima;6A;0;0;;7',
  '333333;Caio Reis;6B;0;0;;9',
].join('\n');

const renderWith = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);
const result = () => screen.getByRole('status', { name: 'Resultado do registro' });

type User = ReturnType<typeof userEvent.setup>;

/** Preenche a tela do aluno (turma + matrícula) e continua. */
async function checkin(user: User, turma: string, matricula: string) {
  await user.click(screen.getByRole('combobox', { name: /Sua turma/ }));
  await user.click(screen.getByRole('option', { name: turma }));
  const campo = screen.getByLabelText('Sua matrícula');
  await user.clear(campo);
  await user.type(campo, matricula);
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

beforeEach(() => {
  demoStore.setSchool(parseCsv(CSV), 'escola.csv');
});
afterEach(() => vi.useRealTimers());

describe('Registro de atrasos', () => {
  it('sem planilha, abre com a escola de exemplo', () => {
    demoStore.reset();
    renderWith(<EntradaHub />);
    expect(screen.getByText('Escola de exemplo')).toBeInTheDocument();
  });

  it('a Entrada mostra o QR, o celular simulado e o link de cada tela', () => {
    renderWith(<EntradaHub />);
    expect(screen.getByRole('img', { name: /QR para registrar/ })).toBeInTheDocument();
    for (const [nome, href] of [
      ['Portaria', '/demo/registro/portaria'],
      ['Professor(a)', '/demo/registro/professor'],
      ['Coordenação', '/demo/registro/coordenacao'],
    ])
      expect(
        screen.getByRole('link', { name: new RegExp(`^${nome.replace(/[()]/g, '\\$&')}`) }),
      ).toHaveAttribute('href', href);
  });

  it('aluno se registra com turma e matrícula, vendo só o primeiro nome', async () => {
    const user = userEvent.setup();
    renderWith(<AlunoPage />);
    await checkin(user, '6A', '111111');
    expect(screen.getByText('Você é Ana S.?')).toBeInTheDocument();
    expect(screen.queryByText(/Souza/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Sim, registrar/ }));
    expect(result()).toHaveTextContent('Chegada registrada às 7h12');
    expect(demoStore.get().records[0]).toMatchObject({
      aluno: 'Ana Souza',
      channel: 'aluno',
      aviso: 'pendente',
    });
  });

  it('matrícula de outra turma não é aceita', async () => {
    const user = userEvent.setup();
    renderWith(<AlunoPage />);
    await checkin(user, '6B', '111111');
    expect(screen.getByText(/Matrícula não encontrada nesta turma/)).toBeInTheDocument();
    expect(demoStore.get().records).toHaveLength(0);
  });

  it('fora do horário de entrada, o link manda procurar a portaria', async () => {
    const user = userEvent.setup();
    act(() => demoStore.setClock({ ...demoStore.get().clock, simulada: '10:00' }));
    renderWith(<AlunoPage />);
    await checkin(user, '6A', '111111');
    expect(result()).toHaveTextContent('O registro pelo celular encerrou');
    expect(result()).toHaveTextContent('Procure a portaria');
  });

  it('portaria registra pelo nome e o aluno vê que já foi registrado', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWith(<PortariaView />);
    await user.type(screen.getByLabelText('Buscar aluno pelo nome'), 'bia');
    await user.click(screen.getByRole('button', { name: /Bia Lima/ }));
    await user.click(screen.getByRole('button', { name: 'Chuva' }));
    await user.click(screen.getByRole('button', { name: /Registrar atraso/ }));
    expect(result()).toHaveTextContent('Atraso registrado: Bia Lima');
    expect(demoStore.get().records[0]).toMatchObject({ channel: 'portaria', motivo: 'chuva' });
    unmount();

    renderWith(<AlunoPage />);
    await checkin(user, '6A', '222222');
    await user.click(screen.getByRole('button', { name: /Sim, registrar/ }));
    expect(result()).toHaveTextContent('Você já foi registrado hoje');
    expect(result()).toHaveTextContent('Por portaria, às 7h12');
    expect(demoStore.get().records).toHaveLength(1);
  });

  it('professor marca e pode desfazer por 5 minutos', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const user = userEvent.setup();
    renderWith(<ProfessorView />);
    const lista = screen.getByRole('list', { name: 'Alunos da turma 6A' });

    await user.click(within(lista).getByRole('button', { name: 'Marcar atraso de Bia Lima' }));
    await user.click(
      within(lista).getByRole('button', { name: /Desfazer atraso de Bia Lima \(5:00\)/ }),
    );
    expect(result()).toHaveTextContent('Atraso de Bia Lima desfeito');
    expect(demoStore.get().records).toHaveLength(0);

    await user.click(within(lista).getByRole('button', { name: 'Marcar atraso de Bia Lima' }));
    vi.setSystemTime(new Date(2026, 10, 16, 10, 5, 1));
    expect(
      await within(lista).findByText(/fale com a coordenação/, {}, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(within(lista).queryByRole('button', { name: /Desfazer/ })).not.toBeInTheDocument();
    expect(demoStore.get().records).toHaveLength(1);
  });

  it('coordenação avisa pelo WhatsApp, justifica e exclui', async () => {
    const user = userEvent.setup();
    renderWith(<CoordenacaoView />);
    const busca = screen.getByLabelText('Buscar aluno pelo nome');
    await user.type(busca, 'ana');
    await user.click(screen.getByRole('button', { name: /Ana Souza/ }));
    await user.type(busca, 'caio');
    await user.click(screen.getByRole('button', { name: /Caio Reis/ }));

    const fila = screen.getByRole('list', { name: 'Avisos pendentes' });
    const link = within(fila).getByRole('link', { name: /família de Ana Souza/ });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5581999990001\?text=/);
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain(
      'Ana Souza (6A) chegou às 7h12 hoje',
    );
    link.addEventListener('click', (e) => e.preventDefault());
    await user.click(link);
    expect(screen.getByRole('heading', { name: 'Fila de avisos (1)' })).toBeInTheDocument();

    const hoje = screen.getByRole('list', { name: 'Atrasos de hoje' });
    await user.click(within(hoje).getByRole('button', { name: /Caio Reis/ }));
    await user.click(screen.getByRole('switch', { name: /Justificado/ }));
    expect(screen.getByRole('heading', { name: 'Fila de avisos (0)' })).toBeInTheDocument();

    // Reincidentes: Ana tinha 2 na planilha + 1 hoje = 3 (limite padrão).
    const reinc = screen.getByRole('region', { name: /Reincidentes/ });
    expect(within(reinc).getByText('3 atrasos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir registro de Caio Reis' }));
    expect(screen.getByRole('heading', { name: 'Atrasos de hoje (1)' })).toBeInTheDocument();
  });

  it('o painel da /demo soma os atrasos registrados', () => {
    const school = demoStore.get().school!;
    const entry = buildRoster(analyze(school.table, school.mapping, DEFAULT_OPTIONS).students)[1];
    demoStore.register({
      entry,
      channel: 'portaria',
      registradoPor: 'Portaria',
      at: new Date(2026, 10, 16, 7, 30),
    });
    renderWith(<DemoApp />);
    expect(screen.getByRole('link', { name: /Hoje: 1 atraso registrado/ })).toHaveTextContent(
      '1 aviso pendente',
    );
    expect(screen.getByRole('link', { name: /Registrar atrasos/ })).toHaveAttribute(
      'href',
      '/demo/registro',
    );
  });
});
