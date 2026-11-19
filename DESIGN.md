# Design

Visual do Escola+, registrado a partir do que foi construído (nov/2026). Produto em `PRODUCT.md`.

Reference image: `.impeccable/mocks/comp-2-celular.jpg` (imagem aprovada pelo usuário; 85% de semelhança com o topo construído em 1440 px, medido com `impeccable comp-diff`).

## Mundo

Papel serigrafado de cartaz escolar com estética streetwear: campos inteiros de cor (rosa e azul) com textura de papel, título em pixel de letreiro, adesivos em traço creme, fita adesiva e crachás. A cor ocupa regiões inteiras, não detalhes.

- **Landing (persuadir):** visual completo. Metade rosa e metade azul no topo, faixa creme de crachás, bloco azul colado com fita, cartaz rosa da entrada, formulário sobre rosa, rodapé azul.
- **Telas de uso (operar: `/demo`, `/demo/dia/*`):** só as cores e as fontes do mundo, com a mesma organização de antes; sem adesivos nem título pixel.

## Cores

| Papel                  | Claro     | Escuro    | Uso                                                        |
| ---------------------- | --------- | --------- | ---------------------------------------------------------- |
| Rosa (`pink`)          | `#fc3b7f` | igual     | Campo do topo, cartaz, formulário, crachá Cozinha, seleção |
| Azul royal (`blue`)    | `#0032a8` | igual     | Campo do topo, bloco de problemas, rodapé, botão principal |
| Creme (`cream`)        | `#fef1cf` | igual     | Texto sobre os campos de cor, fundo da página no claro     |
| Tinta (`ink`)          | `#141a3c` | igual     | Texto no claro, contornos dos crachás                      |
| Fundo (`bg`)           | `#fef1cf` | `#0a1236` | Página                                                     |
| Primária (`primary`)   | `#0032a8` | `#ff6fa0` | Botões e links das telas de uso                            |
| Destaque (`secondary`) | `#c81e5c` | `#ff8fb6` | Números dos passos, ícones, sublinhados (rosa escurecido)  |
| Amarelo (`accent`)     | `#f8c925` | igual     | Selo "Atenção", semáforo amarelo, crachá Coordenação       |
| Verde (`ok`)           | `#0a7a43` | `#5ad696` | Semáforo verde, "saiu do risco"                            |

Contraste: creme sobre rosa (≈3,2:1) só em texto grande; texto pequeno sobre rosa vai em tinta.

## Tipografia

- **Jersey 15** (`font-pixel`): só o título "Hoje na escola" e os números dos passos. A medição automática não reconhece fontes pixel; a escolha segue o pedido do usuário.
- **Barlow Condensed** 700/800 (`font-display`): títulos, botões grandes, crachás.
- **Barlow** (`font-sans`): texto e logo ("Escola+" em 700).
- **Martian Mono** (`font-mono`): linhas de dado e de máquina (a frase de confiança do topo, legendas).

## Materiais e componentes

- Texturas `.paper-pink`, `.paper-blue` e `.paper-cream`, recortadas da imagem aprovada (`public/plates/chao-*.png`).
- `.tape`: duas fitas inclinadas nos cantos de um bloco colado.
- Crachás: pílulas com contorno de tinta de 2px, levemente giradas, que endireitam no hover.
- Imagens finais (`assets/plates/`, servidas de `public/plates/`), cada uma com a origem embutida no PNG:
  - foto da coordenadora: gerada por IA, fundo removido; a tela do celular é desenhada por código (`PhoneScreen.tsx`);
  - adesivos (carinha, brilho, planeta);
  - prédio da escola em traço rosa.
- Cantos: `rounded-2xl` e `rounded-3xl` nos blocos; `rounded-full` nos crachás e no botão do menu.

## Movimento

Um só momento: ao carregar, o título pixel acende em degraus (`steps(8)`), a coordenadora sobe 14px e o selo "Atenção" pulsa uma vez. Tudo já é visível sem animação; com `prefers-reduced-motion`, nada se mexe.
