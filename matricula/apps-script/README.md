# Planilha da matrícula (Google Sheets + Apps Script)

Passo a passo para quem tem acesso à **conta Google institucional da escola** (uns 10 minutos). Os dados são de menores de idade e incluem saúde e cor/raça: use a conta da escola, nunca uma conta pessoal.

1. **Criar a planilha:** no Google Drive da escola, crie uma planilha em branco chamada, por exemplo, "Matrículas 2026".
2. **Colar o script:** na planilha, abra **Extensões > Apps Script**. Apague o que estiver no editor, cole todo o conteúdo de [`Code.js`](./Code.js) e salve (ícone de disquete).
3. **Criar as abas:** no topo do editor, escolha a função `setup` e clique em **Executar**. Autorize com a conta da escola. Na planilha aparecem as abas **Matrículas** (cabeçalho azul, linhas alternadas, filtro) e **Resumo por curso**.
4. **Código contra spam:** em **Configurações do projeto** (engrenagem) > **Propriedades do script**, adicione a propriedade `FORM_TOKEN` com um código qualquer, por exemplo `ete-2026-x7k2`. Ele precisa ser igual ao `VITE_FORM_TOKEN` da Vercel (passo 6).
5. **Publicar:** clique em **Implantar > Nova implantação**, tipo **App da Web**:
   - _Executar como:_ **Eu** (a conta da escola);
   - _Quem pode acessar:_ **Qualquer pessoa** (os alunos não fazem login; quem grava é o script).

   Copie a **URL do app da Web** (termina em `/exec`).

6. **Ligar o formulário:** na Vercel, no projeto do formulário, em **Settings > Environment Variables**, crie:
   - `VITE_APPS_SCRIPT_URL` = a URL do passo 5;
   - `VITE_FORM_TOKEN` = o código do passo 4.

   Depois, faça um novo deploy (Deployments > Redeploy).

7. **Proteger a planilha:** em **Compartilhar**, deixe acesso só para a secretaria e a direção. O formulário não precisa de compartilhamento: ele grava pelo script.

## O que o script faz

- Confere de novo o CPF e o formato do envio (quem chama o script direto não passa pelo formulário).
- **Bloqueia CPF repetido:** responde "já matriculado" e não grava.
- Impede que uma resposta vire fórmula (texto que começa com `=`, `+`, `-` ou `@`).
- Grava uma linha por aluno, com data e hora, protocolo (`MAT-2026-0001`) e CPF só com números. Tudo é gravado como texto, para não perder zeros à esquerda.
- Se o formulário ganhar perguntas novas, as colunas novas entram no fim, sem bagunçar as antigas.

## Mudou o script?

Depois de editar o `Code.js`, cole de novo no editor e use **Implantar > Gerenciar implantações > Editar (lápis) > Versão: Nova versão**. Assim a URL continua a mesma.
