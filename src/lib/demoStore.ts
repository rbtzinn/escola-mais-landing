import {
  type RecordPatch,
  removeRecord,
  type RegisterInput,
  type RegisterResult,
  register,
  updateRecord,
} from '@/lib/attendance/records';
import { type ClockSettings, DEFAULT_CLOCK, type LateRecord } from '@/lib/attendance/types';
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
};

/*
 * Estado da demo só em memória, no navegador: vale entre /demo e /demo/registro enquanto
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
    set({ school: { table, mapping, sourceName }, previous: null, records: [] });
    return mapping;
  },
  setMapping(mapping: Mapping) {
    if (state.school) set({ school: { ...state.school, mapping } });
  },
  clearSchool() {
    set({ school: null, previous: null, records: [] });
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
