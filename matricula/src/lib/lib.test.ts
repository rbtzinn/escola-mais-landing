import { describe, expect, it, vi } from 'vitest';
import { CONFIG } from '@/config';
import { fetchCep, searchStreet } from './cep';
import { hideCpf, isValidCpf, maskCpf } from './cpf';
import { clearDraft, loadDraft, saveDraft } from './draft';
import { emailError, emailSuggestion } from './email';
import { clearCitiesCache, fetchCities } from './ibge';
import {
  ageAt,
  dateError,
  maskCep,
  maskDate,
  maskPhone,
  maskRg,
  parseDate,
  phoneError,
} from './masks';
import { cleanName, nameError } from './names';
import { toRow } from './row';
import {
  adulto,
  buildSteps,
  isStepVisible,
  isVisible,
  optionsOf,
  rendaOptions,
  type Values,
} from './schema';
import { blockedMessage, checkInicio, submitMatricula, warmUp } from './submit';
import { fieldError, firstInvalidStep, validateStep } from './validate';

const TODAY = new Date(2026, 10, 23);
const steps = buildSteps(CONFIG);
const step = (id: string) => steps.find((s) => s.id === id)!;
const json = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);

describe('CPF', () => {
  it('confere os dígitos verificadores', () => {
    for (const ok of ['529.982.247-25', '52998224725', '111.444.777-35'])
      expect(isValidCpf(ok)).toBe(true);
    for (const bad of ['529.982.247-24', '111.111.111-11', '123', '', '000.000.000-00'])
      expect(isValidCpf(bad)).toBe(false);
  });
  it('põe a máscara enquanto digita e esconde no protocolo', () => {
    expect(maskCpf('529')).toBe('529');
    expect(maskCpf('5299')).toBe('529.9');
    expect(maskCpf('5299822472599')).toBe('529.982.247-25');
    expect(hideCpf('52998224725')).toBe('***.982.247-**');
  });
});

describe('máscaras', () => {
  it('celular, fixo e DDD', () => {
    expect(maskPhone('81999990001')).toBe('(81) 9 9999-0001');
    expect(maskPhone('8133330001')).toBe('(81) 3333-0001');
    expect(phoneError('(81) 9 9999-0001', 'celular')).toBeNull();
    expect(phoneError('(81) 3333-0001', 'celular')).toMatch(/9 dígitos/);
    expect(phoneError('(81) 3333-0001')).toBeNull();
    expect(phoneError('(20) 9 9999-0001')).toMatch(/DDD não existe/);
    expect(phoneError('(81) 9999')).toMatch(/completo/);
  });
  it('CEP, data e RG', () => {
    expect(maskCep('50010000')).toBe('50010-000');
    expect(maskDate('15032010')).toBe('15/03/2010');
    expect(parseDate('31/02/2010')).toBeNull();
    expect(dateError('31/02/2010', TODAY)).toMatch(/não existe/);
    expect(dateError('01/01/2030', TODAY)).toMatch(/futuro/);
    expect(dateError('15/03/2010', TODAY)).toBeNull();
    expect(ageAt(new Date(2010, 2, 15), TODAY)).toBe(16);
    expect(maskRg('12.345.678-x')).toBe('12345678X');
  });
});

describe('nomes e e-mail', () => {
  it('arruma o nome e pede nome completo', () => {
    expect(cleanName('  maria   DA silva  ')).toBe('Maria da Silva');
    expect(cleanName("joão d'ávila-santos")).toBe("João D'Ávila-Santos");
    expect(nameError('Maria')).toMatch(/sobrenome/);
    expect(nameError('Maria 2 Silva')).toMatch(/letras/);
    expect(nameError('Maria da Silva')).toBeNull();
  });
  it('sugere o domínio certo', () => {
    expect(emailError('ana@gmail')).toMatch(/incompleto/);
    expect(emailSuggestion('ana@gmial.com')).toBe('ana@gmail.com');
    expect(emailSuggestion('ana@hotmal.com')).toBe('ana@hotmail.com');
    expect(emailSuggestion('ana@gmail.com')).toBeNull();
    expect(emailSuggestion('ana@escola.pe.gov.br')).toBeNull();
  });
});

describe('CEP e IBGE', () => {
  it('ViaCEP preenche; CEP inexistente; reserva da BrasilAPI', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockImplementationOnce(() =>
      json({
        cep: '50050-050',
        logradouro: 'Rua do Hospício',
        bairro: 'Boa Vista',
        localidade: 'Recife',
        uf: 'PE',
      }),
    );
    expect(await fetchCep('50050-050')).toEqual({
      status: 'ok',
      endereco: {
        cep: '50050-050',
        rua: 'Rua do Hospício',
        bairro: 'Boa Vista',
        cidade: 'Recife',
        uf: 'PE',
      },
    });
    f.mockImplementationOnce(() => json({ erro: 'true' }));
    expect(await fetchCep('00000000')).toEqual({ status: 'nao-encontrado' });
    f.mockImplementationOnce(() => Promise.reject(new Error('rede'))).mockImplementationOnce(() =>
      json({ cep: '50050050', street: 'Rua X', neighborhood: 'B', city: 'Recife', state: 'PE' }),
    );
    expect((await fetchCep('50050050')).status).toBe('ok');
    f.mockImplementationOnce(() => Promise.reject(new Error('rede'))).mockImplementationOnce(() =>
      Promise.reject(new Error('rede')),
    );
    expect(await fetchCep('50050050')).toEqual({ status: 'falha' });
    f.mockRestore();
  });
  it('busca pela rua e cidades por estado (PE já vem no site)', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    expect(await searchStreet('PE', 'Recife', 'Ru')).toEqual([]);
    f.mockImplementationOnce(() =>
      json([
        {
          cep: '50050-050',
          logradouro: 'Rua do Hospício',
          bairro: 'Boa Vista',
          localidade: 'Recife',
          uf: 'PE',
        },
      ]),
    );
    expect(await searchStreet('PE', 'Recife', 'Rua do Hosp')).toHaveLength(1);
    expect(f.mock.calls[0][0]).toBe('https://viacep.com.br/ws/PE/Recife/Rua%20do%20Hosp/json/');

    const pe = await fetchCities('PE');
    expect(pe).toHaveLength(185);
    expect(pe).toContain('Jaboatão dos Guararapes');

    clearCitiesCache();
    f.mockImplementationOnce(() => json([{ nome: 'Natal' }, { nome: 'Mossoró' }]));
    expect(await fetchCities('RN')).toEqual(['Mossoró', 'Natal']);
    expect(await fetchCities('RN')).toEqual(['Mossoró', 'Natal']); // cache
    f.mockImplementationOnce(() => Promise.reject(new Error('rede')));
    expect(await fetchCities('PB')).toBeNull();
    f.mockRestore();
  });
});

describe('etapas e validação', () => {
  it('mãe falecida: só o nome (vai para o diploma); responsável "Outra pessoa" pede os dados', () => {
    const nome = step('mae').fields.find((f) => f.id === 'mae_nome')!;
    const cpf = step('mae').fields.find((f) => f.id === 'mae_cpf')!;
    expect(isVisible(nome, { mae_situacao: 'Falecida' })).toBe(true);
    expect(isVisible(cpf, { mae_situacao: 'Falecida' })).toBe(false);
    expect(isVisible(nome, { mae_situacao: 'Viva' })).toBe(true);
    expect(isVisible(nome, { mae_situacao: 'Não consta na certidão' })).toBe(false);
    expect(Object.keys(validateStep(step('mae'), { mae_situacao: 'Falecida' }, TODAY))).toEqual(['mae_nome']);
    expect(Object.keys(validateStep(step('responsavel'), { resp_quem: 'Mãe' }, TODAY))).toEqual([]);
    expect(validateStep(step('responsavel'), { resp_quem: 'Outra pessoa' }, TODAY)).toHaveProperty(
      'resp_nome',
    );
  });
  it('RG da mãe e do pai: obrigatório para menores; gênero tem "Outro"', () => {
    const menor: Values = { aluno_nascimento: '10/01/2010', mae_situacao: 'Viva' };
    expect(validateStep(step('mae'), menor, TODAY)).toHaveProperty('mae_rg');
    expect(validateStep(step('mae'), { ...menor, mae_rg: '1234567' }, TODAY)).toHaveProperty('mae_rg_orgao');
    expect(validateStep(step('mae'), { ...menor, aluno_nascimento: '10/01/2000' }, TODAY)).not.toHaveProperty('mae_rg');
    const resp = validateStep(step('responsavel'), { ...menor, resp_quem: 'Outra pessoa' }, TODAY);
    expect(resp).not.toHaveProperty('resp_rg');
    expect(step('aluno').fields.find((f) => f.id === 'aluno_sexo')).toMatchObject({
      label: 'Gênero',
      options: ['Feminino', 'Masculino', 'Outro'],
    });
  });
  it('erros de CPF, data e "Outro"', () => {
    const docs = step('documentos');
    const cpf = step('identificacao').fields.find((f) => f.id === 'aluno_cpf')!;
    expect(fieldError(cpf, { aluno_cpf: '529.982.247-24' }, TODAY)).toMatch(/não existe/);
    const maeCpf = step('mae').fields.find((f) => f.id === 'mae_cpf')!;
    expect(
      fieldError(
        maeCpf,
        { mae_situacao: 'Viva', aluno_cpf: '52998224725', mae_cpf: '529.982.247-25' },
        TODAY,
      ),
    ).toMatch(/outra pessoa/);
    const exp = docs.fields.find((f) => f.id === 'aluno_rg_data')!;
    expect(
      fieldError(exp, { aluno_nascimento: '15/03/2010', aluno_rg_data: '01/01/2009' }, TODAY),
    ).toMatch(/antes do seu nascimento/);
    const nasc = step('identificacao').fields.find((f) => f.id === 'aluno_nascimento')!;
    expect(fieldError(nasc, { aluno_nascimento: '15/03/2024' }, TODAY)).toMatch(/2 anos/);
    const orgao = docs.fields.find((f) => f.id === 'aluno_rg_orgao')!;
    expect(fieldError(orgao, { aluno_rg_orgao: 'Outro' }, TODAY)).toMatch(/Outro/);
    expect(
      fieldError(orgao, { aluno_rg_orgao: 'Outro', aluno_rg_orgao_outro: 'SSP-BA' }, TODAY),
    ).toBeNull();
    expect(firstInvalidStep(steps, {}, TODAY)).toBe(0);
  });
  it('faixas de renda pelo salário do ano', () => {
    const r = rendaOptions(1518);
    expect(r[0]).toMatch(/Menos de 1 salário/);
    expect(r[1].replace(/\s/g, ' ')).toBe('1 salário (R$ 1.518)');
    expect(r).toHaveLength(12);
  });
});

describe('planilha, rascunho e envio', () => {
  it('a linha segue as colunas e esvazia campos escondidos', () => {
    const v: Values = {
      consentimento: 'sim',
      aluno_nome: 'Ana Souza',
      aluno_rg_orgao: 'Outro',
      aluno_rg_orgao_outro: 'SSP-BA',
      mae_situacao: 'Não consta na certidão',
      mae_nome: 'Não deveria ir',
      mora_com: ['Mãe', 'Outro'],
      mora_com_outro: 'Madrinha',
      'interesses:Teatro': 'Quero aprender',
    };
    const { columns, row } = toRow(steps, v, { 'Ano de ingresso': '2026' });
    const at = (c: string) => row[columns.indexOf(c)];
    expect(columns[0]).toBe('Ano de ingresso');
    expect(row[0]).toBe('2026');
    expect(columns.length).toBe(row.length);
    expect(at('Consentimento LGPD')).toBe('Sim');
    expect(at('Seu nome completo')).toBe('Ana Souza');
    expect(at('Órgão expedidor do RG')).toBe('Outro: SSP-BA');
    expect(at('Nome completo da mãe')).toBe('');
    expect(at('Com quem você mora?')).toBe('Mãe; Outro: Madrinha');
    expect(at('Interesse: Teatro')).toBe('Quero aprender');
    expect(new Set(columns).size).toBe(columns.length);
  });
  it('rascunho salva, volta e some', () => {
    saveDraft({ values: { aluno_nome: 'Ana' }, step: 3 });
    expect(loadDraft()).toEqual({ values: { aluno_nome: 'Ana' }, step: 3 });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
  it('envio: ok, CPF repetido, erro e sem configuração', async () => {
    const payload = { token: 't', cpf: '529.982.247-25', columns: ['a'], row: ['b'] };
    const ok = vi.fn(() =>
      json({ status: 'ok', protocolo: 'MAT-1', enviadoEm: '26/11/2026 10:00', proximos: 'Leve o RG.' }),
    );
    expect(await submitMatricula('https://x', payload, ok as unknown as typeof fetch)).toEqual({
      status: 'ok',
      protocolo: 'MAT-1',
      enviadoEm: '26/11/2026 10:00',
      proximos: 'Leve o RG.',
    });
    expect(
      JSON.parse((ok.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).cpf,
    ).toBe('52998224725');
    const many = vi.fn(() => json({ status: 'muitas_tentativas' }));
    expect(await submitMatricula('https://x', payload, many as unknown as typeof fetch)).toEqual({
      status: 'muitas_tentativas',
    });
    const down = vi.fn(() => Promise.reject(new Error('rede')));
    expect(
      (await submitMatricula('https://x', payload, down as unknown as typeof fetch)).status,
    ).toBe('erro');
    expect(await submitMatricula('', payload)).toEqual({ status: 'sem_configuracao' });
  });
  it('aquecimento: manda só um ping, sem dados, e ignora falhas', async () => {
    const ok = vi.fn(() => json({ status: 'ok' }));
    warmUp('https://x', ok as unknown as typeof fetch);
    expect(ok).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse((ok.mock.calls[0] as unknown as [string, RequestInit])[1].body as string),
    ).toEqual({ action: 'ping' });
    const down = vi.fn(() => Promise.reject(new Error('rede')));
    expect(() => warmUp('https://x', down as unknown as typeof fetch)).not.toThrow();
    const none = vi.fn();
    warmUp('', none as unknown as typeof fetch);
    expect(none).not.toHaveBeenCalled();
  });
  it('conferência do começo (período) e mensagens', async () => {
    const input = { token: 't', cpf: '529.982.247-25', nascimento: '15/03/2010' };
    const ok = vi.fn(() => json({ status: 'ok' }));
    expect(await checkInicio('https://x', input, ok as unknown as typeof fetch)).toEqual({
      status: 'ok',
    });
    const body = JSON.parse(
      (ok.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(body).toMatchObject({ action: 'check', cpf: '52998224725', nascimento: '15/03/2010' });
    const fora = vi.fn(() =>
      json({ status: 'fora_do_periodo', inicio: '01/02/2027', fim: '10/02/2027' }),
    );
    const r = await checkInicio('https://x', input, fora as unknown as typeof fetch);
    expect(r.status !== 'ok' && blockedMessage(r)).toBe(
      'As matrículas estão fechadas. O período é de 01/02/2027 a 10/02/2027.',
    );
    expect(await checkInicio('', input)).toEqual({ status: 'sem_configuracao' });
  });
});

describe('modalidade, curso e maioridade', () => {
  it('o curso vem da modalidade escolhida', () => {
    const curso = step('curso').fields.find((f) => f.id === 'curso')!;
    expect(optionsOf(curso, { modalidade: 'Integrado' })).toEqual([
      'Nutrição e Dietética',
      'Farmácia',
    ]);
    expect(optionsOf(curso, { modalidade: 'Subsequente' })).toEqual(['Farmácia', 'Enfermagem']);
    expect(
      fieldError(curso, { modalidade: 'Subsequente', curso: 'Nutrição e Dietética' }, TODAY),
    ).toBe('Escolha uma opção.');
  });
  it('maior de idade: sem responsável e pais só com o nome', () => {
    const v: Values = {
      aluno_nascimento: '10/01/2000',
      mae_situacao: 'Viva',
      mae_nome: 'Maria Souza',
    };
    expect(adulto(v)).toBe(true);
    expect(isStepVisible(step('responsavel'), v)).toBe(false);
    expect(validateStep(step('mae'), v, TODAY)).toEqual({});
    const menor: Values = { ...v, aluno_nascimento: '10/01/2010' };
    expect(isStepVisible(step('responsavel'), menor)).toBe(true);
    expect(validateStep(step('mae'), menor, TODAY)).toHaveProperty('mae_cpf');
  });
  it('Subsequente: etapa do ensino médio e idade até 70', () => {
    expect(isStepVisible(step('escola_anterior'), { modalidade: 'Integrado' })).toBe(false);
    expect(isStepVisible(step('escola_anterior'), { modalidade: 'Subsequente' })).toBe(true);
    const nasc = step('identificacao').fields.find((f) => f.id === 'aluno_nascimento')!;
    expect(
      fieldError(nasc, { modalidade: 'Integrado', aluno_nascimento: '10/01/1980' }, TODAY),
    ).toMatch(/46 anos/);
    expect(
      fieldError(nasc, { modalidade: 'Subsequente', aluno_nascimento: '10/01/1980' }, TODAY),
    ).toBeNull();
    expect(
      isVisible(
        step('escola_anterior').fields.find((f) => f.id === 'em_cidade')!,
        { em_uf: 'PE' },
      ),
    ).toBe(true);
  });
  it('Integrado: etapa do ensino fundamental (vai para o diploma)', () => {
    expect(isStepVisible(step('fundamental'), { modalidade: 'Integrado' })).toBe(true);
    expect(isStepVisible(step('fundamental'), { modalidade: 'Subsequente' })).toBe(false);
    expect(validateStep(step('fundamental'), { modalidade: 'Integrado' }, TODAY)).toHaveProperty('ef_escola');
    const { columns, row } = toRow(steps, {
      modalidade: 'Integrado',
      ef_escola: 'Colégio 2001',
      ef_uf: 'PE',
      ef_cidade: 'Olinda',
      ef_ano: '2025',
    });
    expect(row[columns.indexOf('Escola onde terminou o ensino fundamental')]).toBe('Colégio 2001');
    expect(row[columns.indexOf('Cidade da escola do fundamental')]).toBe('Olinda');
    expect(columns).toContain('Estado da escola'); // a do ensino médio continua com o mesmo nome
  });
  it('etapa escondida vai vazia para a planilha', () => {
    const { columns, row } = toRow(steps, {
      aluno_nascimento: '10/01/2000',
      resp_quem: 'Mãe',
      em_escola: 'EREM X',
      modalidade: 'Integrado',
    });
    expect(row[columns.indexOf('Quem é o responsável?')]).toBe('');
    expect(row[columns.indexOf('Escola onde terminou o ensino médio')]).toBe('');
  });
});
