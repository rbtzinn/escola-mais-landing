import type { Config } from '@/config';

/**
 * Configuração do diploma: o que não vem do aluno (cabeçalho da escola, assinantes, data de
 * conclusão, numeração do livro de registro e o verso de cada curso). Fica na aba "Diploma"
 * da planilha e é editada no painel. Sem nada salvo, vale o padrão do modelo de Farmácia.
 */

export interface DiplomaItem {
  nome: string;
  ch: string;
}

/** Um bloco do verso: rótulo na vertical, disciplinas com carga horária e a linha de total. */
export interface DiplomaBlock {
  sigla: string;
  titulo: string;
  total: string;
  itens: DiplomaItem[];
}

export interface DiplomaCourse {
  /** "Técnico em Farmácia". */
  titulo: string;
  eixo: string;
  /** Depois de "por haver concluído, em <data>, o ...". */
  conclusaoTexto: string;
  /** Linha do cabeçalho com a portaria de credenciamento do curso. */
  portaria: string;
  /** Sempre 4, na ordem do modelo. */
  blocos: DiplomaBlock[];
  chTotal: string;
  /** Itens do perfil profissional, cada um começando com "- ". */
  perfil: string[];
  /** A direção já conferiu este curso no painel (os cursos sem modelo vêm de um rascunho). */
  revisado: boolean;
}

export interface Signer {
  nome: string;
  cargo: string;
  matricula: string;
  ato: string;
  /** "D.O. de 10/09/2025". */
  publicacao: string;
}

export interface DiplomaConfig {
  cabecalho: { secretaria: string; gerencia: string; escola: string; endereco: string; atos: string };
  /** Nome da escola no texto: "Escola Técnica Estadual Chico Science". */
  escolaNome: string;
  /** Cidade do "Olinda, 31 de dezembro de 2025." */
  cidade: string;
  /** Data de conclusão (dd/mm/aaaa). */
  conclusao: string;
  secretaria: Signer;
  diretor: Signer;
  /** Número de registro do primeiro diploma emitido pelo painel (o livro já pode ter outros). */
  primeiroRegistro: string;
  /** Registros por folha do livro (no modelo, o 155 está na folha 52: 3 por folha). */
  porFolha: string;
  livro: string;
  /** Chave "Modalidade · Curso". */
  cursos: Record<string, DiplomaCourse>;
}

const items = (nomes: string[], ch: string[]): DiplomaItem[] =>
  nomes.map((nome, i) => ({ nome, ch: ch[i] ?? '' }));

/** Blocos 1 e 2 (formação geral e itinerário da área): iguais em todos os cursos do Integrado. */
const FGB: DiplomaBlock = {
  sigla: 'FORMAÇÃO GERAL BÁSICA',
  titulo: 'FORMAÇÃO GERAL BÁSICA (FGB/BNCC)',
  total: '2880',
  itens: items(
    [
      'Biologia',
      'Química',
      'Física',
      'Matemática',
      'Filosofia',
      'Geografia',
      'História',
      'Sociologia',
      'Arte',
      'Educação Física',
      'Língua Inglês',
      'Língua Portuguesa',
    ],
    ['240', '240', '520', '240', '120', '240', '240', '120', '80', '120', '160', '560'],
  ),
};

const IFAC: DiplomaBlock = {
  sigla: 'IF-AC',
  titulo: 'ITINERÁRIO FORMATIVO | ÁREA DO CONHECIMENTO',
  total: '2040',
  itens: items(
    ['Eletivas', 'Projeto de vida', 'Aprofundamento obrigatório', 'Aprofundamento optativo', 'Atividades complementares'],
    ['320', '240', '640', '240', '600'],
  ),
};

const EPT_BASICA_TITULO = 'ITINERÁRIO FORMATIVO | EPT | FORMAÇÃO BÁSICA PARA O TRABALHO';
const EPT_ESPECIFICA_TITULO = 'ITINERÁRIO FORMATIVO | EPT | FORMAÇÃO PROFISSIONAL ESPECÍFICA';

/** Farmácia Integrado: como no modelo enviado pela escola (2023-2025). */
const FARMACIA_INTEGRADO: DiplomaCourse = {
  titulo: 'Técnico em Farmácia',
  eixo: 'Ambiente e Saúde',
  conclusaoTexto: 'Ensino Médio Integral, Integrado à Educação Profissional',
  portaria: 'PORTARIA DE CREDENCIAMENTO DO CURSO Nº 3081 de 17.05.2021- D.O. de 18.05.2021',
  blocos: [
    FGB,
    IFAC,
    {
      sigla: 'IF-EPT',
      titulo: EPT_BASICA_TITULO,
      total: '400',
      itens: items(
        [
          'Design thinking',
          'Inovação social e científica',
          'Metodologia da pesquisa voltada à elaboração de projetos',
          'Higiene e segurança do trabalho',
          'Intervenção comunitária',
          'Projeto de vida Profissional',
          'Anatomia, Fisiologia e Patologia Geral',
          'Fundamentos de Microbiologia, Parasitologia e Imunologia',
          'Mídias na educação',
          'Pensamento computacional',
          'Empresa pedagógica',
          'Farmacologia e Farmacognosia Básica',
          'Habilidades socioemocionais e comportamento empreendedor',
          'Química Analítica Aplicada e Técnicas Experimentais',
        ],
        ['40', '40', '40', '40', '39', '40', '80', '80', '40', '40', '40', '80', '40', '80'],
      ),
    },
    {
      sigla: 'IF-EPT',
      titulo: EPT_ESPECIFICA_TITULO,
      total: '800',
      itens: items(
        [
          'Bioética, Legislação Farmacêutica e Sanitária',
          'Farmacologia Aplicada e Cosmetologia',
          'Operações Unitárias, Farmacotécnica e Controle de Qualidade',
          'Semiologia Farmacêutica e Primeiros Socorros',
          'Práticas Integrativas e Complementares em Saúde',
          'Assistência Farmacêutica e Hospitalar',
        ],
        ['80', '80', '80', '80', '80', '80'],
      ),
    },
  ],
  chTotal: '5400',
  perfil: [
    '- Atender, sob a supervisão do farmacêutico, as prescrições de medicamentos e cosméticos, interpretando a prescrição, separando e fornecendo o produto solicitado e encaminhando ao farmacêutico os casos específicos;',
    '- Auxiliar em processos administrativos relacionados ao âmbito farmacêutico;',
    '- Auxiliar na produção e controle de logística de produtos em indústrias farmacêuticas e afins;',
    '- Executar, como auxiliar, as rotinas de compra, armazenamento e entrega de produtos farmacêuticos e correlatos;',
    '- Identificar e classificar produtos e formas farmacêuticas;',
    '- Participar da rotina de testes em laboratórios de pesquisa vinculados a universidades, faculdades, institutos de pesquisa e indústrias farmacêuticas;',
    '- Realizar o controle e manutenção do estoque de produtos e matérias-primas farmacêuticas;',
    '- Realizar operações farmacotécnicas, manipulação de formas farmacêuticas (alopáticas, fitoterápicas, homeopáticas, cosméticas e afins);',
    '- Realizar testes de controle de qualidade;',
    '- Todas as atividades realizadas pelo Técnico em Farmácia deverão ser orientadas e supervisionadas pelo Farmacêutico.',
  ],
  revisado: true,
};

export const courseKeyOf = (modalidade: string, curso: string) => `${modalidade} · ${curso}`;

/** Rascunho para um curso sem modelo: mesma estrutura, disciplinas técnicas em branco. */
function draftCourse(modalidade: string, curso: string): DiplomaCourse {
  const integrado = modalidade === 'Integrado';
  const vazio = (titulo: string): DiplomaBlock => ({ sigla: 'IF-EPT', titulo, total: '', itens: [] });
  return {
    titulo: `Técnico em ${curso}`,
    eixo: FARMACIA_INTEGRADO.eixo,
    conclusaoTexto: integrado
      ? FARMACIA_INTEGRADO.conclusaoTexto
      : 'Educação Profissional Técnica de Nível Médio, na forma Subsequente',
    portaria: '',
    blocos: integrado
      ? [FGB, IFAC, vazio(EPT_BASICA_TITULO), vazio(EPT_ESPECIFICA_TITULO)]
      : [
          { sigla: '', titulo: '', total: '', itens: [] },
          { sigla: '', titulo: '', total: '', itens: [] },
          vazio(EPT_BASICA_TITULO),
          vazio(EPT_ESPECIFICA_TITULO),
        ],
    chTotal: '',
    perfil: [],
    revisado: false,
  };
}

export const DIPLOMA_PADRAO: Omit<DiplomaConfig, 'cursos'> = {
  cabecalho: {
    secretaria: 'Secretaria de Educação do Estado de Pernambuco',
    gerencia: 'Gerência Regional de Educação Metropolitana Norte',
    escola: 'ESCOLA TÉCNICA ESTADUAL CHICO SCIENCE',
    endereco:
      'Avenida Brasil, s/n, Loteamento Rio Doce I/II Etapa, Lote C-2 – Rio Doce - Olinda/PE– CEP 53.150-470 – CNPJ. 10.572.071/0616-85',
    atos: 'Decreto Lei Estadual nº 50.598 de 28-04-2021– D.O.– PE de 29-04-2021, Portaria SEE Nº 1707 DE 22/03/2024 - Cadastro Escolar E –108102, INEP. 26.190.737',
  },
  escolaNome: 'Escola Técnica Estadual Chico Science',
  cidade: 'Olinda',
  conclusao: '',
  secretaria: {
    nome: 'Doriane Cristina Clemente Batista',
    cargo: 'Secretária',
    matricula: '85021701',
    ato: 'Portaria SEE/SEGP nº 7580 de 09/09/2025',
    publicacao: 'D.O. de 10/09/2025',
  },
  diretor: {
    nome: 'José Roberto Lima Miranda',
    cargo: 'Diretor',
    matricula: '115962301',
    ato: 'ATO nº 5343 de 09/07/2024',
    publicacao: 'D.O. de 10/07/2024',
  },
  primeiroRegistro: '1',
  porFolha: '3',
  livro: '01',
};

/**
 * O que está salvo na planilha completado com o padrão: campos que faltam vêm do modelo, e
 * cada curso da configuração do formulário ganha um verso (o de Farmácia Integrado, ou um
 * rascunho para conferir).
 */
export function withDefaults(saved: unknown, cursos: Config['cursos']): DiplomaConfig {
  const s = (saved && typeof saved === 'object' ? saved : {}) as Partial<DiplomaConfig>;
  const out: DiplomaConfig = {
    ...DIPLOMA_PADRAO,
    ...s,
    cabecalho: { ...DIPLOMA_PADRAO.cabecalho, ...(s.cabecalho ?? {}) },
    secretaria: { ...DIPLOMA_PADRAO.secretaria, ...(s.secretaria ?? {}) },
    diretor: { ...DIPLOMA_PADRAO.diretor, ...(s.diretor ?? {}) },
    cursos: { ...(s.cursos ?? {}) },
  };
  for (const [mod, list] of Object.entries(cursos))
    for (const curso of list) {
      const key = courseKeyOf(mod, curso);
      if (out.cursos[key]) continue;
      out.cursos[key] =
        mod === 'Integrado' && curso === 'Farmácia' ? structuredClone(FARMACIA_INTEGRADO) : draftCourse(mod, curso);
    }
  return out;
}

/** Soma da carga horária dos itens de um bloco (itens sem número não contam). */
export function blockSum(b: DiplomaBlock): number {
  return b.itens.reduce((n, it) => n + (Number(it.ch.replace(',', '.')) || 0), 0);
}

/** Avisos de conta que não fecha no verso (não impedem gerar: o modelo oficial manda). */
export function courseWarnings(c: DiplomaCourse): string[] {
  const out: string[] = [];
  c.blocos.forEach((b, i) => {
    if (!b.itens.length || !b.total) return;
    const sum = blockSum(b);
    if (sum !== Number(b.total))
      out.push(`Bloco ${i + 1} (${b.titulo || b.sigla}): as disciplinas somam ${sum}, mas o total diz ${b.total}.`);
  });
  const totals = c.blocos.reduce((n, b) => n + (Number(b.total) || 0), 0);
  if (c.chTotal && totals && totals !== Number(c.chTotal))
    out.push(`Os totais dos blocos somam ${totals}, mas o total do curso diz ${c.chTotal}.`);
  return out;
}

/** Disciplinas para editar num campo de texto: "Nome ; C.H." por linha. */
export const itemsToText = (itens: DiplomaItem[]) =>
  itens.map((it) => (it.ch ? `${it.nome} ; ${it.ch}` : it.nome)).join('\n');

/**
 * O contrário de `itemsToText`. Aceita "Nome ; 240" e "Nome<tab>240" (colado da planilha);
 * sem separador, a linha inteira é o nome e a C.H. fica em branco.
 */
export function textToItems(text: string): DiplomaItem[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = /^(.*?)\s*(?:;|\t)\s*([^;\t]*)$/.exec(l);
      return m ? { nome: m[1].trim(), ch: m[2].trim() } : { nome: l, ch: '' };
    });
}
