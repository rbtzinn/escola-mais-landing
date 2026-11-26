import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '@/config';
import { fullValues } from '@/test/fixture';
import { buildComprovantePdf, comprovanteSections, fromRow, fromValues } from './comprovante';
import { toRow } from './row';
import { buildSteps } from './schema';

const steps = buildSteps(CONFIG);
const base = {
  cabecalho: CONFIG.cabecalho,
  ano: 2026,
  protocolo: 'MAT-2026-0007',
  enviadoEm: '26/11/2026 10:00',
  proximos: 'Entregue na secretaria, até 10/02: RG, CPF e comprovante de residência.',
};

describe('comprovante de matrícula', () => {
  it('ficha completa sem as colunas internas da planilha', () => {
    const { columns, row } = toRow(steps, fullValues(), { 'Ano de ingresso': '2026' });
    const header = ['Enviado em', 'Protocolo', 'Lista de aprovados', 'Código SISTEC', ...columns];
    const linha = ['26/11/2026 10:00', 'MAT-2026-0007', 'Não', '49279/1', ...row];
    const sections = comprovanteSections(steps, header, linha);
    const labels = sections.flatMap((s) => s.items.map((it) => it.label));
    expect(labels).toContain('Seu nome completo');
    expect(labels).toContain('Ano de ingresso');
    expect(labels).not.toContain('Lista de aprovados');
    expect(labels).not.toContain('Código SISTEC');
    expect(labels).not.toContain('Consentimento LGPD');
    const d = fromRow(steps, header, linha, base);
    expect(d.destaque).toEqual([
      { label: 'Aluno(a)', value: 'Ana Souza Lima' },
      { label: 'CPF', value: '529.982.247-25' },
      { label: 'Nascimento', value: '15/03/2010' },
      { label: 'Curso', value: 'Integrado · Nutrição e Dietética' },
      { label: 'Ingresso', value: '2026' },
    ]);
    // O que está no topo não se repete na ficha.
    expect(d.sections.flatMap((s) => s.items.map((it) => it.label))).not.toContain('Seu CPF');
    // Formulário e painel montam a mesma ficha.
    expect(fromValues(steps, fullValues(), base).sections).toEqual(d.sections);
  });

  it('gera o PDF com cabeçalho, protocolo e próximos passos', async () => {
    const d = fromValues(steps, fullValues(), base);
    const blob = await buildComprovantePdf(d);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text.startsWith('%PDF')).toBe(true);
    expect(text).toContain('MAT-2026-0007');
    expect(text).toContain('PRÓXIMOS PASSOS');
    expect(text).toContain('Ana Souza Lima');
    if (process.env.COMPROVANTE_OUT) writeFileSync(process.env.COMPROVANTE_OUT, bytes);
  });
});
