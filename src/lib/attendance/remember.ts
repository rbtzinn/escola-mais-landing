import { demoStore } from '@/lib/demoStore';

/** Onde o link do aluno guarda quem já se identificou neste celular (só a chave do aluno). */
export interface StudentMemory {
  get(): string | null;
  set(key: string | null): void;
}

const STORAGE_KEY = 'escola-mais:aluno';

/** No celular de verdade: guardado no próprio aparelho. Sem acesso ao armazenamento, não lembra. */
export const browserMemory: StudentMemory = {
  get() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(key) {
    try {
      if (key) window.localStorage.setItem(STORAGE_KEY, key);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Navegação privada ou armazenamento bloqueado: o aluno se identifica de novo.
    }
  },
};

/** No celular simulado da Entrada: só na memória da demo, para testar vários alunos. */
export const simulatedMemory: StudentMemory = {
  get: () => demoStore.get().alunoSimulado,
  set: (key) => demoStore.setAlunoSimulado(key),
};
