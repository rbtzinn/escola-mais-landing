import { ficha, type FichaSection } from './adminData';
import { toRow } from './row';
import type { Step, Values } from './schema';

/**
 * Comprovante de matrícula em PDF: cabeçalho da escola, dados do envio, a ficha completa
 * (todas as respostas, por etapa), os próximos passos que a escola escreveu no painel e linhas
 * de assinatura. O aluno baixa ao terminar; a secretaria reemite pela ficha no painel.
 */
export interface ComprovanteData {
  cabecalho: string[];
  ano: number;
  protocolo: string;
  enviadoEm: string;
  /** Linhas em destaque no topo (aluno, CPF, curso...). */
  destaque: { label: string; value: string }[];
  sections: FichaSection[];
  proximos: string;
  /** Logo em PNG (data URL), se der para carregar. */
  logo?: string;
}

/** Colunas internas da planilha que não vão para o comprovante do aluno. */
const INTERNAS = new Set([
  'Enviado em',
  'Protocolo',
  'CPF do aluno',
  'Lista de aprovados',
  'Consentimento LGPD',
]);

/** Seções da ficha a partir da linha da planilha (o mesmo para o formulário e o painel). */
export function comprovanteSections(steps: Step[], header: string[], row: string[]): FichaSection[] {
  return ficha(steps, header, row)
    .map((s) => ({ ...s, items: juntaGrade(s.items.filter((it) => !INTERNAS.has(it.label))) }))
    .filter((s) => s.items.length);
}

/** A grade de interesses ("Interesse: Teatro" = "Quero aprender"...) vira um item só, mais curto. */
function juntaGrade(items: FichaSection['items']): FichaSection['items'] {
  const grade = items.filter((it) => it.label.startsWith('Interesse: '));
  if (grade.length < 2) return items;
  const porResposta = new Map<string, string[]>();
  for (const it of grade) {
    const tema = it.label.slice('Interesse: '.length);
    porResposta.set(it.value, [...(porResposta.get(it.value) ?? []), tema]);
  }
  const junto = {
    label: 'Interesses',
    value: [...porResposta].map(([resp, temas]) => `${resp}: ${temas.join(', ')}`).join('. '),
  };
  const first = items.indexOf(grade[0]);
  const rest = items.filter((it) => !grade.includes(it));
  rest.splice(first, 0, junto);
  return rest;
}

const get = (sections: FichaSection[], label: string) =>
  sections.flatMap((s) => s.items).find((it) => it.label === label)?.value ?? '';

/** Destaques do topo: aluno, CPF, nascimento, curso. */
export function destaques(sections: FichaSection[]): { label: string; value: string }[] {
  const curso = [get(sections, 'Modalidade'), get(sections, 'Curso')].filter(Boolean).join(' · ');
  return [
    { label: 'Aluno(a)', value: get(sections, 'Seu nome completo') },
    { label: 'CPF', value: get(sections, 'Seu CPF') },
    { label: 'Nascimento', value: get(sections, 'Data de nascimento') },
    { label: 'Curso', value: curso },
    { label: 'Ingresso', value: get(sections, 'Ano de ingresso') },
  ].filter((d) => d.value);
}

/** O que já está no quadro do topo não se repete na ficha (economiza uma página). */
const NO_TOPO = new Set(['Ano de ingresso', 'Seu CPF', 'Data de nascimento', 'Modalidade', 'Curso']);

function montar(sections: FichaSection[], base: Omit<ComprovanteData, 'destaque' | 'sections'>): ComprovanteData {
  const resto = sections
    .map((s) => ({ ...s, items: s.items.filter((it) => !NO_TOPO.has(it.label)) }))
    .filter((s) => s.items.length);
  return { ...base, sections: resto, destaque: destaques(sections) };
}

/** Dados do comprovante a partir das respostas do formulário (tela final do aluno). */
export function fromValues(
  steps: Step[],
  values: Values,
  base: Omit<ComprovanteData, 'destaque' | 'sections'>,
): ComprovanteData {
  const { columns, row } = toRow(steps, values, { 'Ano de ingresso': String(base.ano) });
  return montar(comprovanteSections(steps, columns, row), base);
}

/** Dados do comprovante a partir da linha da planilha (painel). */
export function fromRow(
  steps: Step[],
  header: string[],
  row: string[],
  base: Omit<ComprovanteData, 'destaque' | 'sections'>,
): ComprovanteData {
  return montar(comprovanteSections(steps, header, row), base);
}

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const INK: [number, number, number] = [20, 26, 60];
const BLUE: [number, number, number] = [0, 50, 168];
const MUTED: [number, number, number] = [100, 104, 125];

/** O PDF (A4, retrato). jsPDF é carregado só aqui, quando alguém pede o comprovante. */
export async function buildComprovantePdf(d: ComprovanteData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = PAGE_W - 2 * MARGIN;
  let y = MARGIN;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - MARGIN - 8) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const text = (s: string, x: number, size: number, opts: { bold?: boolean; color?: [number, number, number]; maxW?: number; align?: 'left' | 'center' } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? INK));
    const lines = doc.splitTextToSize(s, opts.maxW ?? width) as string[];
    const lh = size * 0.42;
    ensure(lines.length * lh);
    doc.text(lines, opts.align === 'center' ? PAGE_W / 2 : x, y + lh * 0.8, { align: opts.align ?? 'left' });
    y += lines.length * lh;
    return lines.length * lh;
  };

  // Cabeçalho da escola.
  if (d.logo) {
    try {
      const p = doc.getImageProperties(d.logo);
      const w = 26;
      doc.addImage(d.logo, 'PNG', MARGIN, y, w, (w * p.height) / p.width);
    } catch {
      /* sem logo: segue só com o texto */
    }
  }
  const [nome, ...resto] = d.cabecalho;
  text(nome ?? '', 0, 12, { bold: true, align: 'center' });
  for (const l of resto) text(l, 0, 8, { color: MUTED, align: 'center', maxW: width - 60 });
  y += 4;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;
  text(`COMPROVANTE DE MATRÍCULA ${d.ano}`, 0, 15, { bold: true, color: BLUE, align: 'center' });
  y += 3;

  // Protocolo e destaques num quadro.
  const boxTop = y;
  y += 3;
  text(`Protocolo: ${d.protocolo}`, MARGIN + 4, 11, { bold: true });
  text(`Enviado em: ${d.enviadoEm}`, MARGIN + 4, 9, { color: MUTED });
  y += 1;
  for (const it of d.destaque) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const before = y;
    doc.text(`${it.label}:`, MARGIN + 4, y + 3.4);
    y = before;
    text(it.value, MARGIN + 32, 10, { maxW: width - 36 });
  }
  y += 3;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, boxTop, width, y - boxTop, 2, 2);
  y += 6;

  // Ficha completa: rótulo pequeno em cima, resposta embaixo, em três colunas (respostas
  // longas ocupam a linha toda).
  const GAP = 5;
  const colW = (width - 2 * GAP) / 3;
  for (const s of d.sections) {
    ensure(12);
    doc.setFillColor(238, 241, 250);
    doc.rect(MARGIN, y, width, 5.5, 'F');
    y += 0.5;
    text(s.title.toUpperCase(), MARGIN + 2, 8.5, { bold: true, color: BLUE });
    y += 1.8;
    let col = 0;
    let rowH = 0;
    const flush = () => {
      if (col > 0) y += rowH;
      col = 0;
      rowH = 0;
    };
    for (const it of s.items) {
      doc.setFontSize(9);
      const long = doc.getTextWidth(it.value) > colW * 1.6 || doc.getTextWidth(it.label) * (7 / 9) > colW * 1.5;
      const span = long ? 3 : 1;
      if (col + span > 3) flush();
      const w = span === 3 ? width : colW;
      doc.setFontSize(7);
      const label = doc.splitTextToSize(it.label, w) as string[];
      doc.setFontSize(9);
      const value = doc.splitTextToSize(it.value, w) as string[];
      const h = label.length * 2.6 + value.length * 3.7 + 1.8;
      if (col === 0) ensure(h);
      const x = MARGIN + col * (colW + GAP);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(label, x, y + 2.3);
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(value, x, y + label.length * 2.6 + 2.9);
      rowH = Math.max(rowH, h);
      col += span;
      if (col >= 3) flush();
    }
    flush();
    y += 2;
  }

  // Próximos passos.
  if (d.proximos.trim()) {
    y += 2;
    ensure(18);
    const top = y;
    y += 3;
    text('PRÓXIMOS PASSOS', MARGIN + 4, 10, { bold: true, color: BLUE });
    y += 1;
    text(d.proximos.trim(), MARGIN + 4, 9.5, { maxW: width - 8 });
    y += 3;
    doc.setDrawColor(...BLUE);
    doc.roundedRect(MARGIN, top, width, y - top, 2, 2);
    y += 6;
  }

  // Assinaturas.
  ensure(24);
  y += 14;
  const sigW = (width - 16) / 2;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  [
    'Aluno(a) ou responsável',
    'Secretaria escolar (carimbo e assinatura)',
  ].forEach((label, j) => {
    const x = MARGIN + j * (sigW + 16);
    doc.line(x, y, x + sigW, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label, x + sigW / 2, y + 4, { align: 'center' });
  });

  // Rodapé com o protocolo em todas as páginas.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `Comprovante de envio da matrícula · Protocolo ${d.protocolo} · página ${p} de ${pages}`,
      PAGE_W / 2,
      PAGE_H - 8,
      { align: 'center' },
    );
  }
  return doc.output('blob');
}

/** Logo do site em PNG (o jsPDF não lê webp). Sem navegador ou sem logo: undefined. */
export async function logoPng(src: string): Promise<string | undefined> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

/** Gera e entrega o PDF para salvar ("Comprovante MAT-2026-0001.pdf"). */
export async function downloadComprovante(d: ComprovanteData): Promise<void> {
  const blob = await buildComprovantePdf(d);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Comprovante ${d.protocolo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
