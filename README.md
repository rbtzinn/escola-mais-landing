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
- **Dados fictícios:** números, painel e depoimentos são ilustrativos.
- **Formulário de demonstração:** não envia nada. O "envio" é simulado no navegador e nenhum dado é guardado.

## Stack

- Next.js 16 (App Router), React 19 e TypeScript
- Tailwind CSS 4, com tokens em `src/app/globals.css`
- Vitest 5, Testing Library e jsdom
- ESLint 9 (`eslint-config-next`) e Prettier com plugin do Tailwind
- clsx

## Estrutura

- `src/app`: rotas `/` (landing), `/demo` e `/demo/registro`.
- `src/components/sections`: seções da landing, uma por arquivo.
- `src/components/ui`: componentes próprios e acessíveis.
- `src/components/layout`: cabeçalho e rodapé.
- `src/components/registro`: registro de atrasos (totem, portaria, professor, coordenação, carteirinhas e leitor de QR).
- `src/lib/attendance`: regras do registro (código opaco, relógio, registros, mensagem), funções puras e testadas.
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

| Seção (id)                                | Componente                                                     | O que mostra                                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabeçalho                                 | `src/components/layout/Header.tsx`                             | Menu, troca de tema e menu mobile                                                                                                                                                                       |
| Hero (`#topo`)                            | `src/components/sections/Hero.tsx` (usa `DashboardMockup.tsx`) | Proposta de valor, botões e painel ilustrativo com dados fictícios                                                                                                                                      |
| Problemas (`#problemas`)                  | `src/components/sections/Problems.tsx`                         | Planilhas soltas, pais avisados tarde, aluno em risco sem alerta e prestação de contas                                                                                                                  |
| Funcionalidades (`#funcionalidades`)      | `src/components/sections/Features.tsx`                         | Nove áreas: mensagens aos pais, dashboards, frequência/chegada/atrasos, notas e risco, painel de demandas, declarações e documentos, horário e professores, merenda e estoque, manutenção e ocorrências |
| Como funciona (`#como-funciona`)          | `src/components/sections/HowItWorks.tsx`                       | Três passos: enviar planilhas, ver o painel e deixar o Escola+ avisar                                                                                                                                   |
| Impacto (`#impacto`)                      | `src/components/sections/Impact.tsx`                           | Quatro números fictícios de exemplo                                                                                                                                                                     |
| Depoimentos (`#depoimentos`)              | `src/components/sections/Testimonials.tsx`                     | Três depoimentos ilustrativos (direção, coordenação e secretaria escolar)                                                                                                                               |
| Dúvidas (`#faq`)                          | `src/components/sections/Faq.tsx`                              | Proteção de dados (LGPD), uso com SIEPE, mensagens aos pais, tecnologia, internet instável e custo                                                                                                      |
| Demonstração (`#demonstracao`)            | `src/components/sections/DemoForm.tsx`                         | Formulário com cargo, município, UF e tamanho da escola; envio apenas simulado                                                                                                                          |
| Rodapé (política de privacidade em modal) | `src/components/layout/Footer.tsx`                             | Política de privacidade, em modal                                                                                                                                                                       |

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

## Registro de atrasos (`/demo/registro`)

Simula como os atrasos chegam ao painel. Quatro jeitos de registrar, todos gravando no **mesmo lugar** (se um aluno já foi registrado hoje, os outros canais veem "já registrado por X às H" e nada é duplicado):

- **Totem:** o aluno aproxima a carteirinha; a câmera lê o QR (`jsqr`, carregado só nesta tela). Tela pública: mostra só primeiro nome e inicial. A câmera é desligada ao sair.
- **Portaria:** busca pelo nome (quem não tem carteirinha ou celular) ou lê o QR; motivo opcional.
- **Professor(a):** escolhe a turma e marca "Atrasado" na chamada.
- **Coordenação:** registra pelo nome, edita cada atraso (motivo, justificado, entrou no 1º ou 2º horário), envia a **fila de avisos** e vê os **reincidentes** (total da planilha + registros de hoje ≥ limite de atrasos).

Regras:

- Atraso = chegada depois da entrada + tolerância (padrão 7h00 + 10 min, em "Relógio e horário"). Dentro da tolerância, "chegou no horário" e nada é registrado.
- A demo usa uma **hora simulada** (começa em 7h12, com −5/+5 min) para funcionar fora do horário de entrada; há a opção de usar a hora real.
- Justificado não conta no total e dispensa o aviso.
- Os atrasos registrados somam à coluna de atrasos da planilha no painel da `/demo` (ou criam a coluna "Atrasos (registrados)"); o Resumo mostra "Hoje: N atrasos · M avisos pendentes".
- Sem planilha carregada, usa a escola de exemplo. Trocar de planilha zera os registros.
- Tudo fica **só em memória nesta aba** (`src/lib/demoStore.ts`): sobrevive à navegação entre `/demo` e `/demo/registro`, some ao recarregar.

Carteirinhas: o botão "Carteirinhas" gera cartões com QR (`qrcode-generator`, carregado só ao abrir) por turma, para abrir em outro celular ou imprimir. O QR guarda só um **código opaco** (`EM-XXXXXX`, hash do aluno), sem nome nem turma.

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

Paleta **Verde ipê + índigo**:

- `#1f5f4a` (primary, verde)
- `#3b3f8f` (secondary, índigo)
- `#e8b321` (accent, amarelo ipê)

Os tokens ficam em `src/app/globals.css`: `:root` para o tema claro e `[data-theme='dark']` para o escuro. Eles são mapeados para classes Tailwind como `bg-primary`, `text-fg-muted` e `border-border`.

O tema segue o sistema por padrão. O botão no cabeçalho alterna entre claro e escuro e salva a escolha em `localStorage`, na chave `theme`. Um script em `src/app/layout.tsx` aplica o tema antes da primeira pintura.

## Tipografia

Plus Jakarta Sans (títulos) e Inter (texto), carregadas com `next/font/google` em `src/app/layout.tsx`.

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
- `attendance` (`tests/attendance/attendance.test.ts`): código opaco estável e sem nome, busca por código, nome público, hora simulada, tolerância, um registro por dia, justificado fora da fila e da soma, soma à planilha (com e sem coluna) e mensagem mínima.
- Registro (`tests/Registro.test.tsx`): escola de exemplo sem planilha, portaria e professor no mesmo registro, totem por código sem duplicar e com código inválido, tolerância, fila de avisos com link do WhatsApp, justificar e liberar, reincidentes e soma no painel da `/demo`.
- `DemoApp` (`tests/DemoApp.test.tsx`): painel aberto direto quando as colunas são reconhecidas, veredito, ficha do aluno com link do WhatsApp, abas por clique e teclado, busca e filtros, critérios no modal, conferência de colunas, escola de exemplo com comparação, comparação com planilha enviada e erros de arquivo.

Não há testes para tema, contadores, toast isolado, visual nem para a imagem de compartilhamento (canvas não existe no jsdom) nem para a leitura pela câmera (conferida no navegador com vídeo simulado). Também não há testes para leitura de `.xlsx`, para o Windows-1252 nem para os limites de 5 MB e 5.000 linhas.

## Deploy

Na Vercel, importe o repositório. O framework Next.js é detectado automaticamente e não há variáveis de ambiente para configurar.

## Fluxo com Claude Code

O fluxo de trabalho com o Claude Code (planejar, executar e verificar) está descrito em [`CLAUDE.md`](CLAUDE.md).
