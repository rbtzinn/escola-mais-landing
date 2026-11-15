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
    title: 'Planilhas soltas e retrabalho',
    text: 'Notas, faltas e listas em arquivos diferentes. Montar um relatório toma a tarde inteira.',
  },
  {
    icon: 'message',
    title: 'Pais que só descobrem tarde',
    text: 'Falta, reunião e boletim viram ligação, bilhete ou mensagem digitada uma a uma no WhatsApp.',
  },
  {
    icon: 'paper',
    title: 'Aluno em risco sem alerta',
    text: 'Faltas seguidas e queda de nota só aparecem quando o aluno já está quase deixando a escola.',
  },
  {
    icon: 'file',
    title: 'Prestação de contas no sufoco',
    text: 'Reunir dados para o conselho escolar, o PDDE e a secretaria vira correria no fim do prazo.',
  },
];

export const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'message',
    title: 'Mensagens automáticas aos pais',
    text: 'Avisos de falta, reunião, boletim e comunicados por WhatsApp ou SMS, com modelos prontos. Você aprova o que sai.',
  },
  {
    icon: 'sheet',
    title: 'Planilhas viram dashboards',
    text: 'Suba a planilha que a escola já usa e receba painéis de notas, faltas e turmas, e relatórios prontos para o conselho escolar e o PDDE.',
  },
  {
    icon: 'check',
    title: 'Frequência e busca ativa',
    text: 'Chamada digital para quem não tem sistema e importação de dados para quem já usa o SIEPE ou similar. Alertas de faltas seguidas e lista de busca ativa.',
  },
  {
    icon: 'chart',
    title: 'Notas e alunos em risco',
    text: 'Veja turmas e alunos com queda de desempenho e aja cedo, antes do fim do bimestre.',
  },
  {
    icon: 'utensils',
    title: 'Merenda e estoque',
    text: 'Controle simples do que entra, sai e vence, com aviso antes de acabar.',
  },
  {
    icon: 'wrench',
    title: 'Manutenção e ocorrências',
    text: 'Chamados de reparo e registro de ocorrências da escola, cada um com responsável e prazo.',
  },
];

export const STEPS = [
  {
    title: 'Envie suas planilhas',
    text: 'Suba matrículas, notas e faltas das planilhas que você já usa, ou a exportação do sistema atual, como o SIEPE.',
  },
  {
    title: 'Veja a escola em um painel',
    text: 'Em minutos, os dados viram dashboards de turmas, frequência e notas, sem refazer nada.',
  },
  {
    title: 'Deixe o Escola+ avisar',
    text: 'Mensagens automáticas aos pais, alertas de alunos em risco e relatórios prontos para o conselho.',
  },
];

export const IMPACT: { value: number; prefix?: string; suffix?: string; label: string }[] = [
  { value: 12, suffix: ' h', label: 'a menos por semana em planilhas' },
  { value: 85, suffix: '%', label: 'das famílias avisadas no mesmo dia' },
  { value: 30, suffix: '%', label: 'mais rápido para achar aluno em risco' },
  { value: 3, suffix: ' min', label: 'para gerar um relatório' },
];

export const TESTIMONIALS = [
  {
    quote:
      'Eu passava a sexta inteira juntando planilhas. Agora subo os arquivos e o painel da escola já está pronto na segunda.',
    role: 'Diretora de escola municipal',
    context: 'Ensino fundamental',
  },
  {
    quote:
      'Os pais recebem o aviso de falta no mesmo dia, sem ninguém precisar ligar. A busca ativa ficou muito mais rápida.',
    role: 'Coordenador pedagógico de escola estadual',
    context: 'Ensino médio',
  },
  {
    quote:
      'Na hora de prestar contas ao conselho escolar, o relatório já sai organizado. É só conferir e imprimir.',
    role: 'Secretária escolar',
    context: 'Escola de 600 alunos',
  },
];

export const FAQ: AccordionItem[] = [
  {
    id: 'lgpd',
    question: 'Como os dados dos alunos são protegidos?',
    answer:
      'Os dados pertencem à escola. Há controle de acesso por perfil, registro de quem acessou e cuidado extra com dados de menores, conforme a LGPD.',
  },
  {
    id: 'sistema',
    question: 'Preciso trocar o sistema que já uso, como o SIEPE?',
    answer:
      'Não. Se a escola já registra a frequência em um sistema como o SIEPE, basta importar a exportação ou a planilha. Quem não tem sistema pode usar a chamada digital do Escola+.',
  },
  {
    id: 'mensagens',
    question: 'Como as mensagens aos pais são enviadas?',
    answer:
      'Por WhatsApp ou SMS, a partir de modelos prontos. A escola define quais avisos são automáticos e aprova o texto antes de sair.',
  },
  {
    id: 'tecnologia',
    question: 'Preciso entender de tecnologia?',
    answer:
      'Não. Você sobe a planilha que já tem e o painel é montado para você. Há um guia passo a passo e suporte durante a implantação.',
  },
  {
    id: 'offline',
    question: 'Funciona com internet instável?',
    answer:
      'Os registros básicos funcionam sem conexão e sincronizam quando o sinal volta, pensando em escolas com internet limitada.',
  },
  {
    id: 'custo',
    question: 'Quanto custa?',
    answer:
      'O plano é por escola, conforme o número de alunos. Na demonstração apresentamos uma estimativa para a sua realidade.',
  },
];

export const DEMO_BENEFITS = [
  'Apresentação de cerca de 30 minutos, online',
  'Painel montado com a planilha da sua escola',
  'Exemplo das mensagens automáticas para os pais',
];
