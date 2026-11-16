import {
  type RecordPatch,
  removeRecord,
  type RegisterInput,
  type RegisterResult,
  register,
  updateRecord,
} from '@/lib/attendance/records';
import { type ClockSettings, DEFAULT_CLOCK, type LateRecord } from '@/lib/attendance/types';
import type { ChamadaTurma, Chamadas } from '@/lib/daily/attendance';
import { DEFAULT_MEAL_DEADLINE, type Meals, mealWindow } from '@/lib/daily/meals';
import { type Aula, sampleTimetable } from '@/lib/daily/timetable';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { sampleTable } from '@/lib/spreadsheet/sample';
import {
  DEFAULT_OPTIONS,
  type Mapping,
  type Options,
  type RawTable,
} from '@/lib/spreadsheet/types';

export const SAMPLE_NAME = 'Escola de exemplo';

export interface DemoSchool {
  table: RawTable;
  mapping: Mapping;
  sourceName: string;
}

export type OptionsText = Record<keyof Options, string>;

export interface DemoState {
  school: DemoSchool | null;
  /** Planilha anterior para comparação. */
  previous: { table: RawTable; name: string } | null;
  optionsText: OptionsText;
  /** Atrasos registrados hoje (aluno pelo QR, portaria, professor, coordenação): um só "banco". */
  records: LateRecord[];
  clock: ClockSettings;
  /** Chamada do 1º horário por turma (só os ausentes). */
  chamadas: Chamadas;
  /** Merenda: resposta de cada aluno pelo celular. */
  meals: Meals;
  /** Até quando o aluno pode responder a merenda ("HH:MM"). */
  mealDeadline: string;
  /** Grade de horário (a de exemplo ou a enviada). */
  timetable: { aulas: Aula[]; nome: string } | null;
  /** Professores que faltaram hoje. */
  faltaram: string[];
  /** Nome de quem faz a chamada, perguntado uma vez (só nesta aba). */
  professorNome: string | null;
}

const defaultOptionsText: OptionsText = {
  diasLetivos: String(DEFAULT_OPTIONS.diasLetivos),
  freqMin: String(DEFAULT_OPTIONS.freqMin),
  mediaMin: String(DEFAULT_OPTIONS.mediaMin),
  atrasosMin: String(DEFAULT_OPTIONS.atrasosMin),
};

const INITIAL: DemoState = {
  school: null,
  previous: null,
  optionsText: defaultOptionsText,
  records: [],
  clock: DEFAULT_CLOCK,
  chamadas: {},
  meals: {},
  mealDeadline: DEFAULT_MEAL_DEADLINE,
  timetable: null,
  faltaram: [],
  professorNome: null,
};

/** O dia recomeça quando a escola muda: registros, chamadas, merenda e faltas são da escola anterior. */
const FRESH_DAY = { previous: null, records: [], chamadas: {}, meals: {}, faltaram: [] };

/** Turmas da planilha (para montar a grade de exemplo). */
const turmasOf = (table: RawTable, mapping: Mapping) =>
  mapping.turma === null
    ? []
    : [...new Set(table.rows.map((r) => (r[mapping.turma!] ?? '').trim()).filter(Boolean))];

/*
 * Estado da demo só em memória, no navegador: vale entre /demo e /demo/dia enquanto
 * a aba estiver aberta e some ao recarregar. Nada é enviado nem guardado.
 */
let state: DemoState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<DemoState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const demoStore = {
  get: (): DemoState => state,
  getServer: (): DemoState => INITIAL,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Nova planilha: os registros e a comparação são da escola anterior e são zerados. */
  setSchool(table: RawTable, sourceName: string, mapping = guessMapping(table)) {
    const timetable =
      sourceName === SAMPLE_NAME
        ? { aulas: sampleTimetable(turmasOf(table, mapping)), nome: 'Grade de exemplo' }
        : null;
    set({ school: { table, mapping, sourceName }, ...FRESH_DAY, timetable });
    return mapping;
  },
  setMapping(mapping: Mapping) {
    if (state.school) set({ school: { ...state.school, mapping } });
  },
  clearSchool() {
    set({ school: null, ...FRESH_DAY, timetable: null });
  },
  /** Garante uma escola para o registro: sem planilha, usa a escola de exemplo. */
  ensureSchool() {
    if (!state.school) demoStore.setSchool(sampleTable('atual'), SAMPLE_NAME);
  },

  setPrevious(previous: DemoState['previous']) {
    set({ previous });
  },
  setOptionsText(optionsText: OptionsText) {
    set({ optionsText });
  },
  setClock(clock: ClockSettings) {
    set({ clock });
  },

  register(input: Omit<RegisterInput, 'settings'>): RegisterResult {
    const result = register(state.records, { ...input, settings: state.clock });
    if (result.status === 'novo') set({ records: result.records });
    return result;
  },

  /** Salva (ou refaz) a chamada do 1º horário de uma turma. */
  saveChamada(chamada: ChamadaTurma) {
    set({ chamadas: { ...state.chamadas, [chamada.turma]: chamada } });
  },

  /** Resposta da merenda pelo celular; depois do prazo, não muda nada e devolve false. */
  setMeal(key: string, vai: boolean, at: Date): boolean {
    if (mealWindow(at, state.mealDeadline) !== 'aberto') return false;
    set({ meals: { ...state.meals, [key]: vai } });
    return true;
  },
  setMealDeadline(mealDeadline: string) {
    set({ mealDeadline });
  },

  setProfessorNome(professorNome: string | null) {
    set({ professorNome: professorNome?.trim() || null });
  },

  setTimetable(timetable: DemoState['timetable']) {
    set({ timetable, faltaram: [] });
  },
  toggleFaltou(professor: string) {
    const f = state.faltaram;
    set({ faltaram: f.includes(professor) ? f.filter((p) => p !== professor) : [...f, professor] });
  },
  /** Desfazer (professor, até 5 min) ou excluir (coordenação). */
  remove(id: string) {
    set({ records: removeRecord(state.records, id) });
  },
  update(id: string, patch: RecordPatch) {
    set({ records: updateRecord(state.records, id, patch) });
  },

  /** Só para testes. */
  reset() {
    state = INITIAL;
    listeners.forEach((l) => l());
  },
};
