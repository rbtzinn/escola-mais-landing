import { parseNumber } from '@/lib/spreadsheet/numbers';
import type { RawTable } from '@/lib/spreadsheet/types';
import { normalizeText } from '@/lib/text';

/** Uma aula da grade semanal. `dia`: 1 = segunda ... 5 = sexta. `aula`: 1 a 5. */
export interface Aula {
  turma: string;
  dia: number;
  aula: number;
  professor: string;
  disciplina: string;
}

/** Horários das aulas (intervalo das 9h30 às 9h50). */
export const AULAS = [
  { n: 1, inicio: '7h00', fim: '7h50' },
  { n: 2, inicio: '7h50', fim: '8h40' },
  { n: 3, inicio: '8h40', fim: '9h30' },
  { n: 4, inicio: '9h50', fim: '10h40' },
  { n: 5, inicio: '10h40', fim: '11h30' },
] as const;

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;

/** Dia da semana da grade (1 a 5). Sábado e domingo usam a segunda, para a demo funcionar sempre. */
export function weekdayFor(d: Date): number {
  const w = d.getDay();
  return w >= 1 && w <= 5 ? w : 1;
}

const byTurma = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true });

/** Professores da grade, em ordem alfabética. */
export const teachersOf = (grade: Aula[]) =>
  [...new Set(grade.map((a) => a.professor))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

// ---------- Grade de exemplo ----------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Aulas por semana de cada disciplina (soma 25 = 5 dias × 5 aulas). */
const CARGA: [string, number][] = [
  ['Português', 5],
  ['Matemática', 5],
  ['Ciências', 3],
  ['História', 3],
  ['Geografia', 3],
  ['Inglês', 2],
  ['Artes', 2],
  ['Ed. Física', 2],
];
const NOMES = [
  'Marta',
  'Paulo',
  'Rita',
  'Jonas',
  'Célia',
  'Bruno',
  'Lia',
  'Davi',
  'Nara',
  'Igor',
  'Sônia',
  'Caio',
  'Vera',
  'Hugo',
  'Elis',
  'Rui',
];
const MAX_POR_PROF = 15;

/** Quem dá cada disciplina em cada turma: professores repartem as turmas (até 15 aulas por semana). */
function assignTeachers(turmas: string[]): Map<string, string> {
  const out = new Map<string, string>();
  let nome = 0;
  for (const [disc, carga] of CARGA) {
    const porProf = Math.max(1, Math.floor(MAX_POR_PROF / carga));
    turmas.forEach((t, i) => {
      if (i % porProf === 0) nome++;
      out.set(`${disc}|${t}`, `Prof. ${NOMES[(nome - 1) % NOMES.length]} (${disc})`);
    });
  }
  return out;
}

/**
 * Grade semanal da escola de exemplo, sem professor em duas turmas no mesmo horário.
 * Montada de forma gulosa com sementes fixas: sai sempre igual.
 */
export function sampleTimetable(turmasIn: string[]): Aula[] {
  const turmas = [...turmasIn].sort(byTurma);
  const prof = assignTeachers(turmas);
  for (let seed = 1; seed < 500; seed++) {
    const rnd = mulberry32(seed);
    const restante = new Map(turmas.map((t) => [t, new Map(CARGA)]));
    const aulas: Aula[] = [];
    let ok = true;
    for (let dia = 1; dia <= 5 && ok; dia++) {
      const noDia = new Map(turmas.map((t) => [t, new Map<string, number>()]));
      for (let aula = 1; aula <= 5 && ok; aula++) {
        const ocupados = new Set<string>();
        const ordem = [...turmas].sort(() => rnd() - 0.5);
        for (const t of ordem) {
          const rest = restante.get(t)!;
          const hoje = noDia.get(t)!;
          const cands = [...rest.entries()]
            .filter(
              ([d, n]) => n > 0 && (hoje.get(d) ?? 0) < 2 && !ocupados.has(prof.get(`${d}|${t}`)!),
            )
            .sort((x, y) => y[1] - x[1] + (rnd() - 0.5) * 0.9);
          if (!cands.length) {
            ok = false;
            break;
          }
          const [disc] = cands[0];
          const p = prof.get(`${disc}|${t}`)!;
          ocupados.add(p);
          rest.set(disc, rest.get(disc)! - 1);
          hoje.set(disc, (hoje.get(disc) ?? 0) + 1);
          aulas.push({ turma: t, dia, aula, professor: p, disciplina: disc });
        }
      }
    }
    if (ok) return aulas;
  }
  return [];
}

// ---------- Planilha de horário ----------

const DIA_PALAVRAS: [string, number][] = [
  ['seg', 1],
  ['ter', 2],
  ['qua', 3],
  ['qui', 4],
  ['sex', 5],
];

function parseDia(raw: string): number | null {
  const s = normalizeText(raw);
  const n = parseNumber(s.replace(/[ªº°]/g, ''));
  if (n !== null) return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
  return DIA_PALAVRAS.find(([p]) => s.startsWith(p))?.[1] ?? null;
}

function parseAula(raw: string): number | null {
  const n = parseNumber(raw.replace(/[^\d]/g, ''));
  return n !== null && Number.isInteger(n) && n >= 1 && n <= AULAS.length ? n : null;
}

/** Lê a planilha de horário (Turma, Dia, Aula, Professor, Disciplina) pelos nomes das colunas. */
export function parseTimetable(table: RawTable): { aulas: Aula[]; avisos: string[] } {
  const find = (words: string[]) =>
    table.headers.findIndex((h) => words.some((w) => normalizeText(h).includes(w)));
  const col = {
    turma: find(['turma', 'serie', 'classe']),
    dia: find(['dia']),
    aula: find(['aula', 'horario', 'tempo']),
    professor: find(['professor', 'docente']),
    disciplina: find(['disciplina', 'materia', 'componente']),
  };
  const faltando = Object.entries(col)
    .filter(([, i]) => i < 0)
    .map(([k]) => k);
  if (faltando.length)
    return {
      aulas: [],
      avisos: [`Colunas não encontradas: ${faltando.join(', ')}.`],
    };

  const aulas: Aula[] = [];
  let ruins = 0;
  for (const row of table.rows) {
    const turma = (row[col.turma] ?? '').trim();
    const professor = (row[col.professor] ?? '').trim();
    const dia = parseDia(row[col.dia] ?? '');
    const aula = parseAula(row[col.aula] ?? '');
    if (!turma || !professor || dia === null || aula === null) {
      ruins++;
      continue;
    }
    aulas.push({ turma, dia, aula, professor, disciplina: (row[col.disciplina] ?? '').trim() });
  }
  const avisos = ruins
    ? [`${ruins} linha(s) incompletas ou com dia/aula inválidos foram ignoradas.`]
    : [];
  return { aulas, avisos };
}

// ---------- Plano do dia quando professores faltam ----------

export type SlotTipo = 'normal' | 'adiantada' | 'vaga' | 'sem-aula';

export interface Slot {
  aula: number;
  /** Aula prevista na grade (null = horário sem aula). */
  original: Aula | null;
  /** Aula que acontece de fato neste horário após o remanejamento. */
  sugerida: Aula | null;
  tipo: SlotTipo;
  /** Para `adiantada`: de qual aula ela veio. */
  de?: number;
  /** Para `vaga`: professores na escola e sem aula neste horário. */
  livres?: string[];
}

export interface TurmaPlan {
  turma: string;
  slots: Slot[];
  /** A turma foi afetada por alguma falta. */
  afetada: boolean;
  /** Se as vagas ficaram todas no fim: horário em que a turma pode sair. */
  saiAs: string | null;
}

/**
 * Remaneja o dia quando professores faltam:
 * 1. aulas dos ausentes viram vagas;
 * 2. cada vaga (da 1ª para a última aula) é tapada adiantando uma aula posterior da mesma turma
 *    cujo professor esteja na escola e livre naquele horário;
 * 3. vagas que sobram mostram quem está livre para cobrir.
 */
export function planDay(grade: Aula[], dia: number, faltaram: Iterable<string>): TurmaPlan[] {
  const ausentes = new Set(faltaram);
  const hoje = grade.filter((a) => a.dia === dia);
  const naEscola = new Set(hoje.map((a) => a.professor).filter((p) => !ausentes.has(p)));
  // Quem está dando aula em cada horário (já descontando os ausentes).
  const ocupados = AULAS.map(
    (_, i) =>
      new Set(
        hoje.filter((a) => a.aula === i + 1 && !ausentes.has(a.professor)).map((a) => a.professor),
      ),
  );

  const turmas = [...new Set(hoje.map((a) => a.turma))].sort(byTurma);
  return turmas.map((turma) => {
    const slots: Slot[] = AULAS.map(({ n }) => {
      const original = hoje.find((a) => a.turma === turma && a.aula === n) ?? null;
      if (!original) return { aula: n, original, sugerida: null, tipo: 'sem-aula' };
      if (ausentes.has(original.professor))
        return { aula: n, original, sugerida: null, tipo: 'vaga' };
      return { aula: n, original, sugerida: original, tipo: 'normal' };
    });
    const afetada = slots.some((s) => s.tipo === 'vaga');

    for (let i = 0; i < slots.length; i++) {
      if (slots[i].tipo !== 'vaga') continue;
      for (let j = i + 1; j < slots.length; j++) {
        const cand = slots[j].sugerida;
        if (!cand || slots[j].tipo !== 'normal' || ocupados[i].has(cand.professor)) continue;
        slots[i] = { ...slots[i], sugerida: cand, tipo: 'adiantada', de: j + 1 };
        ocupados[i].add(cand.professor);
        ocupados[j].delete(cand.professor);
        slots[j] = { ...slots[j], sugerida: null, tipo: 'vaga' };
        break;
      }
    }

    for (const s of slots)
      if (s.tipo === 'vaga')
        s.livres = [...naEscola]
          .filter((p) => !ocupados[s.aula - 1].has(p))
          .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Vagas só no fim do dia: a turma pode sair depois da última aula que acontece.
    let saiAs: string | null = null;
    const ultima = slots
      .map((s) => s.tipo === 'normal' || s.tipo === 'adiantada')
      .lastIndexOf(true);
    const vagaNoMeio = slots.slice(0, ultima + 1).some((s) => s.tipo === 'vaga');
    const vagaNoFim = slots.slice(ultima + 1).some((s) => s.tipo === 'vaga');
    if (afetada && ultima >= 0 && !vagaNoMeio && vagaNoFim) saiAs = AULAS[ultima].fim;

    return { turma, slots, afetada, saiAs };
  });
}
