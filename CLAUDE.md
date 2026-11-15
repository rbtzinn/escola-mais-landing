# CLAUDE.md

Instruções do projeto para o Claude Code. Responda sempre em português do Brasil.

## Sobre o projeto

<!-- Preencha quando definir o projeto -->
- **Nome:** _a definir_
- **Objetivo:** _a definir_
- **Stack:** _a definir (o primeiro plano no plan mode deve propor a stack)_

## Comandos

<!-- Atualize quando a stack for escolhida -->
- Instalar: `_a definir_`
- Rodar em dev: `_a definir_`
- Testes: `_a definir_`
- Lint: `_a definir_`
- Checagem de tipos: `_a definir_`

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
