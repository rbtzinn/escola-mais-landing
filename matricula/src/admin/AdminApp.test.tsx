import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/lib/adminApi';
import AdminApp from './AdminApp';

const header = [
  'Enviado em',
  'Protocolo',
  'Status',
  'Observação',
  'Alterado por',
  'Alterado em',
  'CPF do aluno',
  'Modalidade',
  'Curso',
  'Seu nome completo',
];
const panel = (papel: 'direcao' | 'coordenacao') => ({
  status: 'ok',
  usuario: { nome: 'Maria', papel },
  hoje: '23/11/2026',
  cabecalho: header,
  linhas: [
    [
      '20/11/2026 10:00',
      'MAT-2026-0001',
      'Matriculado',
      '',
      '',
      '',
      '52998224725',
      'Integrado',
      'Farmácia',
      'Ana Souza',
    ],
    [
      '21/11/2026 10:00',
      'MAT-2026-0002',
      'Pendente',
      'falta RG',
      'Maria',
      '22/11/2026 09:00',
      '11144477735',
      'Subsequente',
      'Enfermagem',
      'João Ávila',
    ],
  ],
  periodo: { inicio: '', fim: '' },
  ...(papel === 'direcao' ? { aprovados: [], excecoes: [], usuarios: [] } : {}),
});

let api: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  localStorage.clear();
  api = vi.spyOn(adminApi, 'api');
});
afterEach(() => vi.restoreAllMocks());

const entrar = async (
  user: ReturnType<typeof userEvent.setup>,
  papel: 'direcao' | 'coordenacao' = 'direcao',
) => {
  api.mockImplementation(async (action: string, body: { senha?: string }) => {
    if (action === 'login')
      return body.senha === 'certa1234'
        ? { status: 'ok', sessao: 's', nome: 'Maria', papel, exp: Date.now() + 1e6 }
        : { status: 'login_invalido' };
    if (action === 'painel') return panel(papel);
    return { status: 'ok' };
  });
  render(<AdminApp />);
  await user.type(screen.getByLabelText('Login'), 'maria');
  await user.type(screen.getByLabelText('Senha'), 'certa1234');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByRole('heading', { name: 'Visão geral' });
};

describe('painel administrativo', () => {
  it('senha errada avisa; certa entra e mostra os números', async () => {
    const user = userEvent.setup();
    api.mockResolvedValue({ status: 'login_invalido' });
    render(<AdminApp />);
    await user.type(screen.getByLabelText('Login'), 'maria');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Login ou senha errados.')).toBeInTheDocument();
    api.mockReset();
    await user.clear(screen.getByLabelText('Senha'));
    await entrarDepois(user);
    expect(screen.getByText('Matrículas ativas').nextSibling).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /João Ávila/ })).toBeInTheDocument();
  });

  it('coordenação só vê visão geral e matrículas', async () => {
    const user = userEvent.setup();
    await entrar(user, 'coordenacao');
    const nav = screen.getByRole('navigation', { name: 'Seções do painel' });
    expect(
      within(nav)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Visão geral', 'Matrículas']);
  });

  it('marcar Pendente exige motivo e grava o status', async () => {
    const user = userEvent.setup();
    await entrar(user);
    await user.click(screen.getByRole('button', { name: 'Matrículas' }));
    await user.click(screen.getByRole('button', { name: /Ana Souza/ }));
    const ficha = screen.getByRole('region', { name: 'Ana Souza' });
    await user.click(within(ficha).getByRole('radio', { name: 'Pendente' }));
    await user.click(within(ficha).getByRole('button', { name: 'Salvar status' }));
    expect(within(ficha).getByText('Escreva o motivo da pendência.')).toBeInTheDocument();
    await user.type(within(ficha).getByLabelText('Motivo da pendência'), 'falta comprovante');
    await user.click(within(ficha).getByRole('button', { name: 'Salvar status' }));
    expect(api).toHaveBeenCalledWith(
      'status',
      { protocolo: 'MAT-2026-0001', status: 'Pendente', observacao: 'falta comprovante' },
      's',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Ana Souza' })).not.toBeInTheDocument();
  });

  it('ação que devolve o painel atualiza a tela sem pedir o painel de novo', async () => {
    const user = userEvent.setup();
    await entrar(user);
    const updated = panel('direcao');
    updated.linhas[0][2] = 'Cancelado';
    api.mockImplementation(async (action: string) =>
      action === 'status' ? { status: 'ok', painel: updated } : panel('direcao'),
    );
    api.mockClear();
    await user.click(screen.getByRole('button', { name: 'Matrículas' }));
    await user.click(screen.getByRole('button', { name: /Ana Souza/ }));
    const ficha = screen.getByRole('region', { name: 'Ana Souza' });
    await user.click(within(ficha).getByRole('radio', { name: 'Cancelado' }));
    await user.click(within(ficha).getByRole('button', { name: 'Salvar status' }));
    await waitFor(() =>
      expect(screen.getAllByText('Cancelado', { selector: 'span' }).length).toBeGreaterThan(0),
    );
    // A ficha continua aberta e confirma o salvamento (não é recriada ao atualizar).
    expect(screen.getByText('Status salvo.')).toBeInTheDocument();
    expect(api.mock.calls.map((c: unknown[]) => c[0])).toEqual(['status']);
  });

  it('cria exceção para um aluno', async () => {
    const user = userEvent.setup();
    await entrar(user);
    await user.click(screen.getByRole('button', { name: 'Exceções' }));
    await user.type(screen.getByLabelText('CPF do aluno'), '52998224725');
    await user.type(screen.getByLabelText('Data de nascimento'), '15032010');
    await user.click(screen.getByRole('button', { name: 'Criar exceção' }));
    expect(api).toHaveBeenCalledWith(
      'excecao_add',
      expect.objectContaining({
        cpf: '529.982.247-25',
        nascimento: '15/03/2010',
        periodo: true,
      }),
      's',
    );
  });

  it('sessão vencida volta para o login', async () => {
    const user = userEvent.setup();
    await entrar(user);
    api.mockResolvedValue({ status: 'sessao_expirada' });
    await user.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(await screen.findByText('Sua sessão acabou. Entre de novo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});

async function entrarDepois(user: ReturnType<typeof userEvent.setup>) {
  api.mockImplementation(async (action: string) =>
    action === 'login'
      ? { status: 'ok', sessao: 's', nome: 'Maria', papel: 'direcao', exp: Date.now() + 1e6 }
      : panel('direcao'),
  );
  await user.type(screen.getByLabelText('Senha'), 'certa1234');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByRole('heading', { name: 'Visão geral' });
}
