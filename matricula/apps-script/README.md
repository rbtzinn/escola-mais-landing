# Planilha da matrícula (Google Sheets + Apps Script)

Passo a passo para quem tem acesso à **conta Google institucional da escola** (uns 10 minutos). Os dados são de menores de idade e incluem saúde e cor/raça: use a conta da escola, nunca uma conta pessoal.

1. **Criar a planilha:** no Google Drive da escola, crie uma planilha em branco (por exemplo, "Matrículas 2026") e copie o link dela.
2. **Abrir o editor:** abra https://script.new com a conta da escola (no celular, pelo Chrome). Também dá para abrir pela planilha, em **Extensões > Apps Script**; nesse caso o `SHEET_ID` do passo 4 não é preciso.
3. **Colar o script:** apague o que estiver no editor, cole todo o conteúdo de [`Code.js`](./Code.js) e salve.
4. **Propriedades do script:** em **Configurações do projeto** (engrenagem) > **Propriedades do script**, adicione:
   - `SHEET_ID` = o link da planilha (pode ser o link inteiro);
   - `FORM_TOKEN` = um código qualquer contra spam, por exemplo `ete-2026-x7k2`, igual ao `VITE_FORM_TOKEN` da Vercel;
   - `ADMIN_SENHA` = a senha de emergência do painel (login `admin`). Use uma senha forte e guarde bem.
5. **Criar as abas:** escolha a função `setup` e clique em **Executar**. Autorize com a conta da escola. Na planilha aparecem as abas **Matrículas**, **Resumo por curso**, **Aprovados** e **Config**.
   - **Aprovados:** cole a lista de aprovados. Só **CPF** e **Data de nascimento** (dd/mm/aaaa) são obrigatórios. Se **Modalidade** e **Curso** estiverem preenchidos, o aluno só consegue escolher esse curso. **Sem a lista, ninguém consegue se matricular.**
   - **Config:** se quiser, preencha **Início da matrícula** e **Fim da matrícula** (dd/mm/aaaa). Em branco, o formulário fica aberto.
6. **Publicar:** **Implantar > Nova implantação**, tipo **App da Web**:
   - _Executar como:_ **Eu** (a conta da escola);
   - _Quem pode acessar:_ **Qualquer pessoa** (os alunos não fazem login; quem grava é o script).

   Copie a **URL do app da Web** (termina em `/exec`).

7. **Ligar o formulário:** na Vercel, em **Settings > Environment Variables**, crie `VITE_APPS_SCRIPT_URL` (a URL do passo 6) e `VITE_FORM_TOKEN` (o código do passo 4). Depois, faça um **Redeploy**.
8. **Proteger a planilha:** em **Compartilhar**, deixe acesso só para a secretaria e a direção.
9. **Painel:** abra o site do formulário com `/admin` no fim (ex.: `https://…vercel.app/admin`). Entre com o login `admin` e a `ADMIN_SENHA`. Na aba **Usuários**, crie um usuário para cada pessoa (direção ou coordenação) e passe o login e a senha para ela. Depois disso, use o `admin` só em emergência.

## Painel (/admin)

- **Direção** vê e faz tudo; **coordenação** só vê as matrículas e muda o status.
- **Visão geral:** matrículas ativas, matriculados, pendentes e cancelados; gráfico por curso e envios por dia; lista dos pendentes com o motivo.
- **Matrículas:** busca por nome, CPF ou protocolo, filtro por curso e status, ficha completa do aluno e **Baixar planilha (CSV)**, que abre no Excel.
- **Status:** toda matrícula entra como **Matriculado**. A coordenação pode marcar **Pendente** (com motivo obrigatório) ou **Cancelado** (sai do resumo e libera o CPF). Fica registrado quem mudou e quando.
- **Período:** as datas de início e fim (vão para a aba **Config**).
- **Exceções:** libera um aluno específico (CPF + nascimento), **uma vez só, até o prazo**: fora do período, fora da lista de aprovados e/ou reenvio com o mesmo CPF (a matrícula antiga vira Cancelado).
- **Aprovados:** cole a lista direto da planilha da seleção; o painel mostra o que está certo e o que foi recusado antes de salvar.
- **Usuários:** criar, trocar senha e desativar. As senhas ficam embaralhadas na aba **Usuários** (escondida e protegida): ninguém consegue ler.
- Login vale por 8 horas. Depois de 5 senhas erradas, o login fica bloqueado por 15 minutos.

## O que o script faz

- **Só aprovados:** no começo do formulário, o aluno digita CPF e data de nascimento e o script confere na aba **Aprovados**. Fora da lista, a mensagem é genérica ("não encontramos seus dados"), sem dizer se o CPF existe. No envio, confere tudo de novo, inclusive o curso.
- **Período:** fora das datas da aba **Config**, recusa e mostra o período.
- **Limites:** mais de 5 tentativas erradas com o mesmo CPF em 1 hora, ou mais de 60 pedidos por minuto no total, são recusados por um tempo.
- **Status:** toda matrícula entra como **Matriculado**; **Pendente** fica amarelo e **Cancelado** fica cinza (sai do resumo e libera o CPF). Dá para mudar pelo painel ou direto na planilha; o **Resumo por curso** se atualiza sozinho.
- Confere de novo o CPF e o formato do envio (quem chama o script direto não passa pelo formulário).
- **Bloqueia CPF repetido:** responde "já matriculado" e não grava.
- Impede que uma resposta vire fórmula (texto que começa com `=`, `+`, `-` ou `@`).
- Grava uma linha por aluno, com data e hora, protocolo (`MAT-2026-0001`) e CPF só com números. Tudo é gravado como texto, para não perder zeros à esquerda.
- Se o formulário ganhar perguntas novas, as colunas novas entram no fim, sem bagunçar as antigas.

## Mudou o script?

Depois de editar o `Code.js`, cole de novo no editor, rode `setup` de novo (ele não apaga nada; cria o que faltar e pode pedir uma nova autorização) e use **Implantar > Gerenciar implantações > Editar (lápis) > Versão: Nova versão**. Assim a URL continua a mesma.
