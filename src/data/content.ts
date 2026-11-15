import type { IconName } from '@/components/icons';
import type { AccordionItem } from '@/components/ui/Accordion';

export const NAV_LINKS = [
  { href: '#problemas', label: 'Problemas' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#impacto', label: 'Impacto' },
  { href: '#faq', label: 'Dúvidas' },
];

export const PROBLEMS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'sheet',
    title: 'Planilhas soltas',
    text: 'Cada escola mantém a sua versão. Para consolidar, a secretaria junta arquivos na mão e os números nunca fecham.',
  },
  {
    icon: 'paper',
    title: 'Frequência no papel',
    text: 'Diários preenchidos à mão chegam atrasados. Quando a ausência vira alerta, o aluno já está em risco de evasão.',
  },
  {
    icon: 'box',
    title: 'Merenda e estoque sem controle',
    text: 'Sem registro de entradas e saídas, falta alimento em uma escola enquanto vence em outra.',
  },
  {
    icon: 'file',
    title: 'Prestação de contas difícil',
    text: 'Reunir comprovantes e dados para órgãos de controle e para a LAI consome semanas de equipes já sobrecarregadas.',
  },
];

export const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'check',
    title: 'Frequência digital',
    text: 'Chamada pelo celular ou tablet, mesmo com internet instável. Faltas consecutivas geram alertas à coordenação.',
  },
  {
    icon: 'chart',
    title: 'Painel de indicadores',
    text: 'Evasão, notas e frequência por escola, turma e rede, atualizados e prontos para decisões pedagógicas.',
  },
  {
    icon: 'utensils',
    title: 'Merenda e estoque',
    text: 'Controle de entradas, saídas, validade e cardápio, com aviso antes que o item acabe.',
  },
  {
    icon: 'wrench',
    title: 'Manutenção da estrutura',
    text: 'Chamados de reparo com prioridade, responsável e prazo, do banheiro entupido ao telhado.',
  },
  {
    icon: 'message',
    title: 'Comunicação com as famílias',
    text: 'Avisos, reuniões e faltas enviados aos responsáveis em um canal único e registrado.',
  },
  {
    icon: 'shield',
    title: 'Prestação de contas e LAI',
    text: 'Portal público com dados abertos da rede e relatórios prontos para órgãos de controle.',
  },
];

export const STEPS = [
  {
    title: 'Diagnóstico e importação',
    text: 'Mapeamos as planilhas e sistemas em uso e importamos matrículas, turmas e cadastros da rede.',
  },
  {
    title: 'Implantação e formação',
    text: 'Configuramos as escolas e treinamos diretores, secretários escolares e professores no próprio ritmo.',
  },
  {
    title: 'Acompanhamento com indicadores',
    text: 'A secretaria passa a decidir com dados em tempo real, e as famílias e a sociedade acompanham os resultados.',
  },
];

export const IMPACT: { value: number; prefix?: string; suffix?: string; label: string }[] = [
  { value: 1200, label: 'escolas acompanhadas' },
  { value: 380, suffix: ' mil', label: 'estudantes na plataforma' },
  { value: 18, prefix: '−', suffix: '%', label: 'de evasão em redes piloto' },
  { value: 70, suffix: '%', label: 'menos tempo montando relatórios' },
];

export const TESTIMONIALS = [
  {
    quote:
      'Pela primeira vez conseguimos ver, na mesma tela, as escolas com mais faltas e agir na semana, não no fim do bimestre.',
    role: 'Secretária municipal de Educação',
    context: 'Município de médio porte',
  },
  {
    quote:
      'A chamada pelo celular tirou a papelada da secretaria da escola. Hoje começo a manhã já sabendo quem precisa de contato.',
    role: 'Diretora de escola estadual',
    context: 'Rede estadual',
  },
  {
    quote:
      'Montar a prestação de contas era uma maratona. Agora os dados já estão organizados e é só revisar e exportar.',
    role: 'Coordenador pedagógico',
    context: 'Município de pequeno porte',
  },
];

export const FAQ: AccordionItem[] = [
  {
    id: 'lgpd',
    question: 'Como a plataforma trata os dados de alunos e a LGPD?',
    answer:
      'Os dados ficam sob responsabilidade da rede de ensino. Aplicamos controle de acesso por perfil, registro de acessos e minimização de dados de menores, conforme a LGPD.',
  },
  {
    id: 'integracao',
    question: 'Integra com os sistemas que já usamos, como o Educacenso?',
    answer:
      'Sim. Importamos cadastros por planilha ou integração e exportamos arquivos no formato exigido pelos sistemas oficiais, evitando retrabalho.',
  },
  {
    id: 'offline',
    question: 'Funciona onde a internet é instável?',
    answer:
      'A chamada e os registros básicos funcionam sem conexão e sincronizam quando o sinal volta, pensando em escolas rurais e de áreas remotas.',
  },
  {
    id: 'treinamento',
    question: 'Como é o treinamento das equipes?',
    answer:
      'Há formação por perfil (secretaria, direção, professores), com guias em vídeo e texto e um canal de suporte durante a implantação.',
  },
  {
    id: 'custo',
    question: 'Como funciona a contratação e o custo?',
    answer:
      'O modelo é de assinatura por porte da rede, com opções de contratação compatíveis com o poder público. Na demonstração apresentamos uma estimativa.',
  },
  {
    id: 'lai',
    question: 'A plataforma ajuda a cumprir a Lei de Acesso à Informação?',
    answer:
      'Sim. O portal de transparência publica indicadores e dados abertos da rede, e os relatórios de prestação de contas saem organizados para os órgãos de controle.',
  },
];

export const DEMO_BENEFITS = [
  'Apresentação de cerca de 40 minutos, online',
  'Painel com dados da sua rede, não só de exemplo',
  'Estimativa de implantação e de investimento',
];
