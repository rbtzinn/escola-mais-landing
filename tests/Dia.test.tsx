import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import nextConfig from '../next.config';
import { DemoApp } from '@/components/demo/DemoApp';
import { AlunoPage } from '@/components/dia/AlunoPage';
import { ChamadaView } from '@/components/dia/ChamadaView';
import { CoordenacaoView } from '@/components/dia/CoordenacaoView';
import { DiaHub } from '@/components/dia/DiaHub';
import { HorarioView } from '@/components/dia/HorarioView';
import { MerendaView } from '@/components/dia/MerendaView';
import { PortariaView } from '@/components/dia/PortariaView';
import { ToastProvider } from '@/components/ui/Toast';
import { buildRoster } from '@/lib/attendance/codes';
import type { Aula } from '@/lib/daily/timetable';
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

/** Identifica o aluno no link (turma + matrícula). */
async function entrar(user: User, turma: string, matricula: string) {
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

describe('Dia a dia', () => {
  it('sem planilha, abre com a escola de exemplo (e a grade de exemplo)', () => {
    demoStore.reset();
    renderWith(<DiaHub />);
    expect(screen.getByText('Escola de exemplo')).toBeInTheDocument();
    expect(demoStore.get().timetable?.aulas.length).toBe(150);
  });

  it('o hub mostra os números do dia, o QR e o link de cada tela', () => {
    renderWith(<DiaHub />);
    expect(screen.getByRole('img', { name: /QR para registrar/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Presentes hoje/ })).toHaveTextContent(
      'Chamada em 0 de 2 turmas',
    );
    expect(screen.getByRole('link', { name: /^Merenda\s*3/ })).toBeInTheDocument();
    for (const [nome, href] of [
      ['Chamada (professor)', '/demo/dia/chamada'],
      ['Portaria', '/demo/dia/portaria'],
      ['Merenda (cozinha)', '/demo/dia/merenda'],
      ['Horário do dia', '/demo/dia/horario'],
      ['Coordenação', '/demo/dia/coordenacao'],
    ])
      expect(
        screen.getByRole('link', { name: new RegExp(`^${nome.replace(/[()]/g, '\\$&')}`) }),
      ).toHaveAttribute('href', href);
  });

  it('o endereço antigo /demo/registro redireciona para /demo/dia', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/demo/registro', destination: '/demo/dia' }),
        expect.objectContaining({
          source: '/demo/registro/professor',
          destination: '/demo/dia/chamada',
        }),
        expect.objectContaining({
          source: '/demo/registro/:path*',
          destination: '/demo/dia/:path*',
        }),
      ]),
    );
  });

  it('aluno se identifica e registra a chegada, vendo só o primeiro nome', async () => {
    const user = userEvent.setup();
    renderWith(<AlunoPage />);
    await entrar(user, '6A', '111111');
    expect(screen.getByText('Olá, Ana S.!')).toBeInTheDocument();
    expect(screen.queryByText(/Souza/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Registrar minha chegada' }));
    expect(result()).toHaveTextContent('Chegada registrada às 7h12');
    expect(demoStore.get().records[0]).toMatchObject({ aluno: 'Ana Souza', channel: 'aluno' });
  });

  it('matrícula de outra turma não é aceita', async () => {
    const user = userEvent.setup();
    renderWith(<AlunoPage />);
    await entrar(user, '6B', '111111');
    expect(screen.getByText(/Matrícula não encontrada nesta turma/)).toBeInTheDocument();
  });

  it('fora do horário de entrada, o atraso manda procurar a portaria', async () => {
    const user = userEvent.setup();
    act(() => demoStore.setClock({ ...demoStore.get().clock, simulada: '10:00' }));
    renderWith(<AlunoPage />);
    await entrar(user, '6A', '111111');
    await user.click(screen.getByRole('button', { name: 'Registrar minha chegada' }));
    expect(result()).toHaveTextContent('O registro pelo celular encerrou');
  });

  it('aluno responde a merenda até o prazo e a cozinha conta', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWith(<AlunoPage />);
    await entrar(user, '6A', '222222');
    await user.click(screen.getByRole('button', { name: 'Não vou comer' }));
    expect(screen.getByRole('button', { name: 'Não vou comer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    unmount();

    renderWith(<MerendaView />);
    // 3 alunos, Bia não vai: 2 refeições (sem resposta conta).
    expect(
      screen.getByRole('heading', { name: 'Refeições para preparar hoje' }).nextElementSibling,
    ).toHaveTextContent('2');
    expect(screen.getByText('Respostas abertas até 9h00')).toBeInTheDocument();
  });

  it('depois do prazo, a merenda não aceita resposta', async () => {
    const user = userEvent.setup();
    act(() => demoStore.setClock({ ...demoStore.get().clock, simulada: '09:30' }));
    renderWith(<AlunoPage />);
    await entrar(user, '6A', '222222');
    expect(screen.getByText(/O prazo da merenda encerrou às 9h00/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vou comer' })).not.toBeInTheDocument();
  });

  it('chamada marca ausentes; quem chega atrasado depois volta a contar como presente', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWith(<ChamadaView />);
    const lista = screen.getByRole('list', { name: 'Alunos da turma 6A' });
    await user.click(within(lista).getByRole('button', { name: 'Marcar falta de Bia Lima' }));
    await user.click(screen.getByRole('button', { name: /Salvar chamada/ }));
    expect(result()).toHaveTextContent('1 presentes e 1 ausente');
    expect(demoStore.get().chamadas['6A'].ausentes).toHaveLength(1);
    unmount();

    const hub = renderWith(<DiaHub />);
    expect(screen.getByRole('link', { name: /Presentes hoje/ })).toHaveTextContent('1/2');
    hub.unmount();

    // Bia chega atrasada e é registrada na portaria.
    renderWith(<PortariaView />);
    await user.type(screen.getByLabelText('Buscar aluno pelo nome'), 'bia');
    await user.click(screen.getByRole('button', { name: /Bia Lima/ }));
    await user.click(screen.getByRole('button', { name: /Registrar atraso/ }));
    renderWith(<DiaHub />);
    expect(screen.getByRole('link', { name: /Presentes hoje/ })).toHaveTextContent('2/2');
  });

  it('professor marca e pode desfazer o atraso por 5 minutos', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const user = userEvent.setup();
    renderWith(<ChamadaView />);
    const lista = screen.getByRole('list', { name: 'Alunos da turma 6A' });

    await user.click(within(lista).getByRole('button', { name: 'Marcar atraso de Bia Lima' }));
    await user.click(
      within(lista).getByRole('button', { name: /Desfazer atraso de Bia Lima \(5:00\)/ }),
    );
    expect(result()).toHaveTextContent('Atraso de Bia Lima desfeito');

    await user.click(within(lista).getByRole('button', { name: 'Marcar atraso de Bia Lima' }));
    vi.setSystemTime(new Date(2026, 10, 16, 10, 5, 1));
    expect(
      await within(lista).findByText(/fale com a coordenação/, {}, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(within(lista).queryByRole('button', { name: /Desfazer/ })).not.toBeInTheDocument();
  });

  it('horário: ao marcar um professor faltando, adianta a aula e mostra quem está livre', async () => {
    const user = userEvent.setup();
    const aula = (turma: string, n: number, professor: string, disciplina: string): Aula => ({
      turma,
      dia: 1,
      aula: n,
      professor,
      disciplina,
    });
    act(() => {
      demoStore.setClock({ ...demoStore.get().clock });
      demoStore.setTimetable({
        nome: 'grade.csv',
        aulas: [
          aula('6A', 1, 'Rita', 'Matemática'),
          aula('6A', 2, 'Paulo', 'Português'),
          aula('6B', 1, 'Marta', 'Ciências'),
          aula('6B', 2, 'Igor', 'Artes'),
        ],
      });
    });
    renderWith(<HorarioView />);
    await user.click(screen.getByRole('button', { name: 'Segunda' }));
    expect(screen.getByRole('heading', { name: 'Segunda: horário normal' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rita' }));

    const p6a = screen.getByRole('list', { name: 'Horário da turma 6A' });
    expect(within(p6a).getByText('adiantada da 2ª aula')).toBeInTheDocument();
    expect(
      within(p6a).getByText(/Livres para cobrir: Marta|Livres para cobrir: Igor/),
    ).toBeInTheDocument();
    expect(screen.getByText('Pode sair às 7h50')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Segunda: 1 turma afetada' })).toBeInTheDocument();
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
    link.addEventListener('click', (e) => e.preventDefault());
    await user.click(link);
    expect(screen.getByRole('heading', { name: 'Fila de avisos (1)' })).toBeInTheDocument();

    const hoje = screen.getByRole('list', { name: 'Atrasos de hoje' });
    await user.click(within(hoje).getByRole('button', { name: /Caio Reis/ }));
    await user.click(screen.getByRole('switch', { name: /Justificado/ }));
    expect(screen.getByRole('heading', { name: 'Fila de avisos (0)' })).toBeInTheDocument();

    const reinc = screen.getByRole('region', { name: /Reincidentes/ });
    expect(within(reinc).getByText('3 atrasos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir registro de Caio Reis' }));
    expect(screen.getByRole('heading', { name: 'Atrasos de hoje (1)' })).toBeInTheDocument();
  });

  it('o painel da /demo resume o dia', () => {
    const school = demoStore.get().school!;
    const entry = buildRoster(analyze(school.table, school.mapping, DEFAULT_OPTIONS).students)[1];
    demoStore.register({
      entry,
      channel: 'portaria',
      registradoPor: 'Portaria',
      at: new Date(2026, 10, 16, 7, 30),
    });
    renderWith(<DemoApp />);
    const card = screen.getByRole('link', { name: /Hoje: 1 atraso registrado/ });
    expect(card).toHaveTextContent('chamada pendente');
    expect(card).toHaveTextContent('1 aviso pendente');
    expect(card).toHaveTextContent('3 refeições');
    expect(card).toHaveAttribute('href', '/demo/dia');
  });
});
