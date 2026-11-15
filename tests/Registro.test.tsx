import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoApp } from '@/components/demo/DemoApp';
import { RegistroApp } from '@/components/registro/RegistroApp';
import { ToastProvider } from '@/components/ui/Toast';
import { buildRoster } from '@/lib/attendance/codes';
import { demoStore } from '@/lib/demoStore';
import { analyze } from '@/lib/spreadsheet/analyze';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';

// Canal na URL (?canal=), controlado pelo teste.
let search = new URLSearchParams();
vi.mock('next/navigation', () => ({
  usePathname: () => '/demo/registro',
  useSearchParams: () => search,
  useRouter: () => ({
    replace: (url: string) => {
      search = new URLSearchParams(url.split('?')[1]);
    },
  }),
}));

const CSV = [
  'Aluno;Turma;Faltas;Atrasos;Telefone;Português',
  'Ana Souza;6A;0;2;(81) 99999-0001;8',
  'Bia Lima;6A;0;0;;7',
  'Caio Reis;6B;0;0;;9',
].join('\n');

const setupSchool = () => demoStore.setSchool(parseCsv(CSV), 'escola.csv');

const renderRegistro = (canal: string) => {
  search = new URLSearchParams(`canal=${canal}`);
  return render(
    <ToastProvider>
      <RegistroApp />
    </ToastProvider>,
  );
};

const codeOf = (aluno: string) => {
  const school = demoStore.get().school!;
  const roster = buildRoster(analyze(school.table, school.mapping, DEFAULT_OPTIONS).students);
  return roster.find((r) => r.aluno === aluno)!.code;
};

const result = () => screen.getByRole('status', { name: 'Resultado do registro' });

beforeEach(() => setupSchool());

describe('Registro de atrasos', () => {
  it('sem planilha, abre com a escola de exemplo', () => {
    demoStore.reset();
    renderRegistro('portaria');
    expect(screen.getByText('Escola de exemplo')).toBeInTheDocument();
  });

  it('portaria registra pelo nome e o professor vê o mesmo registro', async () => {
    const user = userEvent.setup();
    const { unmount } = renderRegistro('portaria');
    await user.type(screen.getByLabelText('Buscar aluno pelo nome'), 'bia');
    await user.click(screen.getByRole('button', { name: /Bia Lima/ }));
    await user.click(screen.getByRole('button', { name: 'Chuva' }));
    await user.click(screen.getByRole('button', { name: /Registrar atraso/ }));
    expect(result()).toHaveTextContent('Atraso registrado: Bia Lima');
    expect(result()).toHaveTextContent('Chegou às 7h12 (12 min');
    expect(demoStore.get().records[0]).toMatchObject({
      aluno: 'Bia Lima',
      channel: 'portaria',
      registradoPor: 'Portaria',
      motivo: 'chuva',
    });
    unmount();

    renderRegistro('professor');
    const lista = screen.getByRole('list', { name: 'Alunos da turma 6A' });
    expect(within(lista).getByText(/Atrasado · 7h12/)).toHaveTextContent('por Portaria');
    await user.click(within(lista).getByRole('button', { name: 'Marcar atraso de Ana Souza' }));
    expect(demoStore.get().records).toHaveLength(2);
  });

  it('não duplica: o segundo canal vê quem registrou primeiro', async () => {
    const user = userEvent.setup();
    renderRegistro('totem');
    await user.type(screen.getByLabelText(/digite o código/), codeOf('Ana Souza'));
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    // Tela pública: só primeiro nome e inicial.
    expect(result()).toHaveTextContent('Atraso registrado: Ana S.');
    await user.type(screen.getByLabelText(/digite o código/), codeOf('Ana Souza').toLowerCase());
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(result()).toHaveTextContent('Ana S. já foi registrado hoje');
    expect(result()).toHaveTextContent('Por Totem');
    await user.type(screen.getByLabelText(/digite o código/), 'EM-XXXXXX');
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(result()).toHaveTextContent('Carteirinha não reconhecida');
  });

  it('dentro da tolerância não conta como atraso', async () => {
    const user = userEvent.setup();
    act(() => demoStore.setClock({ ...demoStore.get().clock, simulada: '07:08' }));
    renderRegistro('professor');
    await user.click(screen.getByRole('button', { name: 'Marcar atraso de Bia Lima' }));
    expect(result()).toHaveTextContent('Bia Lima chegou no horário');
    expect(demoStore.get().records).toHaveLength(0);
  });

  it('coordenação envia avisos e justificar tira da fila', async () => {
    const user = userEvent.setup();
    renderRegistro('coordenacao');
    await user.type(screen.getByLabelText('Buscar aluno pelo nome'), 'ana');
    await user.click(screen.getByRole('button', { name: /Ana Souza/ }));
    await user.type(screen.getByLabelText('Buscar aluno pelo nome'), 'caio');
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
    await user.click(screen.getByRole('button', { name: 'Entrou no 2º horário' }));
    expect(screen.getByRole('heading', { name: 'Fila de avisos (0)' })).toBeInTheDocument();
    expect(demoStore.get().records.find((r) => r.aluno === 'Caio Reis')).toMatchObject({
      justificado: true,
      liberado: 'segunda',
      aviso: 'dispensado',
    });

    // Reincidentes: Ana tinha 2 na planilha + 1 hoje = 3 (limite padrão).
    const reinc = screen.getByRole('region', { name: /Reincidentes/ });
    expect(within(reinc).getByText('3 atrasos')).toBeInTheDocument();
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
    render(
      <ToastProvider>
        <DemoApp />
      </ToastProvider>,
    );
    expect(screen.getByRole('link', { name: /Hoje: 1 atraso registrado/ })).toHaveTextContent(
      '1 aviso pendente',
    );
    expect(screen.getByRole('link', { name: /Registrar atrasos/ })).toHaveAttribute(
      'href',
      '/demo/registro',
    );
  });
});
