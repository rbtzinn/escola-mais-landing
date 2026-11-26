import type { Config } from '@/config';

/**
 * Configuração do diploma: o que não vem do aluno (cabeçalho da escola, assinantes, numeração do
 * livro de registro e, por curso, o modelo, a data de conclusão e o verso). Fica na aba
 * "Diploma" da planilha e é editada no painel. Sem nada salvo, vale o padrão tirado dos
 * modelos enviados pela escola.
 */

/** Modelos de Word em public/ (gerados por scripts/diploma_modelo.py). */
export type ModeloId = 'integrado' | 'farmacia-subsequente' | 'enfermagem-subsequente';

export interface Modelo {
  nome: string;
  arquivo: string;
  /** Quantos blocos (módulos ou itinerários) o verso tem. */
  blocos: number;
  /** Cada bloco tem rótulo lateral, linha de total e total (Enfermagem não tem). */
  totais: boolean;
  /** Cada módulo tem semestre e % de frequência do aluno (Enfermagem). */
  frequencia: boolean;
  /** Linha em branco entre os itens do perfil, como no modelo. */
  perfilEspacado: boolean;
  /** Campos a mais do modelo (ex.: quadro de carga horária de Enfermagem). */
  extras: { key: string; label: string }[];
}

export const MODELOS: Record<ModeloId, Modelo> = {
  integrado: {
    nome: 'Integrado (4 blocos: FGB, IF-AC e dois IF-EPT)',
    arquivo: '/diploma-integrado.docx',
    blocos: 4,
    totais: true,
    frequencia: false,
    perfilEspacado: true,
    extras: [],
  },
  'farmacia-subsequente': {
    nome: 'Subsequente com 3 módulos e total por módulo',
    arquivo: '/diploma-farmacia-subsequente.docx',
    blocos: 3,
    totais: true,
    frequencia: false,
    perfilEspacado: false,
    extras: [],
  },
  'enfermagem-subsequente': {
    nome: 'Subsequente com 4 módulos, semestre, frequência e estágio',
    arquivo: '/diploma-enfermagem-subsequente.docx',
    blocos: 4,
    totais: false,
    frequencia: true,
    perfilEspacado: true,
    extras: [
      { key: 'est_h', label: 'Estágio curricular (horas)' },
      { key: 'est_ha', label: 'Estágio curricular (horas-aula)' },
      { key: 'teo_h', label: 'Carga teórica (horas)' },
      { key: 'teo_ha', label: 'Carga teórica (horas-aula)' },
      { key: 'tot_h', label: 'Carga total (horas)' },
      { key: 'tot_ha', label: 'Carga total (horas-aula)' },
    ],
  },
};

export interface DiplomaItem {
  nome: string;
  ch: string;
}

/** Um bloco do verso: rótulo lateral, disciplinas com carga horária e a linha de total. */
export interface DiplomaBlock {
  sigla: string;
  titulo: string;
  total: string;
  itens: DiplomaItem[];
}

export interface DiplomaCourse {
  modelo: ModeloId;
  /** "Técnico em Farmácia". */
  titulo: string;
  eixo: string;
  /** Depois de "por haver concluído, em <data>, o/a ...". */
  conclusaoTexto: string;
  /** Data de conclusão da turma (dd/mm/aaaa); dá para trocar na ficha de cada aluno. */
  conclusao: string;
  /** Linha do cabeçalho com a portaria de credenciamento do curso. */
  portaria: string;
  /** Tantos quanto o modelo pede, na ordem do modelo. */
  blocos: DiplomaBlock[];
  chTotal: string;
  /** Itens do perfil profissional (o "- " do Integrado o modelo põe sozinho). */
  perfil: string[];
  /** Campos a mais do modelo (MODELOS[modelo].extras). */
  extras: Record<string, string>;
  /** A direção já conferiu este curso (cursos novos, sem modelo, começam como rascunho). */
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

const IFAC: DiplomaBlock = {
  sigla: 'IF-AC',
  titulo: 'ITINERÁRIO FORMATIVO | ÁREA DO CONHECIMENTO',
  total: '2040',
  itens: items(
    ['Eletivas', 'Projeto de vida', 'Aprofundamento obrigatório', 'Aprofundamento optativo', 'Atividades complementares'],
    ['320', '240', '640', '240', '600'],
  ),
};

const EPT_BASICA = 'ITINERÁRIO FORMATIVO | EPT | FORMAÇÃO BÁSICA PARA O TRABALHO';
const EPT_ESPECIFICA = 'ITINERÁRIO FORMATIVO | EPT | FORMAÇÃO PROFISSIONAL ESPECÍFICA';
const AMBIENTE_SAUDE = 'Ambiente e Saúde';
const INTEGRADO_TEXTO = 'Ensino Médio Integral, Integrado à Educação Profissional';
const PORTARIA_INTEGRADO = 'PORTARIA DE CREDENCIAMENTO DO CURSO Nº 3081 de 17.05.2021- D.O. de 18.05.2021';
const PORTARIA_SUBSEQUENTE = 'Portaria de credenciamento do curso Nº 1856 de 04.04.2022 - D.O. de 05.04.2022';

/** Farmácia Integrado: Diploma_FAR_integrado_2023-2025. */
const FARMACIA_INTEGRADO: DiplomaCourse = {
  modelo: 'integrado',
  titulo: 'Técnico em Farmácia',
  eixo: AMBIENTE_SAUDE,
  conclusaoTexto: INTEGRADO_TEXTO,
  conclusao: '',
  portaria: PORTARIA_INTEGRADO,
  blocos: [
    {
      sigla: 'FORMAÇÃO GERAL BÁSICA',
      titulo: 'FORMAÇÃO GERAL BÁSICA (FGB/BNCC)',
      total: '2880',
      itens: items(
        ['Biologia', 'Química', 'Física', 'Matemática', 'Filosofia', 'Geografia', 'História', 'Sociologia', 'Arte', 'Educação Física', 'Língua Inglês', 'Língua Portuguesa'],
        ['240', '240', '520', '240', '120', '240', '240', '120', '80', '120', '160', '560'],
      ),
    },
    IFAC,
    {
      sigla: 'IF-EPT',
      titulo: EPT_BASICA,
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
      titulo: EPT_ESPECIFICA,
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
    'Atender, sob a supervisão do farmacêutico, as prescrições de medicamentos e cosméticos, interpretando a prescrição, separando e fornecendo o produto solicitado e encaminhando ao farmacêutico os casos específicos;',
    'Auxiliar em processos administrativos relacionados ao âmbito farmacêutico;',
    'Auxiliar na produção e controle de logística de produtos em indústrias farmacêuticas e afins;',
    'Executar, como auxiliar, as rotinas de compra, armazenamento e entrega de produtos farmacêuticos e correlatos;',
    'Identificar e classificar produtos e formas farmacêuticas;',
    'Participar da rotina de testes em laboratórios de pesquisa vinculados a universidades, faculdades, institutos de pesquisa e indústrias farmacêuticas;',
    'Realizar o controle e manutenção do estoque de produtos e matérias-primas farmacêuticas;',
    'Realizar operações farmacotécnicas, manipulação de formas farmacêuticas (alopáticas, fitoterápicas, homeopáticas, cosméticas e afins);',
    'Realizar testes de controle de qualidade;',
    'Todas as atividades realizadas pelo Técnico em Farmácia deverão ser orientadas e supervisionadas pelo Farmacêutico.',
  ],
  extras: {},
  revisado: true,
};

/** Nutrição e Dietética Integrado: Diploma_NEDintegrado_2023-2025. */
const NUTRICAO_INTEGRADO: DiplomaCourse = {
  ...FARMACIA_INTEGRADO,
  titulo: 'Técnico em Nutrição e Dietética',
  blocos: [
    {
      sigla: 'FORMAÇÃO GERAL BÁSICA',
      titulo: 'FORMAÇÃO GERAL BÁSICA (FGB/BNCC)',
      total: '2160',
      itens: items(
        ['Arte', 'Educação Física', 'Língua Inglês', 'Língua Portuguesa', 'Matemática', 'Biologia', 'Química', 'Física', 'Filosofia', 'Geografia', 'História', 'Sociologia'],
        ['40', '80', '160', '480', '440', '160', '160', '160', '80', '160', '160', '80'],
      ),
    },
    IFAC,
    {
      sigla: 'IF-EPT',
      titulo: EPT_BASICA,
      total: '400',
      itens: items(
        [
          'Metodologia da pesquisa voltada à elaboração de projetos',
          'Inovação social e científica',
          'Design thinking',
          'Higiene e segurança do trabalho',
          'Intervenção comunitária',
          'Projeto de vida',
          'Pensamento computacional',
          'Mídias na educação',
          'Habilidades socioemocionais e comportamento empreendedor',
          'Empresa pedagógica',
        ],
        Array(10).fill('40'),
      ),
    },
    {
      sigla: 'IF-EPT',
      titulo: EPT_ESPECIFICA,
      total: '800',
      itens: items(
        [
          'Anatomia e Fisiologia Humana',
          'Nutrição Humana',
          'Nutrição e Saúde Pública',
          'Boas Práticas e Microbiologia',
          'Introdução à Técnica Dietética',
          'Ética e Legislação Aplicada a Nutrição',
          'Avaliação e Educação Nutricional',
          'Bioquímica e Tecnologia de Alimentos',
          'Técnica Dietética e Planejamento de Cardápios',
          'Administração de Unidades de Alimentação e Nutrição',
          'Dietoterapia e Fisiopatologia',
          'Nutrição Materno-Infantil',
        ],
        ['80', '40', '40', '80', '40', '40', '80', '80', '80', '80', '80', '80'],
      ),
    },
  ],
  perfil: [
    'Desenvolver ações de orientação da alimentação equilibrada para a promoção e manutenção da saúde de diferentes grupos populacionais, considerando conceitos e princípios de atenção integral à saúde e do processo saúde-doença.',
    'Planejar, acompanhar e avaliar os processos de produção e distribuição de refeições para diferentes grupos populacionais, incluindo portadores de patologias, a partir de conceitos e princípios de nutrição e dietética, de gastronomia, de preservação do meio ambiente e de utilização de tecnologias atualizadas, de modo a atender com qualidade as necessidades detectadas.',
    'Coordenar, supervisionar e executar programas de treinamento de pessoas, a partir das necessidades levantadas, utilizando estratégias de comunicação, tendo em vista a melhoria da qualidade dos serviços de nutrição e dietética.',
    'Planejar, implantar, coordenar e supervisionar procedimentos de controle higiênico-sanitário dos alimentos, considerando princípios de microbiologia, cumprindo e fazendo cumprir a legislação pertinente.',
    'Planejar e organizar atividades voltadas para a cozinha experimental e serviço de atendimento ao consumidor, considerando tecnologias de alimentos que permitam adequar, desenvolver e/ou testar produtos e serviços, de modo a atender necessidades identificadas no mercado.',
  ],
};

const modulo = (n: string, total: string, nomes: string[], ch: string[]): DiplomaBlock => ({
  sigla: `Módulo ${n}`,
  titulo: `TOTAL DA C.H. MÓDULO ${n}`,
  total,
  itens: items(nomes, ch),
});

/** Farmácia Subsequente: Diploma_FAR_Subsequente_2025.1. */
const FARMACIA_SUBSEQUENTE: DiplomaCourse = {
  modelo: 'farmacia-subsequente',
  titulo: 'Técnico em Farmácia',
  eixo: AMBIENTE_SAUDE,
  conclusaoTexto: 'Educação Profissional Técnico em Farmácia na forma Subsequente',
  conclusao: '09/07/2026',
  portaria: PORTARIA_SUBSEQUENTE,
  blocos: [
    modulo(
      'I',
      '600',
      [
        'Anatomia, Fisiologia e Patologia Geral',
        'Atividades Complementares I',
        'Bioquímica Geral e Experimental',
        'Farmacologia Básica',
        'Fundamentos de Microbiologia, Parasitologia e Imunologia',
        'Habilidades Socioemocionais e Comportamento Empreendedor',
        'Projeto de Vida',
        'Projeto Integrador 1',
        'Química Geral e Experimental',
      ],
      ['80', '80', '40', '80', '40', '80', '40', '80', '80'],
    ),
    modulo(
      'II',
      '720',
      [
        'Atividades Complementares II',
        'Biossegurança e Primeiros Socorros',
        'Eletiva I - EAD',
        'Farmacognosia Básica',
        'Farmacologia Aplicada',
        'Práticas Integrativas e Complementares em Saúde',
        'Projeto Integrador 2',
        'Química Farmacêutica e Orgânica',
        'Saúde Coletiva e Epidemiologia',
      ],
      Array(9).fill('80'),
    ),
    modulo(
      'III',
      '600',
      [
        'Assistência Farmacêutica e Hospitalar',
        'Atividades Complementares III',
        'Bioética, Legislação Farmacêutica e Sanitária',
        'Cosmetologia Básica',
        'Eletiva 2 - EAD',
        'Empreendedorismo e Inovação',
        'Operações Unitárias, Farmacotécnica e Controle de Qualidade',
        'Projeto Integrador III',
        'Semiologia Farmacêutica',
      ],
      ['40', '80', '80', '40', '80', '40', '80', '80', '80'],
    ),
  ],
  chTotal: '1920',
  perfil: [
    'Atender, sob a supervisão do farmacêutico, as prescrições de medicamentos e cosméticos, interpretando a prescrição, separando e fornecendo o produto solicitado e encaminhando ao farmacêutico os casos específicos;',
    'Auxiliar em processos administrativos relacionados ao âmbito farmacêutico;',
    'Auxiliar na produção e controle de logística de produtos em indústrias farmacêuticas e afins;',
    'Executar, como auxiliar, as rotinas de compra, armazenamento e entrega de produtos farmacêuticos e correlatos;',
    'Identificar e classificar produtos e formas farmacêuticas;',
    'Participar da rotina de testes em laboratórios de pesquisa vinculados a universidades, faculdades, institutos de pesquisa e indústrias farmacêuticas;',
    'Realizar o controle e manutenção do estoque de produtos e matérias-primas farmacêuticas;',
    'Realizar operações farmacotécnicas, manipulação de formas farmacêuticas (alopáticas, fitoterápicas, homeopáticas, cosméticas e afins);',
    'Realizar testes de controle de qualidade.',
    'Todas as atividades realizadas pelo Técnico em Farmácia deverão ser orientadas e supervisionadas pelo Farmacêutico.',
  ],
  extras: {},
  revisado: true,
};

const moduloEnf = (n: string, nomes: string[], ch: string[]): DiplomaBlock => ({
  sigla: n,
  titulo: '',
  total: '',
  itens: items(nomes, ch),
});

/** Enfermagem Subsequente: MODELO_DE_DIPLOMA_SUBSEQUENTE_-_ENFERMAGEM-24.1. */
const ENFERMAGEM_SUBSEQUENTE: DiplomaCourse = {
  modelo: 'enfermagem-subsequente',
  titulo: 'Técnico em Enfermagem',
  eixo: AMBIENTE_SAUDE,
  conclusaoTexto: 'Educação Profissional Técnico em Enfermagem na forma Subsequente',
  conclusao: '09/09/2026',
  portaria: PORTARIA_SUBSEQUENTE,
  blocos: [
    moduloEnf(
      'I',
      [
        'Atividades Complementares I',
        'Ética e Legislação Aplicada à Enfermagem',
        'Habilidades Socioemocionais e Comportamento Empreendedor',
        'Higiene e Profilaxia',
        'Microbiologia e Parasitologia',
        'Noções de Anatomia e Fisiologia Humana',
        'Noções de Nutrição e Dietética',
        'Projeto Integrador 1',
        'Psicologia Aplicada à Enfermagem',
      ],
      ['80', '40', '80', '80', '40', '120', '40', '80', '40'],
    ),
    moduloEnf(
      'II',
      [
        'Assistência de Enfermagem às principais Patologias',
        'Atividades Complementares II',
        'Biossegurança e Segurança do Trabalho',
        'Introdução em Enfermagem',
        'Noções de Farmacologia',
        'Projeto de Vida',
        'Projeto Integrador 2',
        'Estágio Introdução em Enfermagem',
        'Estágio em Enfermagem às principais Patologias',
      ],
      ['120', '80', '40', '120', '80', '80', '80', '60', '60'],
    ),
    moduloEnf(
      'III',
      [
        'Atividades Complementares III',
        'Eletiva I - EAD',
        'Enfermagem em Clínica Cirúrgica',
        'Enfermagem em Saúde da Criança e do Adolescente',
        'Enfermagem em Saúde da Mulher',
        'Enfermagem em Saúde do Homem',
        'Projeto Integrador 3',
        'Saúde Coletiva',
        'Estágio em Enfermagem em Clínica Cirúrgica',
        'Estágio em Enfermagem em Saúde da Criança e Adolescente',
        'Estágio em Enfermagem em Saúde da Mulher',
        'Estágio em Saúde Coletiva',
      ],
      ['80', '80', '80', '60', '80', '40', '80', '100', '40', '40', '40', '40'],
    ),
    moduloEnf(
      'IV',
      [
        'Administração em Enfermagem',
        'Atividades Complementares IV',
        'Cuidados à Pacientes Graves',
        'Eletiva II - EAD',
        'Emergência e Urgência',
        'Enfermagem em Saúde do Idoso',
        'Enfermagem em Saúde Mental',
        'Humanização em Saúde',
        'Projeto Integrador 4',
        'Estágio em Enfermagem em Saúde do Idoso',
        'Estágio em Enfermagem em Saúde Mental',
        'Estágio em Enfermagem em Cuidados à Pacientes Graves',
        'Estágio em Enfermagem em Emergência e Urgência',
      ],
      ['80', '80', '80', '80', '80', '40', '40', '40', '80', '20', '20', '20', '60'],
    ),
  ],
  chTotal: '',
  perfil: [
    'Reconhecer como paradigma que respaldam o planejamento e a ação dos profissionais da área de saúde: o ser humano integral, os condicionantes, os determinantes do processo saúde e doença, os princípios éticos, as normas do exercício profissional, a qualidade no atendimento, o respeito ao meio ambiente e o compromisso social com a população',
    'Buscar atualização constante e autodesenvolvimento para identificar e incorporar, criticamente, novos métodos, técnicas e tecnologias às suas ações e responder às situações cotidianas e inusitadas com flexibilidade e criatividade, visando oferecer uma assistência sem riscos à sociedade;',
    'Assumir postura profissional condizente com os princípios que regem as ações na área de saúde, atuando em equipes multidisciplinar e relacionando-se com os profissionais envolvidos no processo de trabalho, com o indivíduo, o grupo e a comunidade, contribuindo de forma efetiva para a promoção, proteção e recuperação da saúde;',
    'Reconhecer a relação pessoa a pessoa como essencial nas ações de enfermagem, valorizando o processo terapêutico na perspectiva da sensibilização da assistência;',
    'Gerenciar o seu percurso profissional com iniciativa e de forma empreendedora, visualizando oportunidades de trabalho nos diversos âmbitos da área saúde;',
    'Atuar com responsabilidade, comprometendo-se com os princípios da ética, da preservação da saúde e do desenvolvimento social.',
  ],
  extras: { est_h: '267h', est_ha: '400h/a', teo_h: '1600h', teo_ha: '2.400h/a', tot_h: '1.867h', tot_ha: '2.800h/a' },
  revisado: true,
};

export const courseKeyOf = (modalidade: string, curso: string) => `${modalidade} · ${curso}`;

const PADRAO_CURSOS: Record<string, DiplomaCourse> = {
  [courseKeyOf('Integrado', 'Farmácia')]: FARMACIA_INTEGRADO,
  [courseKeyOf('Integrado', 'Nutrição e Dietética')]: NUTRICAO_INTEGRADO,
  [courseKeyOf('Subsequente', 'Farmácia')]: FARMACIA_SUBSEQUENTE,
  [courseKeyOf('Subsequente', 'Enfermagem')]: ENFERMAGEM_SUBSEQUENTE,
};

/** Blocos vazios no formato do modelo (para um curso novo). */
function emptyBlocks(modelo: ModeloId): DiplomaBlock[] {
  const roman = ['I', 'II', 'III', 'IV'];
  return Array.from({ length: MODELOS[modelo].blocos }, (_, i) => ({
    sigla: modelo === 'enfermagem-subsequente' ? roman[i] : '',
    titulo: '',
    total: '',
    itens: [],
  }));
}

/** Rascunho para um curso que a escola ainda não mandou modelo (a direção confere e preenche). */
function draftCourse(modalidade: string, curso: string): DiplomaCourse {
  const integrado = modalidade === 'Integrado';
  const base = integrado ? FARMACIA_INTEGRADO : FARMACIA_SUBSEQUENTE;
  return {
    ...structuredClone(base),
    titulo: `Técnico em ${curso}`,
    conclusaoTexto: integrado ? INTEGRADO_TEXTO : `Educação Profissional Técnico em ${curso} na forma Subsequente`,
    conclusao: '',
    portaria: '',
    // Integrado: a formação geral e o itinerário da área se repetem; o técnico fica em branco.
    blocos: integrado
      ? [
          structuredClone(base.blocos[0]),
          structuredClone(IFAC),
          { sigla: 'IF-EPT', titulo: EPT_BASICA, total: '', itens: [] },
          { sigla: 'IF-EPT', titulo: EPT_ESPECIFICA, total: '', itens: [] },
        ]
      : emptyBlocks('farmacia-subsequente'),
    chTotal: '',
    perfil: [],
    revisado: false,
  };
}

/** Ajusta o número de blocos ao modelo (ao trocar o modelo de um curso no painel). */
export function fitBlocks(c: DiplomaCourse): DiplomaCourse {
  const want = MODELOS[c.modelo].blocos;
  const empty = emptyBlocks(c.modelo);
  return { ...c, blocos: Array.from({ length: want }, (_, i) => c.blocos[i] ?? empty[i]) };
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
 * O que está salvo na planilha completado com o padrão: campos que faltam vêm dos modelos, e
 * cada curso da configuração do formulário ganha um verso. O Integrado conclui em 31/12 do
 * ano corrente, se a direção não disser outra data.
 */
export function withDefaults(saved: unknown, cursos: Config['cursos'], today = new Date()): DiplomaConfig {
  const s = (saved && typeof saved === 'object' ? saved : {}) as Partial<DiplomaConfig> & { conclusao?: string };
  const out: DiplomaConfig = {
    ...DIPLOMA_PADRAO,
    ...s,
    cabecalho: { ...DIPLOMA_PADRAO.cabecalho, ...(s.cabecalho ?? {}) },
    secretaria: { ...DIPLOMA_PADRAO.secretaria, ...(s.secretaria ?? {}) },
    diretor: { ...DIPLOMA_PADRAO.diretor, ...(s.diretor ?? {}) },
    cursos: {},
  };
  delete (out as { conclusao?: string }).conclusao;
  for (const [mod, list] of Object.entries(cursos))
    for (const curso of list) {
      const key = courseKeyOf(mod, curso);
      const base = PADRAO_CURSOS[key] ? structuredClone(PADRAO_CURSOS[key]) : draftCourse(mod, curso);
      if (base.modelo === 'integrado' && !base.conclusao) base.conclusao = `31/12/${today.getFullYear()}`;
      const stored = s.cursos?.[key];
      // Configuração antiga (antes dos modelos por curso): data única e sem modelo.
      const merged: DiplomaCourse = { ...base, ...(stored ?? {}), extras: { ...base.extras, ...(stored?.extras ?? {}) } };
      if (stored && !stored.modelo) merged.modelo = base.modelo;
      if (!stored?.conclusao && s.conclusao) merged.conclusao = s.conclusao;
      out.cursos[key] = fitBlocks(merged);
    }
  return out;
}

/** Soma da carga horária dos itens de um bloco (itens sem número não contam). */
export function blockSum(b: DiplomaBlock): number {
  return b.itens.reduce((n, it) => n + (Number(it.ch.replace(',', '.')) || 0), 0);
}

/** Avisos de conta que não fecha no verso (não impedem gerar: o modelo oficial manda). */
export function courseWarnings(c: DiplomaCourse): string[] {
  if (!MODELOS[c.modelo].totais) return [];
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
