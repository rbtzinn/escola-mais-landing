import type { Config } from '@/config';

/** Respostas do formulário: texto, ou lista para as perguntas de marcar várias. */
export type Values = Record<string, string | string[]>;

export type FieldKind =
  | 'text'
  | 'longtext'
  | 'name'
  | 'cpf'
  | 'rg'
  | 'date'
  | 'cellphone'
  | 'phone'
  | 'email'
  | 'cep'
  | 'choice'
  | 'select'
  | 'uf'
  | 'city'
  | 'multi'
  | 'grid'
  | 'consent';

export interface Field {
  id: string;
  label: string;
  kind: FieldKind;
  /** Obrigatória por padrão; pode depender das respostas (ex.: só para menores de idade). */
  required?: boolean | ((v: Values) => boolean);
  hint?: string;
  placeholder?: string;
  options?: string[];
  /** Opções que dependem de outra resposta (ex.: cursos da modalidade escolhida). */
  optionsFrom?: (v: Values) => string[];
  /** Ao mudar esta resposta, apaga estas outras (que dependiam dela). */
  clears?: string[];
  /** Acrescenta "Outro" com um campo de texto (`<id>_outro`). */
  other?: boolean;
  /** Opção que desmarca as outras ("Nenhuma", "Não utilizo"). */
  exclusive?: string;
  /** Linhas da grade (kind 'grid'); as colunas vêm de `options`. */
  rows?: string[];
  /** Para 'city': o campo de estado que filtra as cidades. */
  ufField?: string;
  /** Mostra só quando a condição vale. Campo escondido não é validado nem enviado. */
  showIf?: (v: Values) => boolean;
  /** Para datas: não pode ser antes desta outra data (ex.: expedição do RG depois do nascimento). */
  afterField?: string;
  /** Para CPFs: não pode ser igual a estes outros CPFs. */
  differentFrom?: string[];
  autoComplete?: string;
}

export interface Step {
  id: string;
  /** Etapa só aparece quando a condição vale (ex.: responsável só para menores). */
  showIf?: (v: Values) => boolean;
  title: string;
  /** Título curto para a barra de etapas. */
  short: string;
  description?: string;
  fields: Field[];
}

export const OUTRO = 'Outro';

/**
 * Respostas guardadas pela conferência na lista de aprovados (não viram coluna da planilha):
 * a chave "cpf|nascimento" já conferida e o curso da aprovação, quando a lista diz.
 */
export const APROVADO_CHAVE = '_aprovado';
export const APROVADO_MODALIDADE = '_aprovado_modalidade';
export const APROVADO_CURSO = '_aprovado_curso';

/** Opção da configuração que corresponde ao texto da lista ("farmacia" → "Farmácia"), ou "". */
export function matchOption(text: string, options: string[]): string {
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const t = norm(text);
  return t ? (options.find((o) => norm(o) === t) ?? '') : '';
}

const str = (v: Values, id: string) => (typeof v[id] === 'string' ? (v[id] as string) : '');

/** Modalidade Subsequente (quem já terminou o ensino médio; pode ser adulto). */
export const subsequente = (v: Values) => str(v, 'modalidade') === 'Subsequente';

/** Idade pela data de nascimento digitada (null enquanto a data está incompleta ou inválida). */
export function ageOf(v: Values, today = new Date()): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str(v, 'aluno_nascimento'));
  if (!m) return null;
  const birth = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (birth.getDate() !== Number(m[1])) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const d = today.getMonth() - birth.getMonth();
  if (d < 0 || (d === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Maior de idade: o próprio aluno responde e os dados dos pais ficam opcionais. */
export const adulto = (v: Values) => (ageOf(v) ?? 0) >= 18;
const menor = (v: Values) => !adulto(v);

const ESCOLARIDADE = [
  'Não estudou',
  'Fundamental incompleto',
  'Fundamental completo',
  'Médio incompleto',
  'Médio completo',
  'Superior incompleto',
  'Superior completo',
  'Especialização',
  'Mestrado',
  'Doutorado',
  'Não sei',
];

const ORGAOS = ['SDS-PE', 'SSP-PE', 'PC', 'DETRAN', 'Polícia Federal'];

const COMPETENCIAS = [
  'Conhecimento: valorizar e usar os conhecimentos sobre o mundo físico, social, cultural e digital',
  'Pensamento científico, crítico e criativo: exercitar a curiosidade e usar as ciências com crítica e criatividade',
  'Repertório cultural: valorizar as diversas manifestações artísticas e culturais',
  'Comunicação: usar diferentes linguagens',
  'Cultura digital: compreender, usar e criar tecnologias digitais de forma crítica, significativa e ética',
  'Trabalho e projeto de vida: valorizar e se apropriar de conhecimentos e experiências',
  'Argumentação: argumentar com base em fatos, dados e informações confiáveis',
  'Autoconhecimento e autocuidado: conhecer-se e compreender-se na diversidade humana',
  'Empatia e cooperação: exercitar a empatia, o diálogo, a resolução de conflitos e a cooperação',
  'Responsabilidade e cidadania: agir com autonomia, responsabilidade, flexibilidade, resiliência e determinação',
];

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Faixas de renda a partir do salário mínimo do ano. */
export function rendaOptions(salario: number): string[] {
  return [
    `Menos de 1 salário (menos de ${brl(salario)})`,
    ...Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      return `${n} ${n === 1 ? 'salário' : 'salários'} (${brl(salario * n)})`;
    }),
    'Mais de 10 salários',
  ];
}

/** Campos de um familiar (mãe, pai ou outra pessoa), com prefixo e condição de exibição. */
function family(
  prefix: string,
  who: string,
  show: (v: Values) => boolean,
  extra: Field[] = [],
  /** Os dados além do nome são obrigatórios? (mãe e pai: só para menores de idade). */
  req: (v: Values) => boolean = () => true,
): Field[] {
  return [
    { id: `${prefix}_nome`, label: `Nome completo ${who}`, kind: 'name', showIf: show, autoComplete: 'off' },
    ...extra,
    {
      id: `${prefix}_cpf`,
      label: `CPF ${who}`,
      kind: 'cpf',
      required: req,
      showIf: show,
      differentFrom: ['aluno_cpf', 'mae_cpf', 'pai_cpf'].filter((id) => id !== `${prefix}_cpf`),
    },
    { id: `${prefix}_rg`, label: `RG ${who}`, kind: 'rg', required: false, showIf: show },
    {
      id: `${prefix}_rg_orgao`,
      label: `Órgão expedidor do RG ${who}`,
      kind: 'select',
      options: ORGAOS,
      other: true,
      required: false,
      showIf: (v) => show(v) && !!str(v, `${prefix}_rg`),
    },
    { id: `${prefix}_celular`, label: `Celular (WhatsApp) ${who}`, kind: 'cellphone', required: req, showIf: show },
    { id: `${prefix}_email`, label: `E-mail ${who}`, kind: 'email', required: false, showIf: show },
    { id: `${prefix}_escolaridade`, label: `Escolaridade ${who}`, kind: 'select', options: ESCOLARIDADE, required: req, showIf: show },
    { id: `${prefix}_profissao`, label: `Profissão ${who}`, kind: 'text', required: req, showIf: show, placeholder: 'Ex.: cozinheira, pedreiro, do lar' },
  ];
}

const maeViva = (v: Values) => str(v, 'mae_situacao') === 'Viva';
const paiVivo = (v: Values) => str(v, 'pai_situacao') === 'Vivo';
const outraPessoa = (v: Values) => str(v, 'resp_quem') === 'Outra pessoa';
const brasil = (v: Values) => str(v, 'nasc_pais') === 'Brasil';

/** As etapas do formulário. Também definem as colunas da planilha, na mesma ordem. */
export function buildSteps(config: Config): Step[] {
  return [
    {
      id: 'inicio',
      title: 'Antes de começar',
      short: 'Início',
      description:
        'Leva uns 15 minutos. Tenha à mão: seu RG e CPF, um comprovante de endereço com CEP e os documentos da sua mãe e do seu pai. O que você digitar fica salvo neste aparelho até enviar.',
      fields: [
        {
          id: 'consentimento',
          kind: 'consent',
          label:
            'Li e concordo: meus dados (inclusive de saúde e cor/raça) serão usados só pela escola para a matrícula e o acompanhamento escolar, conforme a LGPD.',
        },
      ],
    },
    {
      id: 'identificacao',
      title: 'Confirme quem é você',
      short: 'Identidade',
      description: 'A escola confere seu CPF e sua data de nascimento na lista de aprovados antes de você continuar.',
      fields: [
        {
          id: 'aluno_cpf',
          label: 'Seu CPF',
          kind: 'cpf',
          hint: 'Está no RG novo, na certidão de nascimento recente ou no app gov.br.',
        },
        { id: 'aluno_nascimento', label: 'Data de nascimento', kind: 'date', autoComplete: 'bday' },
      ],
    },
    {
      id: 'curso',
      title: 'Seu curso',
      short: 'Curso',
      fields: [
        {
          id: 'modalidade',
          label: 'Modalidade',
          kind: 'choice',
          options: Object.keys(config.cursos),
          // Se a lista de aprovados diz a modalidade, só ela aparece.
          optionsFrom: (v) => (str(v, APROVADO_MODALIDADE) ? [str(v, APROVADO_MODALIDADE)] : Object.keys(config.cursos)),
          clears: ['curso'],
          hint: 'Integrado: junto com o ensino médio. Subsequente: para quem já terminou o ensino médio.',
        },
        {
          id: 'curso',
          label: 'Curso',
          kind: 'choice',
          optionsFrom: (v) => {
            const cursos = config.cursos[str(v, 'modalidade')] ?? [];
            const aprovado = str(v, APROVADO_CURSO);
            return aprovado && cursos.includes(aprovado) ? [aprovado] : cursos;
          },
          showIf: (v) => !!str(v, 'modalidade'),
        },
      ],
    },
    {
      id: 'aluno',
      title: 'Sobre você',
      short: 'Você',
      fields: [
        { id: 'aluno_nome', label: 'Seu nome completo', kind: 'name', hint: 'Igual ao do RG ou da certidão.', autoComplete: 'name' },
        { id: 'aluno_sexo', label: 'Sexo', kind: 'choice', options: ['Feminino', 'Masculino'] },
        {
          id: 'aluno_cor',
          label: 'Cor ou raça',
          kind: 'choice',
          options: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não declarar'],
          hint: 'Como no Censo Escolar.',
        },
        {
          id: 'aluno_sangue',
          label: 'Tipo sanguíneo',
          kind: 'choice',
          options: ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Não sei'],
          required: false,
        },
      ],
    },
    {
      id: 'documentos',
      title: 'Seus documentos',
      short: 'Documentos',
      fields: [
        { id: 'aluno_rg', label: 'Número do RG', kind: 'rg', hint: 'Só os números (e o X, se tiver).' },
        { id: 'aluno_rg_orgao', label: 'Órgão expedidor do RG', kind: 'select', options: ORGAOS, other: true },
        { id: 'aluno_rg_uf', label: 'Estado que emitiu o RG', kind: 'uf' },
        { id: 'aluno_rg_data', label: 'Data de expedição do RG', kind: 'date', afterField: 'aluno_nascimento' },
      ],
    },
    {
      id: 'nascimento',
      title: 'Onde você nasceu',
      short: 'Nascimento',
      fields: [
        { id: 'nasc_pais', label: 'País', kind: 'choice', options: ['Brasil', 'Outro país'] },
        {
          id: 'nasc_pais_outro',
          label: 'Qual país?',
          kind: 'text',
          showIf: (v) => str(v, 'nasc_pais') === 'Outro país',
        },
        { id: 'nasc_uf', label: 'Estado', kind: 'uf', clears: ['nasc_cidade'], showIf: brasil },
        { id: 'nasc_cidade', label: 'Cidade', kind: 'city', ufField: 'nasc_uf', showIf: (v) => brasil(v) && !!str(v, 'nasc_uf') },
      ],
    },
    {
      id: 'escola_anterior',
      title: 'Seu ensino médio',
      short: 'Ensino médio',
      description: 'O curso subsequente é para quem já terminou o ensino médio.',
      showIf: subsequente,
      fields: [
        { id: 'em_escola', label: 'Escola onde terminou o ensino médio', kind: 'text' },
        { id: 'em_tipo', label: 'Essa escola era', kind: 'choice', options: ['Pública', 'Particular'] },
        { id: 'em_uf', label: 'Estado da escola', kind: 'uf', clears: ['em_cidade'] },
        { id: 'em_cidade', label: 'Cidade da escola', kind: 'city', ufField: 'em_uf', showIf: (v) => !!str(v, 'em_uf') },
        {
          id: 'em_ano',
          label: 'Ano em que terminou',
          kind: 'select',
          options: Array.from({ length: 56 }, (_, i) => String(config.ano - i)),
        },
      ],
    },
    {
      id: 'contato',
      title: 'Contato e endereço',
      short: 'Endereço',
      description: 'Digite o CEP e o endereço aparece sozinho. Não sabe o CEP? Dá para buscar pela rua.',
      fields: [
        { id: 'aluno_celular', label: 'Seu celular (WhatsApp)', kind: 'cellphone', autoComplete: 'tel-national' },
        { id: 'aluno_telefone', label: 'Telefone fixo de casa', kind: 'phone', required: false },
        { id: 'aluno_email', label: 'Seu e-mail', kind: 'email', autoComplete: 'email' },
        { id: 'end_cep', label: 'CEP', kind: 'cep', autoComplete: 'postal-code' },
        { id: 'end_rua', label: 'Rua', kind: 'text', autoComplete: 'address-line1' },
        { id: 'end_numero', label: 'Número', kind: 'text', hint: 'Sem número? Escreva S/N.' },
        { id: 'end_complemento', label: 'Complemento', kind: 'text', required: false, placeholder: 'Apto, bloco, casa A…' },
        { id: 'end_bairro', label: 'Bairro', kind: 'text' },
        { id: 'end_uf', label: 'Estado', kind: 'uf', clears: ['end_cidade'] },
        { id: 'end_cidade', label: 'Cidade', kind: 'city', ufField: 'end_uf' },
      ],
    },
    {
      id: 'saude',
      title: 'Saúde e dia a dia',
      short: 'Saúde',
      fields: [
        {
          id: 'saude_deficiencia',
          label: 'Você tem deficiência, altas habilidades ou superdotação?',
          kind: 'choice',
          options: ['Não', 'Sim'],
        },
        {
          id: 'saude_deficiencia_qual',
          label: 'Qual?',
          kind: 'text',
          showIf: (v) => str(v, 'saude_deficiencia') === 'Sim',
        },
        { id: 'saude_alergia', label: 'Tem alergia a algum remédio?', kind: 'choice', options: ['Não', 'Sim'] },
        { id: 'saude_alergia_qual', label: 'A qual remédio?', kind: 'text', showIf: (v) => str(v, 'saude_alergia') === 'Sim' },
        { id: 'saude_medicacao', label: 'Usa medicação controlada?', kind: 'choice', options: ['Não', 'Sim'] },
        { id: 'saude_medicacao_qual', label: 'Qual medicação?', kind: 'text', showIf: (v) => str(v, 'saude_medicacao') === 'Sim' },
        { id: 'uniforme', label: 'Tamanho do uniforme', kind: 'choice', options: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
        {
          id: 'mora_com',
          label: 'Com quem você mora?',
          kind: 'multi',
          options: ['Mãe', 'Pai', 'Avós', 'Tios', 'Irmãos'],
          other: true,
          hint: 'Marque todos.',
        },
        { id: 'emerg_nome', label: 'Em emergência, procurar quem?', kind: 'name', hint: 'Nome completo de um adulto.' },
        { id: 'emerg_parentesco', label: 'Parentesco', kind: 'text', placeholder: 'Ex.: mãe, avó, tio' },
        { id: 'emerg_telefone', label: 'Telefone dessa pessoa', kind: 'phone' },
      ],
    },
    {
      id: 'mae',
      title: 'Sua mãe',
      short: 'Mãe',
      fields: [
        { id: 'mae_situacao', label: 'Sua mãe', kind: 'choice', options: ['Viva', 'Falecida', 'Não consta na certidão'] },
        ...family('mae', 'da mãe', maeViva, [], menor),
      ],
    },
    {
      id: 'pai',
      title: 'Seu pai',
      short: 'Pai',
      fields: [
        { id: 'pai_situacao', label: 'Seu pai', kind: 'choice', options: ['Vivo', 'Falecido', 'Não consta na certidão'] },
        ...family('pai', 'do pai', paiVivo, [], menor),
      ],
    },
    {
      id: 'responsavel',
      title: 'Responsável pela matrícula',
      short: 'Responsável',
      showIf: menor,
      description: 'Quem responde por você na escola.',
      fields: [
        {
          id: 'resp_quem',
          label: 'Quem é o responsável?',
          kind: 'choice',
          options: ['Mãe', 'Pai', 'Outra pessoa'],
        },
        ...family('resp', 'do responsável', outraPessoa, [
          { id: 'resp_parentesco', label: 'Parentesco', kind: 'text', showIf: outraPessoa, placeholder: 'Ex.: avó, tia, padrasto' },
        ]),
      ],
    },
    {
      id: 'socio1',
      title: 'Sua casa e sua rotina',
      short: 'Casa',
      description: 'Estas respostas ajudam a escola a conhecer os estudantes. Não há resposta certa.',
      fields: [
        { id: 'moradia', label: 'Tipo de moradia', kind: 'choice', options: ['Casa alugada', 'Casa própria', 'Apartamento alugado', 'Apartamento próprio', 'Casa cedida'], other: true },
        { id: 'pessoas_casa', label: 'Contando com você, quantas pessoas moram na sua casa?', kind: 'select', options: [...Array.from({ length: 10 }, (_, i) => String(i + 1)), 'Mais de 10'] },
        { id: 'irmaos', label: 'Quantos irmãos você tem?', kind: 'select', options: ['Nenhum', ...Array.from({ length: 10 }, (_, i) => String(i + 1)), 'Mais de 10'] },
        { id: 'percurso', label: 'Quanto tempo você leva de casa até a escola?', kind: 'choice', options: ['Menos de 30 minutos', 'De 30 minutos a 1 hora', 'Mais de 1 hora'] },
        { id: 'transporte', label: 'Como você chega à escola?', kind: 'multi', options: ['A pé', 'Ônibus', 'Metrô', 'Carro', 'Moto', 'Bicicleta'], other: true, hint: 'Marque todos.' },
        { id: 'atividade_fisica', label: 'Que atividade física você faz fora da escola?', kind: 'multi', options: ['Nenhuma', 'Natação', 'Academia', 'Vôlei', 'Futebol', 'Judô'], exclusive: 'Nenhuma', other: true },
        { id: 'renda', label: 'Renda da família por mês', kind: 'choice', options: rendaOptions(config.salarioMinimo), hint: `Salário mínimo de ${config.ano}: ${brl(config.salarioMinimo)}.` },
        { id: 'beneficio', label: 'Sua família recebe algum benefício social?', kind: 'choice', options: ['Não', 'Sim'] },
        { id: 'beneficio_qual', label: 'Qual benefício?', kind: 'text', showIf: (v) => str(v, 'beneficio') === 'Sim', placeholder: 'Ex.: Bolsa Família, BPC' },
        { id: 'computador', label: 'Tem computador em casa?', kind: 'choice', options: ['Sim', 'Não'] },
        { id: 'internet', label: 'Tem acesso à internet?', kind: 'choice', options: ['Sim', 'Não'] },
      ],
    },
    {
      id: 'socio2',
      title: 'Cultura e leitura',
      short: 'Cultura',
      fields: [
        { id: 'cultura', label: 'Você vai a exposições, museu, teatro ou cinema?', kind: 'choice', options: ['Só com a escola', 'Com pais, amigos ou responsáveis', 'Não costumo ir'] },
        { id: 'midias', label: 'Quais meios de comunicação você mais usa?', kind: 'multi', options: ['Televisão', 'Jornal', 'Internet', 'Revista', 'Rádio', 'Redes sociais', 'Livros'] },
        { id: 'leitura_freq', label: 'Com que frequência você lê (qualquer leitura)?', kind: 'choice', options: ['Nunca', 'Raramente', 'Muitas vezes, mas não todo dia', 'Todo dia'] },
        { id: 'leitura_tipo', label: 'O que você costuma ler?', kind: 'multi', options: ['Crônicas', 'Biografias', 'Charges', 'Contos', 'Autoajuda', 'Mangá', 'Poemas', 'Peças de teatro', 'Ficção', 'Jornal impresso', 'Jornal online', 'Blogs', 'Romance'], other: true },
        { id: 'fim_de_semana', label: 'O que você mais faz nos fins de semana?', kind: 'longtext' },
      ],
    },
    {
      id: 'socio3',
      title: 'Escola e aprendizagem',
      short: 'Escola',
      fields: [
        {
          id: 'opiniao_escola',
          label: 'Para você, o que é a escola?',
          kind: 'multi',
          options: [
            'Lugar dos melhores eventos e encontros',
            'Lugar onde faço amigos',
            'Vale a pena porque assim posso ter um futuro profissional',
            'Vou porque sou obrigado',
            'Não tenho opinião formada',
          ],
        },
        { id: 'conheceu', label: `Como você conheceu a ${config.escola}?`, kind: 'multi', options: ['Jornal', 'Internet', 'Rede social', 'Televisão', 'Estudantes e professores da escola', 'Pela escola em que estudo'], other: true },
        { id: 'motivo', label: `O que levou você a fazer a seleção da ${config.escola}?`, kind: 'multi', options: ['O curso técnico', 'Os professores', 'A estrutura da escola', 'Orientação da família', 'Indicação de amigos', 'A fama da escola'], other: true },
        { id: 'tecnologia', label: 'Você aprende melhor com tecnologia (computador, vídeos, projetor)?', kind: 'choice', options: ['Raramente', 'Às vezes', 'Sempre'] },
        {
          id: 'recursos',
          label: 'O que o professor pode usar na aula para você aprender melhor?',
          kind: 'multi',
          options: ['Trabalho individual', 'Trabalho em grupo', 'Seminários e rodas de conversa', 'Dinâmicas e vivências', 'Teatro', 'Música', 'Poesia', 'Filmes', 'Maquetes', 'Jogos', 'Robótica', 'Palestras com profissionais', 'Visita a museus', 'Visita a ambientes de trabalho', 'Campanhas sociais e solidárias', 'Internet', 'Vídeos'],
          other: true,
        },
        { id: 'competencias_aprender', label: 'Quais competências você quer desenvolver na escola?', kind: 'multi', options: COMPETENCIAS },
        { id: 'competencias_compartilhar', label: 'Quais competências você quer compartilhar com os colegas?', kind: 'multi', options: COMPETENCIAS },
        {
          id: 'interesses',
          label: 'Destes temas, quais você quer aprender ou compartilhar?',
          kind: 'grid',
          options: ['Quero aprender', 'Quero compartilhar', 'Não tenho interesse'],
          rows: ['Teatro', 'Dança', 'Música', 'Esporte e e-sports', 'Desenho', 'Grafite', 'Poesia', 'Comunicação e expressão', 'Informática', 'Jogos eletrônicos', 'Liderança', 'Negociação', 'Solidariedade', 'Idiomas', 'Artesanato', 'Culinária', 'Programação e cálculos', 'Design'],
        },
        { id: 'trabalho_grupo', label: 'Para você, trabalho em grupo é…', kind: 'choice', options: ['Importante', 'Um recurso a mais', 'Não muda muito as coisas', 'Desnecessário'] },
      ],
    },
    {
      id: 'futuro',
      title: 'Seu futuro',
      short: 'Futuro',
      fields: [
        { id: 'pensa_futuro', label: 'Você pensa no seu futuro?', kind: 'choice', options: ['Sim', 'Às vezes', 'Não'], required: false },
        { id: 'quer_ser', label: 'O que você quer ser no futuro?', kind: 'text' },
        { id: 'superior', label: 'Pretende fazer faculdade?', kind: 'choice', options: ['Sim', 'Não', 'Ainda não sei'] },
        { id: 'superior_area', label: 'Em qual área?', kind: 'text', showIf: (v) => str(v, 'superior') === 'Sim' },
      ],
    },
  ];
}

/** O campo aparece agora? (sem condição, sempre). */
export const isVisible = (f: Field, v: Values) => !f.showIf || f.showIf(v);

/** A etapa aparece agora? */
export const isStepVisible = (s: Step, v: Values) => !s.showIf || s.showIf(v);

/** A resposta é obrigatória agora? */
export const isRequired = (f: Field, v: Values) =>
  typeof f.required === 'function' ? f.required(v) : f.required !== false;

/** Opções do campo agora (fixas, ou dependentes de outra resposta). */
export const optionsOf = (f: Field, v: Values) => (f.optionsFrom ? f.optionsFrom(v) : (f.options ?? []));

/** Campos que viram colunas da planilha (o consentimento vira uma coluna "Consentimento LGPD"). */
export const allFields = (steps: Step[]) => steps.flatMap((s) => s.fields);
