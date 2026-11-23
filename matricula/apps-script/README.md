# Planilha da matrícula (Google Sheets + Apps Script)

Passo a passo para quem tem acesso à **conta Google institucional da escola** (uns 10 minutos). Os dados são de menores de idade e incluem saúde e cor/raça: use a conta da escola, nunca uma conta pessoal.

1. **Criar a planilha:** no Google Drive da escola, crie uma planilha em branco (por exemplo, "Matrículas 2026") e copie o link dela.
2. **Abrir o editor:** abra https://script.new com a conta da escola (no celular, pelo Chrome). Também dá para abrir pela planilha, em **Extensões > Apps Script**; nesse caso o `SHEET_ID` do passo 4 não é preciso.
3. **Colar o script:** apague o que estiver no editor, cole todo o conteúdo de [`Code.js`](./Code.js) e salve.
4. **Propriedades do script:** em **Configurações do projeto** (engrenagem) > **Propriedades do script**, adicione:
   - `SHEET_ID` = o link da planilha (pode ser o link inteiro);
   - `FORM_TOKEN` = um código qualquer contra spam, por exemplo `ete-2026-x7k2`, igual ao `VITE_FORM_TOKEN` da Vercel.
5. **Criar as abas:** escolha a função `setup` e clique em **Executar**. Autorize com a conta da escola. Na planilha aparecem as abas **Matrículas** e **Resumo por curso**.
6. **Publicar:** **Implantar > Nova implantação**, tipo **App da Web**:
   - _Executar como:_ **Eu** (a conta da escola);
   - _Quem pode acessar:_ **Qualquer pessoa** (os alunos não fazem login; quem grava é o script).

   Copie a **URL do app da Web** (termina em `/exec`).

7. **Ligar o formulário:** na Vercel, em **Settings > Environment Variables**, crie `VITE_APPS_SCRIPT_URL` (a URL do passo 6) e `VITE_FORM_TOKEN` (o código do passo 4). Depois, faça um **Redeploy**.
8. **Proteger a planilha:** em **Compartilhar**, deixe acesso só para a secretaria e a direção.

## O que o script faz

- Confere de novo o CPF e o formato do envio (quem chama o script direto não passa pelo formulário).
- **Bloqueia CPF repetido:** responde "já matriculado" e não grava.
- Impede que uma resposta vire fórmula (texto que começa com `=`, `+`, `-` ou `@`).
- Grava uma linha por aluno, com data e hora, protocolo (`MAT-2026-0001`) e CPF só com números. Tudo é gravado como texto, para não perder zeros à esquerda.
- Se o formulário ganhar perguntas novas, as colunas novas entram no fim, sem bagunçar as antigas.

## Mudou o script?

Depois de editar o `Code.js`, cole de novo no editor e use **Implantar > Gerenciar implantações > Editar (lápis) > Versão: Nova versão**. Assim a URL continua a mesma.
