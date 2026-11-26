import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '@/config';
import { saveDraft } from '@/lib/draft';
import { buildSteps } from '@/lib/schema';
import * as submitModule from '@/lib/submit';
import { fullValues } from '@/test/fixture';
import App from './App';

const STEPS = buildSteps(CONFIG);
const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const json = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('sem rede nos testes')));
});
afterEach(() => vi.restoreAllMocks());

const continuar = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /^Continuar|^Revisar|^Voltar para a revisão/ }));

describe('formulário de matrícula', () => {
  it('trocar a modalidade mostra só os cursos dela e apaga o curso anterior', async () => {
    const user = userEvent.setup();
    saveDraft({ values: { consentimento: 'sim' }, step: at('curso') });
    render(<App />);
    expect(screen.queryByText('Enfermagem')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Integrado'));
    await user.click(screen.getByLabelText('Farmácia'));
    expect(screen.queryByLabelText('Enfermagem')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Subsequente'));
    expect(screen.getByLabelText('Enfermagem')).toBeInTheDocument();
    expect(screen.getByLabelText('Farmácia')).not.toBeChecked();
  });

  it('não avança sem o consentimento e mostra o erro', async () => {
    const user = userEvent.setup();
    render(<App />);
    await continuar(user);
    expect(screen.getByRole('alert')).toHaveTextContent('Falta corrigir 1 campo');
    expect(screen.getByText('Marque para continuar.')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    await continuar(user);
    expect(screen.getByRole('heading', { name: 'Confirme quem é você' })).toBeInTheDocument();
  });

  it('CPF inválido não passa; com máscara e válido, passa', async () => {
    const user = userEvent.setup();
    saveDraft({ values: fullValues(), step: at('identificacao') });
    render(<App />);
    const cpf = screen.getByLabelText('Seu CPF');
    await user.clear(cpf);
    await user.type(cpf, '52998224724');
    expect(cpf).toHaveValue('529.982.247-24');
    await continuar(user);
    expect(screen.getByText('Esse CPF não existe. Confira os números.')).toBeInTheDocument();
    expect(cpf).toHaveFocus();
    await user.clear(cpf);
    await user.type(cpf, '52998224725');
    await continuar(user);
    expect(await screen.findByRole('heading', { name: 'Seu curso' })).toBeInTheDocument();
  });

  it('fora do período não passa da identificação; mudar o CPF apaga o aviso', async () => {
    const user = userEvent.setup();
    saveDraft({ values: fullValues(), step: at('identificacao') });
    const check = vi
      .spyOn(submitModule, 'checkInicio')
      .mockResolvedValue({ status: 'fora_do_periodo', inicio: '01/02/2027', fim: '10/02/2027' });
    render(<App />);
    await continuar(user);
    expect(await screen.findByText(/As matrículas estão fechadas/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Confirme quem é você' })).toBeInTheDocument();
    expect(check).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ nascimento: '15/03/2010' }));
    await user.type(screen.getByLabelText('Seu CPF'), '1');
    expect(screen.queryByText(/As matrículas estão fechadas/)).not.toBeInTheDocument();
  });

  it('matrícula aberta: todos os cursos aparecem e não confere de novo', async () => {
    const user = userEvent.setup();
    saveDraft({ values: { ...fullValues(), modalidade: '', curso: '' }, step: at('identificacao') });
    const check = vi.spyOn(submitModule, 'checkInicio').mockResolvedValue({ status: 'ok' });
    render(<App />);
    await continuar(user);
    expect(await screen.findByRole('heading', { name: 'Seu curso' })).toBeInTheDocument();
    expect(screen.getByLabelText('Integrado')).toBeInTheDocument();
    expect(screen.getByLabelText('Subsequente')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Voltar/ }));
    await continuar(user);
    expect(await screen.findByRole('heading', { name: 'Seu curso' })).toBeInTheDocument();
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('o CEP preenche o endereço', async () => {
    const user = userEvent.setup();
    const v = fullValues();
    for (const k of ['end_cep', 'end_rua', 'end_bairro', 'end_uf', 'end_cidade']) delete v[k];
    saveDraft({ values: v, step: at('contato') });
    vi.mocked(fetch).mockImplementation(() =>
      json({ cep: '50050-050', logradouro: 'Rua do Hospício', bairro: 'Boa Vista', localidade: 'Recife', uf: 'PE' }),
    );
    render(<App />);
    await user.type(screen.getByLabelText('CEP'), '50050050');
    expect(await screen.findByText(/Endereço encontrado/)).toBeInTheDocument();
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua do Hospício');
    expect(screen.getByLabelText('Bairro')).toHaveValue('Boa Vista');
  });

  it('mãe falecida pede só o nome', async () => {
    const user = userEvent.setup();
    saveDraft({ values: { ...fullValues(), mae_situacao: '' }, step: at('mae') });
    render(<App />);
    await user.click(screen.getByLabelText('Viva'));
    expect(screen.getByLabelText('Nome completo da mãe')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF da mãe')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Falecida'));
    expect(screen.getByLabelText('Nome completo da mãe')).toBeInTheDocument();
    expect(screen.queryByLabelText('CPF da mãe')).not.toBeInTheDocument();
  });

  it('cidades vêm do estado escolhido (PE já vem no site)', async () => {
    const user = userEvent.setup();
    saveDraft({ values: { ...fullValues(), nasc_uf: '', nasc_cidade: '' }, step: at('nascimento') });
    render(<App />);
    expect(screen.queryByRole('combobox', { name: 'Cidade' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Estado' }));
    await user.type(screen.getByRole('combobox', { name: 'Estado' }), 'Pernam');
    await user.click(screen.getByRole('option', { name: 'Pernambuco (PE)' }));
    const cidade = await screen.findByRole('combobox', { name: 'Cidade' });
    await user.click(cidade);
    await user.type(cidade, 'jaboat');
    expect(screen.getByRole('option', { name: 'Jaboatão dos Guararapes' })).toBeInTheDocument();
  });

  it('revisão mostra os dados; recusa avisa e mantém o rascunho; sucesso mostra o protocolo', async () => {
    const user = userEvent.setup();
    saveDraft({ values: fullValues(), step: STEPS.length - 1 });
    const send = vi.spyOn(submitModule, 'submitMatricula');
    send.mockResolvedValueOnce({ status: 'muitas_tentativas' });
    render(<App />);
    await continuar(user);
    expect(screen.getByRole('heading', { name: 'Confira antes de enviar' })).toBeInTheDocument();
    const docs = screen.getByRole('heading', { name: 'Confirme quem é você' }).closest('section')!;
    expect(within(docs).getByText('529.982.247-25')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Enviar matrícula/ }));
    expect(await screen.findByText(/Muitas tentativas agora/)).toBeInTheDocument();
    expect(localStorage.getItem('matricula:rascunho')).toContain('529.982.247-25');

    send.mockResolvedValueOnce({
      status: 'ok',
      protocolo: 'MAT-2026-0001',
      enviadoEm: '26/11/2026 10:00',
      proximos: 'Leve o RG na secretaria.',
    });
    await user.click(screen.getByRole('button', { name: /Enviar matrícula/ }));
    expect(await screen.findByRole('heading', { name: 'Matrícula enviada!' })).toBeInTheDocument();
    expect(screen.getByText('MAT-2026-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Baixar comprovante (PDF)' })).toBeInTheDocument();
    expect(screen.getByText(/\*\*\*\.982\.247-\*\*/)).toBeInTheDocument();
    await act(async () => {});
    expect(localStorage.getItem('matricula:rascunho')).toBeNull();
    const payload = send.mock.calls[1][1];
    expect(payload.columns.length).toBe(payload.row.length);
  });

  it('"Editar" na revisão volta para a etapa e depois para a revisão', async () => {
    const user = userEvent.setup();
    saveDraft({ values: fullValues(), step: STEPS.length - 1 });
    render(<App />);
    await continuar(user);
    await user.click(screen.getByRole('button', { name: 'Editar Sobre você' }));
    expect(screen.getByRole('heading', { name: 'Sobre você' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Voltar para a revisão/ }));
    expect(screen.getByRole('heading', { name: 'Confira antes de enviar' })).toBeInTheDocument();
  });
});
