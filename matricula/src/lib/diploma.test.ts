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
  longDate,
  nextRegistro,
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

  it('dados do aluno vêm da linha da planilha', () => {
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
      nacionalidade: 'BRASIL',
      rg_orgao: 'SDS-PE',
      cpf: '529.982.247-25',
      titulo: 'Técnico em Farmácia',
      conclusao_data: '31 de dezembro de 2028',
      ant_escola: 'COLÉGIO 2001',
      ant_cidade: 'OLINDA',
      ant_uf: 'PERNAMBUCO',
      ant_habilitacao: 'ENSINO FUNDAMENTAL',
      b1_total: '2880',
    });
    expect(f.lists.b1_nomes[0]).toBe('Biologia');
    expect(f.missing).toEqual([]);
    const sem = diplomaFill(answers, { sistec: '', registro: '', folha: '', livro: '', cpf: '' }, withDefaults({}, CONFIG.cursos));
    expect(sem.missing).toEqual(expect.arrayContaining(['código SISTEC', 'registro escolar', 'data de conclusão (aba Diploma)']));
  });

  it('cursos sem modelo vêm como rascunho para conferir; contas que não fecham avisam', () => {
    const cfg = withDefaults({}, CONFIG.cursos);
    expect(Object.keys(cfg.cursos)).toEqual(
      expect.arrayContaining(['Integrado · Farmácia', 'Integrado · Nutrição e Dietética', 'Subsequente · Enfermagem']),
    );
    expect(cfg.cursos['Integrado · Nutrição e Dietética'].revisado).toBe(false);
    expect(cfg.cursos['Integrado · Nutrição e Dietética'].blocos[0].total).toBe('2880');
    const warn = courseWarnings(cfg.cursos['Integrado · Farmácia']);
    expect(warn.some((w) => w.includes('somam 719'))).toBe(true);
  });

  it('preenche marcadores e repete parágrafos de lista', () => {
    const xml =
      '<w:body><w:p><w:r><w:t>Nome: {{nome}}</w:t></w:r></w:p>' +
      '<w:tc><w:p><w:pPr/><w:r><w:t>{{#lista}}</w:t></w:r></w:p></w:tc>' +
      '<w:p><w:r><w:t>{{#perfil}}</w:t></w:r></w:p><w:p><w:r><w:t>{{#vazia}}</w:t></w:r></w:p></w:body>';
    const out = fillTemplate(xml, { nome: 'A & B' }, { lista: ['x', 'y'], perfil: ['p1', 'p2'] });
    expect(out).toContain('Nome: A &amp; B');
    expect(out).toContain('<w:tc><w:p><w:pPr/><w:r><w:t>x</w:t></w:r></w:p><w:p><w:pPr/><w:r><w:t>y</w:t></w:r></w:p></w:tc>');
    expect(out).toContain('<w:p><w:r><w:t>p1</w:t></w:r></w:p><w:p></w:p><w:p><w:r><w:t>p2</w:t></w:r></w:p>');
    expect(out).not.toContain('{{');
  });

  it('gera o .docx a partir do modelo da escola, sem marcador sobrando', async () => {
    const { header, row } = sheetRow();
    const cfg = withDefaults({ conclusao: '31/12/2028' }, CONFIG.cursos);
    const fill = diplomaFill(
      answersFromRow(steps, header, row),
      { sistec: '49279/1', registro: '155', folha: '52', livro: '01', cpf: '' },
      cfg,
    );
    const docx = await buildDiplomaDocx(new Uint8Array(readFileSync('public/diploma-modelo.docx')), fill);
    const xml = strFromU8(unzipSync(docx)['word/document.xml']);
    expect(xml).not.toMatch(/\{\{/);
    expect(xml).toContain('ANA SOUZA LIMA');
    expect(xml).toContain('Química Analítica Aplicada e Técnicas Experimentais');
    if (process.env.DIPLOMA_OUT) writeFileSync(process.env.DIPLOMA_OUT, docx);
  });
});
