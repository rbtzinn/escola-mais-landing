# Escola+ (landing page)

Landing de apresentação do **Escola+**, uma plataforma de gestão escolar para redes municipais e estaduais.

- **Só visual:** não tem backend, login nem banco de dados.
- **Dados fictícios:** números, painel e depoimentos são ilustrativos.
- **Formulário de demonstração:** não envia nada. O "envio" é simulado no navegador e nenhum dado é guardado.

## Stack

- Next.js 16 (App Router), React 19 e TypeScript
- Tailwind CSS 4, com tokens em `src/app/globals.css`
- Vitest 5, Testing Library e jsdom
- ESLint 9 (`eslint-config-next`) e Prettier com plugin do Tailwind
- clsx

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

| Seção (id)                                   | Componente                                                     |
| -------------------------------------------- | -------------------------------------------------------------- |
| Cabeçalho: menu, troca de tema e menu mobile | `src/components/layout/Header.tsx`                             |
| Hero (`#topo`)                               | `src/components/sections/Hero.tsx` (usa `DashboardMockup.tsx`) |
| Problemas (`#problemas`)                     | `src/components/sections/Problems.tsx`                         |
| Funcionalidades (`#funcionalidades`)         | `src/components/sections/Features.tsx`                         |
| Como funciona (`#como-funciona`)             | `src/components/sections/HowItWorks.tsx`                       |
| Impacto (`#impacto`)                         | `src/components/sections/Impact.tsx`                           |
| Depoimentos (`#depoimentos`)                 | `src/components/sections/Testimonials.tsx`                     |
| Dúvidas (`#faq`)                             | `src/components/sections/Faq.tsx`                              |
| Demonstração (`#demonstracao`)               | `src/components/sections/DemoForm.tsx`                         |
| Rodapé (política de privacidade em modal)    | `src/components/layout/Footer.tsx`                             |

Textos e listas ficam em `src/data/content.ts` e `src/data/options.ts`.

## Componentes de UI

Em `src/components/ui/`, feitos sem biblioteca externa:

- **Listbox:** lista suspensa (Cargo e Porte). Teclado: Enter, Espaço ou ↓ abrem; ↑ ↓ Home End navegam; letras buscam; Esc fecha.
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
- `validateDemoForm`: regras de validação do formulário.

Não há testes para tema, contadores, toast isolado nem visual.

## Deploy

Na Vercel, importe o repositório. O framework Next.js é detectado automaticamente e não há variáveis de ambiente para configurar.

## Fluxo com Claude Code

O fluxo de trabalho com o Claude Code (planejar, executar e verificar) está descrito em [`CLAUDE.md`](CLAUDE.md).
