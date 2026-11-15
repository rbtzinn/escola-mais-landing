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
    title: 'Pais que sobrecarregam a gestão',
    text: 'Grupos de WhatsApp por série e dezenas de perguntas repetidas. É impossível responder a todo mundo a tempo.',
  },
  {
    icon: 'inbox',
    title: 'Demandas de todos os lados ao mesmo tempo',
    text: 'Secretaria de Educação, GRE, famílias, professores e alunos pedindo coisas ao mesmo tempo, sem fila nem prioridade.',
  },
  {
    icon: 'paper',
    title: 'Papelada e contagens manuais',
    text: 'Declarações, contagem diária de alunos e de quem almoça, e horário refeito na mão quando um professor falta.',
  },
];

export const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'message',
    title: 'Mensagens automáticas aos pais',
    text: 'Avisos de falta, reunião, boletim e comunicados por WhatsApp ou SMS, com modelos prontos. Respostas rápidas para as perguntas que se repetem.',
  },
  {
    icon: 'sheet',
    title: 'Planilhas viram dashboards',
    text: 'Suba a planilha que a escola já usa e receba painéis de notas, faltas e turmas, e relatórios prontos para o conselho escolar e o PDDE.',
  },
  {
    icon: 'check',
    title: 'Frequência, chegada e atrasos',
    text: 'Contagem diária de alunos e registro de chegada, com aviso automático à família no 3º atraso. Quem já usa o SIEPE importa a exportação; quem não tem sistema usa a chamada digital.',
  },
  {
    icon: 'chart',
    title: 'Notas e alunos em risco',
    text: 'Veja turmas e alunos com queda de desempenho e faltas seguidas, e faça a busca ativa antes do fim do bimestre.',
  },
  {
    icon: 'inbox',
    title: 'Painel de demandas',
    text: 'Reúna pedidos da Secretaria, da GRE, das famílias e dos professores em uma fila com prazo, prioridade e responsável.',
  },
  {
    icon: 'file',
    title: 'Declarações e documentos',
    text: 'Emita declarações em um clique e guarde documentos em um arquivo compartilhado, sem limite de computadores.',
  },
  {
    icon: 'calendar',
    title: 'Horário e professores',
    text: 'Registre a frequência dos professores e reorganize o horário dos alunos na hora, quando alguém falta.',
  },
  {
    icon: 'utensils',
    title: 'Merenda e estoque',
    text: 'Contagem diária de quem almoça e controle do que entra, sai e vence, com aviso antes de acabar.',
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
  { value: 12, suffix: ' h', label: 'a menos por semana em planilhas e papelada' },
  { value: 85, suffix: '%', label: 'das famílias avisadas no mesmo dia' },
  { value: 60, suffix: '%', label: 'menos mensagens repetidas no WhatsApp' },
  { value: 1, suffix: ' min', label: 'para emitir uma declaração' },
];

export const TESTIMONIALS = [
  {
    quote:
      'Antes, o que chegava da Secretaria, da GRE e das famílias se misturava no WhatsApp. Agora tudo entra em uma fila, com prazo e responsável.',
    role: 'Diretor de escola estadual',
    context: 'Escola técnica',
  },
  {
    quote:
      'A declaração que levava a manhã sai em minutos, e a contagem do dia fecha sem papel. A secretaria respira.',
    role: 'Secretária escolar',
    context: 'Escola de 600 alunos',
  },
  {
    quote:
      'Os pais recebem o aviso sozinhos e, quando um professor falta, refaço o horário dos alunos na hora, sem planilha.',
    role: 'Coordenadora pedagógica',
    context: 'Ensino médio',
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
    id: 'documentos',
    question: 'Onde ficam os documentos da escola?',
    answer:
      'Em um arquivo compartilhado da própria escola, com controle de acesso por perfil e sem limite de computadores. Cada arquivo tem uma única versão, o que evita duplicatas.',
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
  'Exemplo das mensagens automáticas e do painel de demandas',
];
