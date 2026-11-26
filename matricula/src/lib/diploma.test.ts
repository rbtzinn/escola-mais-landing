import { readFileSync, writeFileSync } from 'node:fs';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '@/config';
import { fullValues } from '@/test/fixture';
import {
  answersFromRow,
  buildDiplomaDocx,
  diplomaFileName,
  diplomaFill,
  fillTemplate,
  folhaOf,
  formatModulos,
  longDate,
  nextRegistro,
  nextSemestre,
  parseModulos,
  rgIssuer,
} from './diploma';
import { courseWarnings, withDefaults } from './diplomaConfig';
import { toRow } from './row';
import { buildSteps } from './schema';

const steps = buildSteps(CONFIG);

function sheetRow() {
  const v = { ...fullValues(), curso: 'Farmácia', pai_situacao: 'Falecido', pai_nome: 'José Lima' };
  const { columns, row } = toRow(steps, v, { 'Ano de ingresso': '2026' });
  return { header: columns, row };
}

describe('diploma', () => {
  it('datas, órgão do RG e numeração do livro', () => {
    expect(longDate('31/12/2025')).toBe('31 de dezembro de 2025');
    expect(longDate('31/02/2025')).toBe('');
    expect(rgIssuer('SDS-PE', 'PE')).toBe('SDS-PE');
    expect(rgIssuer('PC', 'pe')).toBe('PC-PE');
    expect(rgIssuer('Outro: SSP-BA', 'BA')).toBe('SSP-BA');
    expect(nextRegistro([], '155')).toBe(155);
    expect(nextRegistro(['155', '156', ''], '1')).toBe(157);
    expect(folhaOf(155, '3')).toBe('52');
    expect(folhaOf(156, '3')).toBe('52');
    expect(folhaOf(157, '3')).toBe('53');
    expect(folhaOf('', '3')).toBe('');
    expect(diplomaFileName('ANA / SOUZA')).toBe('Diploma - ANA  SOUZA.docx');
  });

  it('dados do aluno vêm da linha da planilha (formato padronizado)', () => {
    const { header, row } = sheetRow();
    const answers = answersFromRow(steps, header, row);
    expect(answers.aluno_nome).toBe('Ana Souza Lima');
    expect(answers.nasc_cidade).toBe('Recife');
    const cfg = withDefaults({ conclusao: '31/12/2028' }, CONFIG.cursos);
    const f = diplomaFill(answers, { sistec: '123/ABC', registro: '155', folha: '52', livro: '01', cpf: '52998224725' }, cfg);
    expect(f.values).toMatchObject({
      nome: 'ANA SOUZA LIMA',
      filiacao: 'JOSÉ LIMA e MARIA SOUZA LIMA',
      naturalidade: 'RECIFE-PERNAMBUCO',
      nacionalidade: 'BRASILEIRA',
      rg_orgao: 'SDS-PE',
      cpf: '529.982.247-25',
      titulo: 'Técnico em Farmácia',
      conclusao_data: '31 de dezembro de 2028', // configuração antiga, com uma data só
      ant_escola: 'COLÉGIO 2001',
      ant_cidade: 'OLINDA',
      ant_uf: 'PERNAMBUCO',
      ant_habilitacao: 'ENSINO FUNDAMENTAL',
      b1_total: '2880',
    });
    expect(f.arquivo).toBe('/diploma-integrado.docx');
    expect(f.lists.b1_nomes[0]).toBe('Biologia');
    expect(f.missing).toEqual([]);
    const sem = diplomaFill(answers, { sistec: '', registro: '', folha: '', livro: '', cpf: '' }, withDefaults({}, CONFIG.cursos));
    expect(sem.missing).toEqual(expect.arrayContaining(['código SISTEC', 'registro escolar']));
    expect(sem.pendencias.find((p) => p.label === 'código SISTEC')).toEqual({
      label: 'código SISTEC',
      origem: 'escola',
      campo: 'dip-sistec',
    });
    const enf = diplomaFill(
      { ...answers, modalidade: 'Subsequente', curso: 'Enfermagem' },
      { sistec: '', registro: '', folha: '', livro: '', cpf: '', modulos: [{ semestre: '2024.1', freq: '90' }] },
      cfg,
    );
    expect(enf.pendencias.find((p) => p.label.startsWith('semestre'))).toEqual({
      label: 'semestre e frequência (módulos II, III e IV)',
      origem: 'escola',
      campo: 'dip-sem-1',
    });
    // Sem data salva, o Integrado conclui em 31/12 do ano corrente; o aluno pode ter outra.
    expect(withDefaults({}, CONFIG.cursos, new Date(2027, 5, 1)).cursos['Integrado · Farmácia'].conclusao).toBe('31/12/2027');
    const outra = diplomaFill(answers, { sistec: '', registro: '', folha: '', livro: '', cpf: '', conclusao: '15/01/2029' }, cfg);
    expect(outra.values.conclusao_data).toBe('15 de janeiro de 2029');
  });

  it('cada curso tem o seu modelo; contas que não fecham avisam', () => {
    const cfg = withDefaults({}, CONFIG.cursos);
    expect(Object.fromEntries(Object.entries(cfg.cursos).map(([k, c]) => [k, [c.modelo, c.revisado]]))).toEqual({
      'Integrado · Nutrição e Dietética': ['integrado', true],
      'Integrado · Farmácia': ['integrado', true],
      'Subsequente · Farmácia': ['farmacia-subsequente', true],
      'Subsequente · Enfermagem': ['enfermagem-subsequente', true],
    });
    expect(courseWarnings(cfg.cursos['Integrado · Nutrição e Dietética'])).toEqual([]);
    expect(courseWarnings(cfg.cursos['Subsequente · Farmácia'])).toEqual([]);
    const warn = courseWarnings(cfg.cursos['Integrado · Farmácia']);
    expect(warn.some((w) => w.includes('somam 719'))).toBe(true);
    // Curso novo, sem modelo: rascunho para conferir.
    const novo = withDefaults({}, { ...CONFIG.cursos, Subsequente: ['Radiologia'] });
    expect(novo.cursos['Subsequente · Radiologia']).toMatchObject({ revisado: false, modelo: 'farmacia-subsequente' });
    expect(novo.cursos['Subsequente · Radiologia'].blocos).toHaveLength(3);
  });

  it('semestres e frequências: planilha ↔ campos', () => {
    const list = parseModulos('2024.1 = 87,50; 2024.2 = 87,33; =; 2025.2 = 87,00');
    expect(list).toEqual([
      { semestre: '2024.1', freq: '87,50' },
      { semestre: '2024.2', freq: '87,33' },
      { semestre: '', freq: '' },
      { semestre: '2025.2', freq: '87,00' },
    ]);
    expect(formatModulos(list)).toBe('2024.1 = 87,50; 2024.2 = 87,33;  = ; 2025.2 = 87,00');
    expect(formatModulos([{ semestre: '2024.1', freq: '90' }, { semestre: '', freq: '' }])).toBe('2024.1 = 90');
    expect(nextSemestre('2024.1')).toBe('2024.2');
    expect(nextSemestre('2024.2')).toBe('2025.1');
    expect(nextSemestre('x')).toBe('');
  });

  it('preenche marcadores e repete parágrafos de lista', () => {
    const xml =
      '<w:body><w:p><w:r><w:t>Nome: {{nome}}</w:t></w:r></w:p>' +
      '<w:tc><w:p><w:pPr/><w:r><w:t>{{#lista}}</w:t></w:r></w:p></w:tc>' +
      '<w:p><w:r><w:t>{{#perfil}}</w:t></w:r></w:p><w:p><w:r><w:t>{{#vazia}}</w:t></w:r></w:p></w:body>';
    const out = fillTemplate(xml, { nome: 'A & B' }, { lista: ['x', 'y'], perfil: ['p1', 'p2'] }, ['perfil']);
    expect(out).toContain('Nome: A &amp; B');
    expect(out).toContain('<w:tc><w:p><w:pPr/><w:r><w:t>x</w:t></w:r></w:p><w:p><w:pPr/><w:r><w:t>y</w:t></w:r></w:p></w:tc>');
    expect(out).toContain('<w:p><w:r><w:t>p1</w:t></w:r></w:p><w:p></w:p><w:p><w:r><w:t>p2</w:t></w:r></w:p>');
    expect(out).not.toContain('{{');
  });

  it.each([
    ['Integrado', 'Farmácia', 'Química Analítica Aplicada e Técnicas Experimentais'],
    ['Integrado', 'Nutrição e Dietética', 'Nutrição Materno-Infantil'],
    ['Subsequente', 'Farmácia', 'Semiologia Farmacêutica'],
    ['Subsequente', 'Enfermagem', 'Estágio em Enfermagem em Emergência e Urgência'],
  ])('gera o .docx de %s · %s pelo modelo da escola, sem marcador sobrando', async (modalidade, curso, disciplina) => {
    const v = {
      ...fullValues(),
      modalidade,
      curso,
      em_escola: 'EREM João Pessoa Guerra',
      em_tipo: 'Pública',
      em_uf: 'PE',
      em_cidade: 'Igarassu',
      em_ano: '2023',
    };
    const { columns, row } = toRow(steps, v, {});
    const cfg = withDefaults({}, CONFIG.cursos);
    const fill = diplomaFill(
      answersFromRow(steps, columns, row),
      {
        sistec: '49279/1',
        registro: '155',
        folha: '52',
        livro: '01',
        cpf: '',
        modulos: [
          { semestre: '2024.1', freq: '87,50' },
          { semestre: '2024.2', freq: '87,33' },
          { semestre: '2025.1', freq: '82,88' },
          { semestre: '2025.2', freq: '87,00' },
        ],
      },
      cfg,
    );
    expect(fill.missing).toEqual([]);
    const docx = await buildDiplomaDocx(new Uint8Array(readFileSync(`public${fill.arquivo}`)), fill);
    const xml = strFromU8(unzipSync(docx)['word/document.xml']);
    expect(xml).not.toMatch(/\{\{/);
    expect(xml).toContain('ANA SOUZA LIMA');
    expect(xml).toContain(disciplina);
    expect(xml).toContain(modalidade === 'Integrado' ? 'ENSINO FUNDAMENTAL' : 'EREM JOÃO PESSOA GUERRA');
    if (curso === 'Enfermagem') expect(xml).toContain('82,88');
    if (process.env.DIPLOMA_OUT) writeFileSync(`${process.env.DIPLOMA_OUT}/${modalidade}-${curso}.docx`, docx);
  });
});
