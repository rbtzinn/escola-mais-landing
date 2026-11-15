/** Planilha lida: cabeçalhos únicos e linhas de texto, todas com o mesmo número de colunas. */
export interface RawTable {
  headers: string[];
  rows: string[][];
}

/** Índices das colunas escolhidas (ou null quando a planilha não tem a informação). */
export interface Mapping {
  aluno: number | null;
  turma: number | null;
  faltas: number | null;
  atrasos: number | null;
  /** Colunas com uma nota (0 a 10) por disciplina. */
  disciplinas: number[];
}

export interface Options {
  /** Dias letivos até agora: base para transformar faltas em frequência. */
  diasLetivos: number;
  /** Frequência mínima (%) antes de o aluno entrar na lista de risco. */
  freqMin: number;
  /** Média mínima (0 a 10) antes de o aluno entrar na lista de risco. */
  mediaMin: number;
  /** A partir de quantos atrasos o aluno entra na lista de atrasos. */
  atrasosMin: number;
}

export const DEFAULT_OPTIONS: Options = {
  diasLetivos: 100,
  freqMin: 75,
  mediaMin: 6,
  atrasosMin: 3,
};

export interface Student {
  aluno: string;
  turma: string;
  faltas: number | null;
  atrasos: number | null;
  frequencia: number | null;
  media: number | null;
  notas: Record<string, number>;
}

export interface ClassSummary {
  turma: string;
  alunos: number;
  frequencia: number | null;
  media: number | null;
  mediasPorDisciplina: Record<string, number | null>;
  emRisco: number;
}

export interface RiskItem {
  student: Student;
  motivos: string[];
  /** Quanto maior, mais grave (usado só para ordenar). */
  gravidade: number;
}

export interface Analysis {
  disciplinas: string[];
  students: Student[];
  turmas: ClassSummary[];
  risco: RiskItem[];
  atrasos: Student[];
  kpis: {
    alunos: number;
    frequenciaGeral: number | null;
    mediaGeral: number | null;
    emRisco: number;
    comAtrasos: number;
  };
  avisos: string[];
  options: Options;
}
