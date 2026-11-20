# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primário:** direção e coordenação pedagógica de escola pública (ensino fundamental, rede estadual). Pessoas que respondem à Secretaria de Educação e à GRE, usam o SIEPE e resolvem tudo pelo celular entre uma demanda e outra. O trabalho delas é saber como a escola está hoje e agir antes do fim do bimestre.
- **Telas de uso:** professor (chamada do 1º horário), portaria (registra atraso de quem não tem celular), cozinha (quantas refeições), coordenação (avisos às famílias) e aluno (link do QR/NFC na entrada: atraso e merenda).
- **Secundário:** quem avalia o trabalho do autor. A landing também é vitrine/portfólio.

## Product Purpose

Escola+ tira da direção as contagens e planilhas manuais: a planilha que a escola já usa vira um painel em segundos, e o dia a dia (presença, atrasos, merenda, horário quando um professor falta) fica numa tela por pessoa, tudo no mesmo lugar. Sucesso: a direção vê algo da escola em 3 segundos no celular e uma escola aceita testar.

## Positioning

Funciona com o que a escola pública já tem: a planilha de hoje, o celular de cada um e um QR (ou plaquinha NFC) na entrada. Sem instalar nada, sem enviar dados na demonstração. Feito a partir das dores contadas por quem trabalha numa escola pública (contagem diária, merenda, horário remanejado, atrasos).

**Modelo de entrega (decidido em nov/2026):** um núcleo único, configurado por escola. Cada escola recebe "o Escola+ da sua escola": nome, turmas, colunas da planilha, regras e só as telas que usa, sempre com as cores do Escola+. No primeiro contato, pede-se **só o cabeçalho** da planilha (sem dado de aluno). Nada de uma cópia de código por escola.

## Operating Context

- Celular primeiro (direção, porteiro, professor, aluno); computador na secretaria.
- Planilhas em CSV/XLSX exportadas do SIEPE ou feitas à mão.
- Avisos às famílias pelo WhatsApp (link wa.me, envio manual; API paga só numa versão com servidor).
- LGPD: link público mostra só "Ana S."; mensagem mínima à família (nome, turma, hora).

## Capabilities and Constraints

- `/demo` funciona de verdade: lê a planilha no navegador e gera painel (semáforo, ações do dia, turmas, alunos, comparação, imagem para compartilhar).
- `/demo/dia` simula o dia, só em memória: QR único da entrada, chamada P/F/A, portaria com lista de matrículas, merenda, horário remanejado, coordenação.
- Sem servidor e sem login: registros não sincronizam entre aparelhos; sem integração com o SIEPE; sem limite de tentativas do aniversário.
- Next.js 16, React 19, Tailwind v4 com tokens claro/escuro; sem `<select>`, `alert()`, `confirm()` ou `<dialog>` nativos.

## Brand Commitments

- Nome: **Escola+**.
- Textos em português do Brasil, claros e respeitosos, sem gíria ("visual ousado, texto sério").
- Direção visual pedida pelo usuário (2026-11): rosa `#FC3B7F`, creme `#FEF1CF`, azul `#0032A8`, título gigante em fonte pixel, adesivos gráficos (carinha, brilho, órbita), estética streetwear; foto gerada por IA no herói. Telas de uso mantêm as cores e fontes, mas sóbrias.

## Evidence on Hand

- Demonstração funcional (`/demo`, `/demo/dia`) e a planilha modelo `public/modelo-escola-mais.csv`.
- **Não há** clientes, depoimentos, números de impacto ou preços reais. Nada disso pode ser inventado; depoimentos e números fictícios saem do site.
- A foto do herói é gerada por IA (pessoa fictícia) e deve ser identificada como tal.

## Product Principles

1. Mostrar a escola em 3 segundos: o que importa hoje vem primeiro.
2. Cada pessoa na sua tela, tudo no mesmo lugar.
3. Usar o que a escola já tem antes de pedir algo novo.
4. Honestidade: só prometer o que a demo faz; dizer os limites.
5. Dados de aluno são mínimos e protegidos.

## Accessibility & Inclusion

Celulares simples e telas pequenas; contraste alto; respeitar `prefers-reduced-motion`; tema claro e escuro.
