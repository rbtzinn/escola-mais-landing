# Matrícula · Escola+

Formulário de matrícula da **ETE Chico Science**, feito para substituir o Google Forms e **diminuir os erros na origem**. É um projeto separado da landing do Escola+, com o mesmo visual (rosa, creme e azul), e grava numa planilha Google Sheets da escola por Apps Script. Em `/admin` fica o **painel** da direção e da coordenação (status das matrículas, período, exceções, aprovados e usuários); veja o [passo a passo da planilha](./apps-script/README.md#painel-admin).

## O que evita erro

- **CPF:** máscara e conferência dos dígitos verificadores. Barra quase todo erro de digitação, mas não diz de quem é o CPF (isso exigiria API paga da Receita). Também recusa o mesmo CPF para duas pessoas do formulário.
- **Telefones:** máscara de celular `(81) 9 9999-9999` e fixo, conferindo o DDD.
- **Datas:** `dd/mm/aaaa`, recusando data que não existe, data no futuro, expedição do RG antes do nascimento e idade fora do esperado.
- **Endereço:** o CEP preenche rua, bairro, cidade e estado (ViaCEP, com a BrasilAPI de reserva). "Não sei meu CEP" busca pelo nome da rua.
- **Estado e cidade:** escolher o estado filtra as cidades (API do IBGE; as de Pernambuco já vêm no site, para internet fraca).
- **Nomes e e-mail:** nomes sem espaço duplo e com iniciais maiúsculas; sugestão de e-mail ("gmial.com" → "gmail.com").
- **Perguntas que se adaptam:**
  - mãe ou pai falecido ou "não consta na certidão" pula os dados dele;
  - o responsável só pede dados se for "outra pessoa";
  - para menores de idade, RG (e órgão expedidor) da mãe e do pai vivos é obrigatório;
  - "Outro" sempre abre um campo de texto.
- **Opções arrumadas:** gênero (Feminino, Masculino ou Outro), como no formulário da escola, cor/raça no padrão do Censo Escolar, tipo sanguíneo num campo só e faixas de renda pelo salário mínimo do ano.
- **Rascunho:** o que foi digitado fica salvo no aparelho até enviar. A revisão final tem "Editar" em cada etapa.

## Configuração anual

Em [`src/config.ts`](./src/config.ts):

- escola e logo (`public/logo-ete.webp`);
- ano;
- cursos por modalidade (Integrado: Nutrição e Dietética, Farmácia; Subsequente: Farmácia, Enfermagem);
- salário mínimo.

## Integrado e Subsequente

O aluno escolhe a modalidade e só vê os cursos dela. No **Integrado** aparece a etapa "Seu ensino fundamental" (escola, cidade, estado e ano de conclusão), que vai para o diploma.

No **Subsequente**, para quem já terminou o ensino médio:

- a idade aceita vai até 70 anos;
- aparece a etapa "Seu ensino médio": escola, pública ou particular, cidade e ano de conclusão.

Para **maiores de 18 anos**, em qualquer modalidade:

- a etapa do responsável some;
- dos dados da mãe e do pai, só o nome é obrigatório.

A aba "Resumo por curso" da planilha conta por modalidade e curso.

## Diploma

O painel gera o diploma em Word (.docx) no modelo do curso do aluno, sem a coordenação digitar os dados dele. Cada curso usa o modelo enviado pela escola (em `public/`):

| Curso | Modelo |
| --- | --- |
| Farmácia e Nutrição e Dietética (Integrado) | `diploma-integrado.docx` (4 blocos: FGB, IF-AC e dois IF-EPT) |
| Farmácia (Subsequente) | `diploma-farmacia-subsequente.docx` (3 módulos com total) |
| Enfermagem (Subsequente) | `diploma-enfermagem-subsequente.docx` (4 módulos com semestre e frequência, quadro de estágio) |

- **Do formulário:** nome, filiação (o nome da mãe e do pai é pedido mesmo se falecidos), naturalidade, nacionalidade, nascimento, RG e órgão, CPF, curso e a escola anterior (ensino fundamental no Integrado, ensino médio no Subsequente). Tudo sai no mesmo formato em todos os cursos: nacionalidade BRASILEIRA, órgão como o aluno escreveu (ex.: SDS-PE) e nascimento em dd/mm/aaaa.
- **Na ficha do aluno (painel), o que só a escola tem:** código SISTEC, registro escolar, folha e livro (o registro vem sugerido e a folha calculada, 3 por folha; registro repetido é recusado), a data de conclusão (vem a do curso; dá para trocar só para aquele aluno) e, em Enfermagem, semestre e % de frequência de cada módulo. "Salvar e baixar diploma" grava e baixa de uma vez.
- **Um clique na lista:** o botão "Diploma" em cada matrícula baixa direto quando os dados da escola já estão salvos; se faltar algo, abre a ficha mostrando o quê.
- **Na aba Diploma (direção):** cidade, cabeçalho, secretária e diretor, numeração do livro e, por curso, o modelo, a data de conclusão da turma, o texto da conclusão, a portaria, as disciplinas com C.H., os totais, o perfil e (Enfermagem) o quadro de estágio. Contas que não fecham geram aviso. Curso novo, sem modelo, começa como rascunho.

Os modelos foram gerados dos arquivos da escola por `scripts/diploma_modelo.py` (troca a mala direta por marcadores `{{chave}}` e tira os objetos OLE de ~7 MB). Se a escola trocar um modelo, rode o script de novo (instruções no topo dele).

## Rodar

```bash
cd matricula
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest (lógica, telas e funções do Apps Script)
npm run build      # checa tipos e gera dist/
npm run lint
```

Sem `VITE_APPS_SCRIPT_URL`, o envio fica em modo de demonstração e oferece baixar as respostas em CSV.

## Deploy na Vercel

Crie um **projeto novo** na Vercel a partir deste mesmo repositório, com **Root Directory = `matricula`** (framework Vite). Configure as variáveis do [passo a passo da planilha](./apps-script/README.md).

## Estrutura

- `src/lib/`: funções puras e testadas:
  - `cpf`, `masks`, `names`, `email`: validações e máscaras;
  - `cep`, `ibge`: CEP, cidades e estados;
  - `schema`: etapas, campos e regras de exibição;
  - `validate`: erros por etapa;
  - `row`: linha da planilha;
  - `draft`: rascunho no aparelho;
  - `submit`: envio e conferência do período;
  - `adminApi`, `adminData`: sessão, chamadas e números do painel;
  - `diploma`, `diplomaConfig`: dados, numeração e preenchimento do diploma.
- `src/admin/`: o painel `/admin` (carregado à parte; quem só se matricula não baixa).
- `src/components/`: `FieldView` (desenha cada tipo de campo), `Choices` (opções em botões) e `ui/` (lista e busca acessíveis, copiadas do Escola+).
- `apps-script/Code.js`: o script da planilha (cole no editor do Google).
