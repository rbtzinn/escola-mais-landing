import {
  LEVEL_LABEL,
  type Level,
  headline,
  levelFor,
  rankClasses,
  riskShare,
  schoolLevel,
} from '@/lib/spreadsheet/insights';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';

const W = 1080;
const H = 1350;
const PAD = 80;

/** Lê as cores dos tokens do tema atual (claro ou escuro), para a imagem combinar com a tela. */
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const level: Record<Level, string> = {
    ok: v('--primary'),
    atencao: v('--accent'),
    critico: v('--danger'),
  };
  return {
    bg: v('--surface'),
    card: v('--bg'),
    border: v('--border'),
    text: v('--text'),
    muted: v('--text-muted'),
    level,
    font: getComputedStyle(document.body).fontFamily,
  };
}

/** Quebra o texto em linhas que cabem na largura. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Desenha o card de resumo (1080×1350, formato de post). Só números e turmas:
 * nenhum nome de aluno vai para a imagem compartilhada.
 */
export function drawSummary(canvas: HTMLCanvasElement, a: Analysis, date = new Date()) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  const c = palette();
  const level = schoolLevel(a);
  const { title, detail } = headline(a);
  const font = (size: number, weight = 700) => `${weight} ${size}px ${c.font}`;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = c.level[level];
  ctx.fillRect(0, 0, W, 24);

  let y = PAD + 40;
  ctx.fillStyle = c.muted;
  ctx.font = font(30, 600);
  ctx.fillText(`Resumo da escola · ${date.toLocaleDateString('pt-BR')}`, PAD, y);

  y += 70;
  ctx.fillStyle = c.level[level];
  ctx.beginPath();
  ctx.arc(PAD + 16, y - 12, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.text;
  ctx.font = font(36);
  ctx.fillText(
    `Situação: ${LEVEL_LABEL[level]} · ${formatNumber(riskShare(a.kpis.emRisco, a.kpis.alunos), 0)}% em risco`,
    PAD + 48,
    y,
  );

  y += 90;
  ctx.font = font(68, 800);
  for (const l of wrap(ctx, title, W - PAD * 2)) {
    ctx.fillText(l, PAD, y);
    y += 80;
  }
  ctx.font = font(38, 500);
  ctx.fillStyle = c.muted;
  for (const l of wrap(ctx, detail, W - PAD * 2)) {
    ctx.fillText(l, PAD, y);
    y += 50;
  }

  // Indicadores 2×2.
  y += 30;
  const kpis: [string, string][] = [
    ['Alunos', a.kpis.alunos.toLocaleString('pt-BR')],
    [
      'Frequência',
      a.kpis.frequenciaGeral === null ? '—' : `${formatNumber(a.kpis.frequenciaGeral)}%`,
    ],
    ['Média geral', a.kpis.mediaGeral === null ? '—' : formatNumber(a.kpis.mediaGeral)],
    ['Em risco', String(a.kpis.emRisco)],
  ];
  const cw = (W - PAD * 2 - 24) / 2;
  kpis.forEach(([label, value], i) => {
    const x = PAD + (i % 2) * (cw + 24);
    const top = y + Math.floor(i / 2) * 170;
    ctx.fillStyle = c.card;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, top, cw, 146, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = font(28, 600);
    ctx.fillText(label, x + 28, top + 50);
    ctx.fillStyle = c.text;
    ctx.font = font(56, 800);
    ctx.fillText(value, x + 28, top + 116);
  });
  y += 2 * 170 + 40;

  // Turmas mais críticas.
  ctx.fillStyle = c.text;
  ctx.font = font(34);
  ctx.fillText('Turmas que pedem atenção', PAD, y);
  y += 24;
  for (const t of rankClasses(a).slice(0, 3)) {
    y += 64;
    const pct = riskShare(t.emRisco, t.alunos);
    ctx.fillStyle = c.level[levelFor(pct)];
    ctx.beginPath();
    ctx.arc(PAD + 14, y - 12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.text;
    ctx.font = font(36);
    ctx.fillText(t.turma, PAD + 44, y);
    ctx.fillStyle = c.muted;
    ctx.font = font(32, 500);
    const freq = t.frequencia === null ? '' : ` · freq. ${formatNumber(t.frequencia, 0)}%`;
    ctx.fillText(`${formatNumber(pct, 0)}% em risco${freq}`, PAD + 220, y);
  }

  ctx.fillStyle = c.muted;
  ctx.font = font(26, 500);
  ctx.fillText('Escola+ · calculado no navegador, sem nomes de alunos', PAD, H - PAD + 20);
}

/** Gera o PNG e abre o compartilhar do celular; sem suporte, baixa o arquivo. */
export async function shareSummary(a: Analysis): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const canvas = document.createElement('canvas');
  drawSummary(canvas, a);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem.');
  const file = new File([blob], 'resumo-escola.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Resumo da escola' });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
