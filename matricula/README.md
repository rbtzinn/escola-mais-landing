# Matrícula · Escola+

Formulário de matrícula da **ETE Chico Science**, feito para substituir o Google Forms e **diminuir os erros na origem**. É um projeto separado da landing do Escola+, com o mesmo visual (rosa, creme e azul), e grava numa planilha Google Sheets da escola por Apps Script.

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
  - "Outro" sempre abre um campo de texto.
- **Opções arrumadas:** sexo com as duas opções, cor/raça no padrão do Censo Escolar, tipo sanguíneo num campo só e faixas de renda pelo salário mínimo do ano.
- **Rascunho:** o que foi digitado fica salvo no aparelho até enviar. A revisão final tem "Editar" em cada etapa.

## Configuração anual

Em [`src/config.ts`](./src/config.ts):

- escola e logo (`public/logo-ete.webp`);
- ano;
- cursos por modalidade (Integrado: Nutrição e Dietética, Farmácia; Subsequente: Farmácia, Enfermagem);
- salário mínimo.

## Integrado e Subsequente

O aluno escolhe a modalidade e só vê os cursos dela. No **Subsequente**, para quem já terminou o ensino médio:

- a idade aceita vai até 70 anos;
- aparece a etapa "Seu ensino médio": escola, pública ou particular, cidade e ano de conclusão.

Para **maiores de 18 anos**, em qualquer modalidade:

- a etapa do responsável some;
- dos dados da mãe e do pai, só o nome é obrigatório.

A aba "Resumo por curso" da planilha conta por modalidade e curso.

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
  - `submit`: envio.
- `src/components/`: `FieldView` (desenha cada tipo de campo), `Choices` (opções em botões) e `ui/` (lista e busca acessíveis, copiadas do Escola+).
- `apps-script/Code.js`: o script da planilha (cole no editor do Google).
