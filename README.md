# Escola+ (landing page)

Landing de apresentação do **Escola+**, uma plataforma de gestão para a direção e a coordenação de **uma escola pública**. Destaques apresentados:

- Mensagens automáticas aos pais por WhatsApp ou SMS.
- Planilhas que viram dashboards e relatórios prontos.
- Frequência e busca ativa: chamada digital para quem não tem sistema, ou importação de dados para quem já usa o SIEPE ou similar (sem integração oficial).
- Notas e alunos em risco.
- Painel de demandas (Secretaria, GRE, famílias e professores).
- Declarações e documentos, e horário/frequência dos professores.
- Merenda e estoque.
- Manutenção e ocorrências.

- **Landing visual:** a página não tem backend, login nem banco de dados. A rota `/demo` é a exceção: funciona de verdade no navegador, sem backend, sem envio e sem armazenamento de dados.
- **Dados de exemplo:** o painel do topo e a amostra usam uma escola fictícia; a foto do topo é gerada por IA. Não há depoimentos nem números inventados.
- **Formulário de demonstração:** não envia nada. O "envio" é simulado no navegador e nenhum dado é guardado.

## Stack

- Next.js 16 (App Router), React 19 e TypeScript
- Tailwind CSS 4, com tokens em `src/app/globals.css`
- Vitest 5, Testing Library e jsdom
- ESLint 9 (`eslint-config-next`) e Prettier com plugin do Tailwind
- clsx

## Estrutura

- `src/app`: rotas `/` (landing), `/demo` e `/demo/dia` (Hoje na escola) com `/aluno`, `/chamada`, `/portaria`, `/merenda`, `/horario` e `/coordenacao`. `/demo/registro` redireciona para `/demo/dia`.
- `src/components/sections`: seções da landing, uma por arquivo.
- `src/components/ui`: componentes próprios e acessíveis.
- `src/components/layout`: cabeçalho e rodapé.
- `src/components/dia`: seção Dia a dia (hub com os números do dia, QR e celular simulado, aluno, chamada, portaria, merenda, horário e coordenação).
- `src/lib/attendance`: regras do registro de atrasos (matrícula, relógio e janela de horário, registros, desfazer, mensagem).
- `src/lib/daily`: presença pela chamada, conta da merenda e remanejamento do horário quando professor falta. Funções puras e testadas.
- `src/components/demo`: app da rota `/demo` (envio, mapeamento de colunas, painel em abas, fichas e imagem de compartilhamento).
- `src/lib/spreadsheet`: leitura de CSV e Excel, análise e exportação em CSV.
- `src/data`: textos e opções.
- `src/hooks`: hooks React.
- `tests/`: testes (Vitest e Testing Library).

## Instalação e uso

O projeto usa npm (há `package-lock.json`).

```bash
npm install
npm run dev
```

Abra http://localhost:3000 (porta padrão do Next.js).

| Comando              | O que faz                          |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento        |
| `npm run build`      | Build de produção                  |
| `npm start`          | Sobe o build gerado (`next start`) |
| `npm run lint`       | ESLint                             |
| `npm run typecheck`  | Checagem de tipos (`tsc --noEmit`) |
| `npm run format`     | Prettier em todos os arquivos      |
| `npm test`           | Testes uma vez (Vitest)            |
| `npm run test:watch` | Testes em modo watch               |

### Variáveis de ambiente

Nenhuma. O `.env.example` só tem comentários. Se algum dia for preciso, copie-o para `.env.local` (ignorado pelo git).

## Seções da página

Ordem em `src/app/page.tsx`. Cabeçalho e rodapé ficam fora de `<main>`.

| Seção (id)                                | Componente                                                                   | O que mostra                                                                                                                                                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabeçalho                                 | `src/components/layout/Header.tsx`                                           | Menu, troca de tema e menu mobile                                                                                                                                                                                                                     |
| Topo (`#topo`)                            | `src/components/sections/Hero.tsx` (tela do celular em `PhoneScreen.tsx`)    | Metade rosa com o título pixel "Hoje na escola", metade azul com a promessa e o botão para `/demo`, e a coordenadora (foto gerada por IA) mostrando no celular um painel desenhado por código                                                         |
| Cada pessoa na sua tela                   | `src/components/sections/Roles.tsx`                                          | Crachás que abrem a tela de cada pessoa: Professor, Portaria, Cozinha e Coordenação                                                                                                                                                                   |
| Problemas (`#problemas`)                  | `src/components/sections/Problems.tsx`                                       | Bloco azul colado com fita: "O que toma o tempo da direção", em quatro bilhetes                                                                                                                                                                       |
| Funcionalidades (`#funcionalidades`)      | `src/components/sections/Features.tsx`                                       | Nove áreas: mensagens aos pais, dashboards, frequência/chegada/atrasos, notas e risco, painel de demandas, declarações e documentos, horário e professores, merenda e estoque, manutenção e ocorrências                                               |
| Como funciona (`#como-funciona`)          | `src/components/sections/HowItWorks.tsx`                                     | Três passos (planilha, painel, avisos) e o cartaz da entrada com QR e plaquinha NFC                                                                                                                                                                   |
| Amostra (`#amostra`)                      | `src/components/sections/DemoSample.tsx` (painéis em `DemoSamplePanels.tsx`) | Demo em miniatura com a escola de exemplo, em quatro abas que compartilham o estado: painel da planilha, QR da entrada e celular do aluno, chamada e horário, merenda e avisos. Usa as funções de `lib/` com estado próprio, sem tocar no `demoStore` |
| Dúvidas (`#faq`)                          | `src/components/sections/Faq.tsx`                                            | Proteção de dados (LGPD), uso com SIEPE, mensagens aos pais, tecnologia, internet instável e custo                                                                                                                                                    |
| Demonstração (`#demonstracao`)            | `src/components/sections/DemoForm.tsx`                                       | Formulário com cargo, município, UF e tamanho da escola; envio apenas simulado                                                                                                                                                                        |
| Rodapé (política de privacidade em modal) | `src/components/layout/Footer.tsx`                                           | Política de privacidade, em modal                                                                                                                                                                                                                     |

Textos e listas ficam em `src/data/content.ts` e `src/data/options.ts`.

## Demo funcional (`/demo`)

A rota `/demo` ("Planilha vira dashboard") lê a planilha e calcula os indicadores no navegador. Nada é enviado nem guardado.

Fluxo:

1. **Envie a planilha** (arraste ou escolha o arquivo) ou toque em **Ver com escola de exemplo** para abrir o painel na hora, sem planilha.
2. **Confira as colunas:** o app sugere aluno, turma, faltas, atrasos, telefone do responsável e notas pelo nome dos cabeçalhos. Quando reconhece aluno, turma, faltas e ao menos uma nota, este passo é pulado (continua acessível no botão "Colunas").
3. **Veja o painel**, pensado para o celular: abas fixas embaixo (Resumo, Turmas, Alunos), como em um app.

Formatos aceitos:

- `.csv` com delimitador `;`, `,` ou tab (detectado automaticamente), em UTF-8 ou Windows-1252.
- `.xlsx`, lendo a primeira aba.
- `.xls` não é aceito.

Limites: 5 MB e 5.000 linhas de dados.

O painel mostra:

- **Resumo:** situação da escola em semáforo (verde até 10% dos alunos em risco, amarelo até 20%, vermelho acima) com uma frase que aponta a turma mais crítica; indicadores gerais; "O que fazer hoje", com até 3 ações (família do aluno mais grave, turma mais crítica, famílias com atrasos); botão **Compartilhar resumo**, que gera uma imagem PNG (desenhada em canvas, sem nomes de alunos) e abre o compartilhar do celular ou baixa o arquivo.
- **Comparação:** uma segunda planilha (ex.: bimestre anterior) mostra setas de melhora e piora nos indicadores, nas turmas e nos alunos, e quantos alunos entraram ou saíram do risco. Os alunos são casados pelo nome e pela turma. Na escola de exemplo há um bimestre anterior pronto.
- **Turmas:** grade colorida, uma turma por quadrado; um toque abre a ficha da turma (médias por disciplina e alunos em risco). Abaixo, frequência por turma e notas por turma e disciplina.
- **Alunos:** busca pelo nome e filtros (em risco, atrasos, todos), download do risco em CSV. Cada aluno abre uma ficha com os números, os motivos e uma **mensagem pronta para a família**: o botão abre o WhatsApp (`wa.me`) com o texto preenchido, direto no telefone da planilha quando existe; sem telefone, o WhatsApp pede para escolher o contato.
- Avisos sobre a planilha (linhas ignoradas, notas fora de 0 a 10, faltas acima dos dias letivos).

Os critérios ficam no botão **Critérios**. Eles são configuráveis e o painel recalcula na hora. Frequência = 1 − faltas ÷ dias letivos.

| Critério               | Padrão | Aceita  |
| ---------------------- | ------ | ------- |
| Dias letivos até agora | 100    | 1 a 400 |
| Frequência mínima (%)  | 75     | 0 a 100 |
| Média mínima           | 6      | 0 a 10  |
| Atrasos para avisar    | 3      | 1 a 50  |

Valores vazios ou fora do intervalo usam o padrão.

Limitação: faltas seguidas não são calculadas. Elas dependem do registro diário, e a planilha tem uma linha por aluno.

Planilha-modelo: [`public/modelo-escola-mais.csv`](public/modelo-escola-mais.csv), com alunos fictícios de 6º, 7º e 8º ano. O link "Baixar planilha-modelo" fica na própria rota.

Dependência: `read-excel-file`, carregada só quando um `.xlsx` é aberto.

## Dia a dia (`/demo/dia`)

O dia a dia da escola, com **uma tela para cada pessoa**, todas gravando no **mesmo lugar**. Cobre o que mais toma tempo da gestão no dia a dia: contar os alunos, contar quem come a merenda, refazer o horário quando um professor falta e registrar atrasos. O endereço antigo `/demo/registro` (inclusive o QR impresso) redireciona para cá.

- **Hoje na escola (`/demo/dia`):**
  - números ao vivo: presentes, atrasos e avisos pendentes, refeições, professores faltando;
  - o **QR único da entrada**, com cartaz para imprimir (que também serve de **plaquinha NFC**: uma etiqueta gravada com o mesmo link, com passo a passo e botão para copiar o link), e um **celular simulado** com a tela do aluno;
  - os links das telas.
- **Aluno (`/demo/dia/aluno`):** abre ao ler o QR com o próprio celular. O aluno se identifica com **turma e matrícula** e, na **primeira vez em cada celular**, confirma o **dia e o mês do aniversário** (coluna "Nascimento" da planilha; sem ela, a matrícula basta e o hub avisa). Depois o celular **lembra do aluno** e abre direto ("Olá, Ana S.!", com "Não sou eu" para trocar). Então:
  - **Cheguei atrasado:** só perto do horário de entrada (30 min antes até 2 h depois); fora disso, manda procurar a portaria;
  - **Merenda de hoje:** "Vou comer" ou "Não vou comer", até o prazo (padrão 9h00).
  - O link é público: nunca lista alunos e mostra só o primeiro nome e a inicial.
- **Chamada (`/demo/dia/chamada`):** tela de app para o celular do professor, sem o menu do site.
  - Na primeira vez, pede o nome; depois aparece "Prof. Rita · trocar" no topo (fica só nesta aba).
  - Turmas em abas no topo (✓ nas que já têm chamada) e contadores ao vivo: presentes, faltas e atrasos.
  - Lista numerada como no diário de papel, com **P / F / A** em cada aluno (todos começam em P).
  - Nada é gravado até tocar em **Salvar**, na barra fixa embaixo. Depois de salvar, aparece o resumo e o botão para a próxima turma sem chamada.
  - Um atraso marcado pelo professor pode ser trocado por **5 minutos**; depois disso, fica travado ("fale com a coordenação"). Atrasos da portaria ou do QR já aparecem em A e travados.
- **Portaria (`/demo/dia/portaria`):** registra pelo nome a chegada de quem não conseguiu ler o QR. Ao escolher o aluno, mostra a matrícula, e o botão **Imprimir lista de matrículas** gera uma folha por turma (nome e matrícula em ordem alfabética, com o aviso "Não afixar") para quem não lembra a matrícula.
- **Merenda (`/demo/dia/merenda`):** refeições para preparar, no total e por turma.
  - Conta os presentes, menos quem respondeu "não vou". **Quem não respondeu conta**, para o aluno sem celular não ficar sem merenda.
  - Turma sem chamada usa todos os alunos (marcada "sem chamada").
  - O prazo é configurável.
- **Horário do dia (`/demo/dia/horario`):** marque quem faltou. Para cada turma afetada:
  - as aulas seguintes são **adiantadas** quando o professor está na escola e livre naquele horário;
  - as vagas que sobram mostram **quem está livre para cobrir**;
  - se as vagas ficam no fim, mostra "pode sair às HhMM".
  - A escola de exemplo já vem com uma grade (6 turmas × 25 aulas, sem professor em duas turmas ao mesmo tempo). Também dá para enviar uma planilha (`Turma; Dia; Aula; Professor; Disciplina`, dia de segunda a sexta ou 1 a 5, aula de 1 a 5) ou gerar uma grade de exemplo para as turmas da planilha carregada.
- **Coordenação (`/demo/dia/coordenacao`):** os números do dia; registrar pelo nome; fila de avisos pelo WhatsApp; atrasos do dia (motivo, justificado, horário de entrada na sala, excluir); reincidentes.

Regras:

- Nascimento: coluna "Nascimento" (ou "Data de nascimento", "Aniversário"); aceita 15/03/2012, 15/3, 2012-03-15 e data do Excel. Só o dia e o mês são usados, para confirmar o aluno no link. Sem limite de tentativas nesta demo (sem servidor).
- Matrícula: vem da coluna "Matrícula" da planilha (só os dígitos contam). Sem a coluna, o sistema gera 6 dígitos estáveis por aluno; a escola de exemplo já tem a coluna.
- Atraso = chegada depois da entrada + tolerância (padrão 7h00 + 10 min, em "Relógio e horário"). Dentro da tolerância, "chegou no horário" e nada é registrado.
- A demo usa uma **hora simulada** (começa em 7h12, com −5/+5 min) para funcionar fora do horário de entrada; há a opção de usar a hora real.
- Justificado não conta no total e dispensa o aviso.
- Os atrasos registrados somam à coluna de atrasos da planilha no painel da `/demo` (ou criam a coluna "Atrasos (registrados)"). O Resumo mostra "Hoje: N atrasos · M avisos pendentes".
- Sem planilha carregada, usa a escola de exemplo. Trocar de planilha zera os registros.
- Presentes: turma − ausentes da chamada. Quem foi marcado ausente e depois registrou atraso volta a contar como presente.
- Tudo fica **só em memória nesta aba** (`src/lib/demoStore.ts`): sobrevive à navegação entre as telas e some ao recarregar. Por isso, um celular de verdade que ler o QR abre a tela do aluno, mas o registro não chega a esta aba; na escola real, isso exige um servidor.
- QR gerado com `qrcode-generator` e desenhado em SVG, sempre escuro sobre claro (`.qr-light`), também no tema escuro.

Avisos às famílias, custo e LGPD:

- A mensagem é mínima: aluno, turma e horário. Motivo, notas e quem registrou não vão para a família.
- A demo não usa a API paga do WhatsApp (WhatsApp Business Platform, cobrada por mensagem e com empresa verificada). Cada aviso abre o WhatsApp com o texto pronto (`wa.me`) e a coordenação confere e envia; "Enviar próximo" percorre a fila. Bibliotecas não oficiais que automatizam o WhatsApp comum violam os termos de uso e podem banir o número, por isso não são usadas.
- Base legal (orientação geral, não parecer jurídico): informar os responsáveis sobre a frequência é dever da escola (LDB, art. 12, VII); na escola pública, o tratamento se apoia na execução de políticas públicas (LGPD, arts. 7º, III, e 23), observando o melhor interesse de crianças e adolescentes (art. 14). Em produção, validar com o encarregado de dados da secretaria de educação, informar as famílias e, se usar a API da Meta, tratar o contrato com o operador e a transferência internacional (art. 33).

## Componentes de UI

Em `src/components/ui/`, feitos sem biblioteca externa:

- **Listbox:** lista suspensa (Cargo e Tamanho da escola). Teclado: Enter, Espaço ou ↓ abrem; ↑ ↓ Home End navegam; letras buscam; Esc fecha.
- **Combobox:** campo com busca (UF). Ignora acentos e maiúsculas, e também casa pela sigla (ex.: "PE").
- **Accordion:** perguntas frequentes, com um item aberto por vez. Teclado: ↑ ↓ Home End.
- **Modal:** diálogo em portal, com foco preso. Esc ou clique no fundo fecha, e o foco volta ao gatilho.
- **Toast:** avisos via `ToastProvider` e `useToast()`. Fecha sozinho após 6 s e pausa com mouse ou foco.

**Regra do projeto:** não usar `<select>`, `alert()`, `confirm()` nem `<dialog>` nativos. Use os componentes acima.

## Cores e tema

Visual **papel serigrafado**: rosa `#fc3b7f`, creme `#fef1cf` e azul royal `#0032a8`, com tinta azul-escura `#141a3c` no texto, título em fonte pixel e adesivos em traço creme. Foi desenhado com a skill [impeccable](https://impeccable.style) (`.claude/skills/impeccable`) a partir de uma imagem aprovada (`.impeccable/mocks/comp-2-celular.jpg`); o registro do produto fica em `PRODUCT.md` e o do visual em `DESIGN.md`.

- Tokens de interface (`bg`, `surface`, `primary`, `accent`, `danger`, `ok`...): valem para todas as telas, inclusive `/demo` e `/demo/dia`, que só trocaram cores e fontes.
- Tokens de mundo (`pink`, `blue`, `cream`, `ink`, `green`, `yellow`, `line`): pintam a landing e são iguais nos dois temas.
- Texturas: `.paper-pink`, `.paper-blue` e `.paper-cream` repetem recortes de papel tirados da imagem aprovada (`public/plates/`). `.tape` cola fita nos cantos de um bloco.
- Contraste: creme sobre rosa só em texto grande; texto pequeno sobre rosa vai em tinta.

No tema escuro a página vira azul-noite (`#0a1236`), com creme no texto e rosa nos destaques; o topo rosa e azul continua igual.

Os tokens ficam em `src/app/globals.css`: `:root` para o tema claro e `[data-theme='dark']` para o escuro. Eles são mapeados para classes Tailwind como `bg-primary`, `text-fg-muted` e `bg-pink`.

O tema segue o sistema por padrão. O botão no cabeçalho alterna entre claro e escuro e salva a escolha em `localStorage`, na chave `theme`. Um script em `src/app/layout.tsx` aplica o tema antes da primeira pintura.

## Tipografia

Jersey 15 (título pixel; classe `font-pixel`), Barlow Condensed (títulos; classe `font-display`), Barlow (texto) e Martian Mono (linhas de dado; classe `font-mono`), carregadas com `next/font/google` em `src/app/layout.tsx`.

## Acessibilidade

- Idioma `pt-BR`, link "Pular para o conteúdo" e foco visível (`:focus-visible`) em todos os controles.
- Formulário com rótulos, `aria-invalid` e `aria-describedby` nos campos com erro, e foco no primeiro campo inválido.
- Contadores têm o valor final em `aria-label`. O painel ilustrativo tem descrição textual para leitores de tela.
- `prefers-reduced-motion: reduce` desliga as animações de entrada, mostra os contadores já com o valor final e remove a rolagem suave e as animações de toast e modal.

## Testes

`npm test` roda os testes de `tests/`:

- `Listbox`: abrir pelo teclado, navegar, selecionar, Esc e clique fora.
- `Combobox`: busca sem acento, busca pela sigla, mensagem sem resultado e Esc restaurando o valor.
- `Modal`: foco preso, Esc e devolução do foco.
- `Accordion`: abrir e fechar, um item por vez e navegação por teclado.
- `DemoForm`: erros inline, foco no primeiro campo inválido e envio simulado com toast.
- `validateDemoForm` (`tests/validateDemoForm.test.ts`): campos obrigatórios, e-mail válido e município preenchido.
- `spreadsheet/parseCsv`: delimitadores `;` e tab, BOM, aspas com delimitador, aspas escapadas, cabeçalhos vazios ou repetidos e tabela vazia.
- `spreadsheet/numbers`: notas com vírgula ou ponto, e texto que não vira número.
- `spreadsheet/columns`: sugestão de colunas pelo nome (sem acento e sem maiúsculas) e reconhecimento das colunas de notas.
- `spreadsheet/analyze`: frequência, média, alunos em risco com motivos, atrasos, indicadores gerais, critérios alterados, dias letivos zerados, avisos e CSV de risco.
- `spreadsheet/insights`, `whatsapp`, `compare` e `sample` (`tests/spreadsheet/insights.test.ts`): faixas do semáforo, frase-resumo, ações do dia, telefone e mensagem do WhatsApp, comparação entre planilhas e escola de exemplo estável.
- `birthday` (`tests/attendance/birthday.test.ts`): formatos de data de nascimento (incluindo a do Excel), datas inválidas, coluna "Data de nascimento do aluno" sem tomar a do aluno, confirmação no roster e escola de exemplo com aniversário em todos.
- `attendance` (`tests/attendance/attendance.test.ts`): matrícula gerada estável, coluna de matrícula, busca só na turma escolhida, nome público, hora simulada, tolerância, janela do link do aluno, desfazer em 5 minutos, excluir, um registro por dia, justificado fora da fila e da soma, soma à planilha (com e sem coluna) e mensagem mínima.
- `daily` (`tests/daily/daily.test.ts`): presença com e sem chamada, atraso tirando o aluno dos ausentes, merenda (sem resposta conta, "não vou" e ausentes saem, prazo), remanejamento do horário (adianta, respeita conflito, vagas no fim, livres, dois professores faltando), grade de exemplo sem conflito e leitura da planilha de horário.
- Dia a dia (`tests/Dia.test.tsx`): escola e grade de exemplo sem planilha, hub com os números e os links, redirecionamento de `/demo/registro`, aluno por turma e matrícula (certa, de outra turma, fora do horário), aniversário na 1ª vez e celular que lembra, aviso sem coluna Nascimento, lista de matrículas da portaria, merenda pelo celular e prazo, chamada com ausentes e atraso devolvendo a presença, professor desfazendo em 5 min, horário adiantando aula e mostrando livres, coordenação com WhatsApp, justificar, excluir e reincidentes, e resumo do dia no painel da `/demo`.
- `DemoApp` (`tests/DemoApp.test.tsx`): painel aberto direto quando as colunas são reconhecidas, veredito, ficha do aluno com link do WhatsApp, abas por clique e teclado, busca e filtros, critérios no modal, conferência de colunas, escola de exemplo com comparação, comparação com planilha enviada e erros de arquivo.

Não há testes para tema, contadores, toast isolado, visual nem para a imagem de compartilhamento (canvas não existe no jsdom). Também não há testes para leitura de `.xlsx`, para o Windows-1252 nem para os limites de 5 MB e 5.000 linhas.

## Deploy

Na Vercel, importe o repositório. O framework Next.js é detectado automaticamente e não há variáveis de ambiente para configurar.

## Fluxo com Claude Code

O fluxo de trabalho com o Claude Code (planejar, executar e verificar) está descrito em [`CLAUDE.md`](CLAUDE.md).
