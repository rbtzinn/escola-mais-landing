# CLAUDE.md

Instruções do projeto para o Claude Code. Responda sempre em português do Brasil.

## Sobre o projeto

<!-- Preencha quando definir o projeto -->

- **Nome:** Escola+ (landing page de apresentação)
- **Objetivo:** apresentar visualmente uma plataforma de gestão para a própria escola pública, voltada à direção e à coordenação pedagógica (mensagens automáticas aos pais, planilhas viram dashboards, frequência e busca ativa, notas e alunos em risco, merenda, manutenção e relatórios prontos). Sem backend e sem login; a landing usa dados fictícios e o formulário de demonstração não envia nada. A rota `/demo` é funcional: lê uma planilha (CSV ou .xlsx) e gera o painel no navegador, sem enviar nem guardar dados. A seção `/demo/dia` (Dia a dia) simula o dia da escola, só em memória: QR único na entrada (o aluno se identifica por turma e matrícula, confirma o aniversário na 1ª vez e o celular lembra dele, para registrar atraso e responder a merenda; a portaria imprime a lista de matrículas), chamada do professor (só ausentes), portaria, merenda, horário remanejado quando professor falta e coordenação. `/demo/registro` redireciona para lá.
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 (tokens em `src/app/globals.css`), ESLint, Prettier, Vitest + Testing Library, `read-excel-file` (leitura de .xlsx, importado só ao subir Excel), `qrcode-generator` (QR da entrada em /demo/dia). Deploy na Vercel (sem variáveis de ambiente).
- **Formulário de matrícula:** pasta `matricula/`, projeto separado (Vite + React + Tailwind, comandos próprios dentro da pasta), deploy próprio na Vercel e Apps Script em `matricula/apps-script/`. Só aprovados (CPF + nascimento) se matriculam, no período; o painel `/admin` (direção e coordenação, login por senha) cuida de status, período, exceções, aprovados e usuários. A landing ignora essa pasta.
- **Estrutura:** `src/components/sections` (uma seção por arquivo), `src/components/ui` (componentes próprios e acessíveis: Listbox, Combobox, Accordion, Modal, Toast), `src/components/layout`, `src/data` (textos e opções), `src/components/demo` (demo /demo), `src/components/dia` (seção Dia a dia em /demo/dia), `src/hooks`, `src/lib` (`lib/spreadsheet`: leitura, colunas, análise, semáforo e ações, comparação, WhatsApp e escola de exemplo; `lib/attendance`: regras do registro de atrasos; `lib/daily`: presença, merenda e horário; `lib/demoStore.ts`: estado da demo só em memória; funções puras e testadas), `tests/`.
- **Regras de UI:** nunca usar `<select>`, `alert()`, `confirm()` nem `<dialog>` nativo; usar os componentes de `ui/`. Animações respeitam `prefers-reduced-motion`. Cores só via tokens (`bg-bg`, `text-fg`, `text-primary`, `bg-pink`...), com tema claro/escuro (claro creme; escuro azul-noite). Visual da landing (rosa, creme e azul, título pixel) registrado em `DESIGN.md`; produto em `PRODUCT.md`; a skill de design `impeccable` fica em `.claude/skills/impeccable`.

## Comandos

<!-- Atualize quando a stack for escolhida -->

- Instalar: `npm install`
- Rodar em dev: `npm run dev` (http://localhost:3000)
- Build de produção: `npm run build` e `npm run start`
- Testes: `npm test` (`npm run test:watch` para modo contínuo)
- Lint: `npm run lint`
- Checagem de tipos: `npm run typecheck`
- Formatar: `npm run format`

## Fluxo de trabalho (economia de tokens)

Este projeto usa o modelo `opusplan`: **Opus no plan mode, Sonnet na execução.**

1. **Planejar (Opus):** toda tarefa que não for trivial começa no plan mode.
   O plano precisa ser concreto para o Sonnet só executar:
   - arquivos que serão criados ou alterados (caminho exato);
   - passos numerados, pequenos e em ordem;
   - assinaturas de funções, tipos e contratos de API envolvidos;
   - casos de borda e como testar cada passo.
     Antes de planejar, use o subagente `explorador` para mapear o código, em vez de ler muitos arquivos na conversa principal.
2. **Executar (Sonnet):** siga o plano aprovado à risca. Se surgir uma decisão de arquitetura que o plano não cobre, pare e avise em vez de improvisar.
3. **Verificar (Haiku):** ao terminar cada etapa, delegue para os subagentes:
   - `revisor-lint`: lint, formatação e tipos;
   - `testador`: rodar os testes e resumir falhas;
   - `documentador`: atualizar README e comentários ao fim de uma funcionalidade.

### Quando delegar e quando não

- Delegue tarefas mecânicas, repetitivas ou que geram muita saída (logs de teste, buscas amplas).
- **Não** delegue tarefas pequenas (ler 1 ou 2 arquivos, rodar um comando rápido): o subagente começa do zero e gastaria mais tokens.
- Bug difícil ou decisão de arquitetura: sugira ao usuário trocar para `/model opus`.

## Convenções

- Commits pequenos, mensagens em português no imperativo (ex.: "adiciona tela de login").
- Não commitar segredos; variáveis de ambiente em `.env.local` (ignorado no git) e exemplo em `.env.example`.
- Componentes e funções com nomes em inglês; textos da interface em português.
