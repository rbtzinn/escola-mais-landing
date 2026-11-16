import { matriculaFor } from '@/lib/attendance/codes';
import { formatNumber } from './numbers';
import type { RawTable } from './types';

/** Gerador pseudoaleatório com semente: a escola de exemplo é sempre a mesma. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Davi',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Heitor',
  'Isabela',
  'João',
  'Kauã',
  'Larissa',
  'Miguel',
  'Nicole',
  'Otávio',
  'Pietra',
  'Rafael',
  'Sofia',
  'Thiago',
  'Valentina',
  'Wesley',
  'Yasmin',
  'Lucas',
  'Maria',
];
const SOBRENOMES = 'ABCDFGLMNPRSTV';

/** Perfil de cada turma: quanto falta e quanto tira de nota (atual e no bimestre anterior). */
const TURMAS: { turma: string; falta: [number, number]; nota: [number, number] }[] = [
  { turma: '6º A', falta: [5, 6], nota: [7.9, 7.7] },
  { turma: '6º B', falta: [9, 8], nota: [7.1, 7.4] },
  { turma: '7º A', falta: [6, 7], nota: [7.7, 7.4] },
  { turma: '7º B', falta: [17, 11], nota: [6.3, 7.0] },
  { turma: '8º A', falta: [6, 6], nota: [7.5, 7.4] },
  { turma: '9º A', falta: [7, 9], nota: [7.3, 7.1] },
];
const DISCIPLINAS = ['Português', 'Matemática', 'Ciências', 'História'];
const POR_TURMA = 24;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Escola fictícia com 6 turmas e 144 alunos. `periodo` escolhe o bimestre atual ou o anterior;
 * os alunos são os mesmos nos dois, para a comparação funcionar. Sem telefones (dados fictícios).
 */
export function sampleTable(periodo: 'atual' | 'anterior' = 'atual'): RawTable {
  const p = periodo === 'atual' ? 0 : 1;
  const rows: string[][] = [];
  TURMAS.forEach((t, ti) => {
    for (let i = 0; i < POR_TURMA; i++) {
      // Traços do aluno (iguais nos dois bimestres) + variação do bimestre.
      const traco = mulberry32(1000 + ti * 100 + i);
      const nome = `${NOMES[(i + ti * 5) % NOMES.length]} ${SOBRENOMES[Math.floor(traco() * SOBRENOMES.length)]}.`;
      const assiduidade = traco() * 2 - 0.6; // >1 falta bem mais que a turma
      const desempenho = traco() * 2.8 - 1.4;
      const atrasado = traco();
      const ruido = mulberry32(5000 + p * 7919 + ti * 100 + i);

      const faltas = Math.round(clamp(t.falta[p] * (1 + assiduidade) + ruido() * 6 - 3, 0, 60));
      const atrasos = atrasado > 0.88 ? Math.round(2 + ruido() * 5) : Math.round(ruido() * 2);
      const notas = DISCIPLINAS.map((_, d) => {
        const vies = d === 1 ? -0.6 : d === 0 ? 0.2 : 0; // Matemática costuma ser a mais baixa
        return formatNumber(clamp(t.nota[p] + desempenho + vies + ruido() * 1.6 - 0.8, 0, 10));
      });
      rows.push([
        matriculaFor(nome, t.turma),
        nome,
        t.turma,
        String(faltas),
        String(atrasos),
        ...notas,
      ]);
    }
  });
  return { headers: ['Matrícula', 'Aluno', 'Turma', 'Faltas', 'Atrasos', ...DISCIPLINAS], rows };
}
