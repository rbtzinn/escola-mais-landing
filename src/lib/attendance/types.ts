/** Onde o atraso foi registrado. Todos gravam no mesmo lugar. */
export type Channel = 'aluno' | 'portaria' | 'coordenacao' | 'professor';

export type Motivo = 'transporte' | 'chuva' | 'saude' | 'familia' | 'outro';

export const CHANNEL_LABEL: Record<Channel, string> = {
  aluno: 'Celular do aluno',
  portaria: 'Portaria',
  coordenacao: 'Coordenação',
  professor: 'Professor(a)',
};

export const MOTIVO_LABEL: Record<Motivo, string> = {
  transporte: 'Transporte / ônibus',
  chuva: 'Chuva',
  saude: 'Saúde / consulta',
  familia: 'Motivo familiar',
  outro: 'Outro',
};

/** Em que horário a coordenação liberou a entrada na sala. */
export type Liberado = 'primeira' | 'segunda';

export const LIBERADO_LABEL: Record<Liberado, string> = {
  primeira: 'Entrou no 1º horário',
  segunda: 'Entrou no 2º horário',
};

export type AvisoStatus = 'pendente' | 'enviado' | 'dispensado';

export interface LateRecord {
  id: string;
  /** `studentKey(aluno, turma)`: liga o registro ao aluno da planilha. */
  key: string;
  aluno: string;
  turma: string;
  /** Data e hora da chegada (ISO). */
  at: string;
  /** Hora real em que o registro foi feito (para o "desfazer" de 5 minutos). */
  criadoEm: string;
  /** Minutos depois do horário de entrada. */
  minutos: number;
  channel: Channel;
  registradoPor: string;
  motivo: Motivo | null;
  justificado: boolean;
  liberado: Liberado | null;
  aviso: AvisoStatus;
}

export interface ClockSettings {
  /** Horário de entrada, "HH:MM". */
  entrada: string;
  /** Minutos de tolerância depois da entrada. */
  tolerancia: number;
  /** Hora simulada da demo ("HH:MM") ou null para usar a hora real. */
  simulada: string | null;
}

export const DEFAULT_CLOCK: ClockSettings = { entrada: '07:00', tolerancia: 10, simulada: '07:12' };

/** Aluno que pode ser registrado (vem da planilha ou da escola de exemplo). */
export interface RosterEntry {
  key: string;
  aluno: string;
  turma: string;
  /** Matrícula (da planilha ou gerada): o aluno se identifica com ela no link da entrada. */
  matricula: string;
  telefone: string | null;
  /** Dia e mês do aniversário (da planilha): confirma a identidade no link da entrada. */
  nascimento: Birthday | null;
}

export interface Birthday {
  dia: number;
  mes: number;
}
