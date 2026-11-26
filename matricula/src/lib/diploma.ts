import { maskCpf, onlyDigits } from './cpf';
import { MODELOS, courseKeyOf, type DiplomaConfig, type DiplomaCourse } from './diplomaConfig';
import { UFS } from './ibge';
import { parseDate } from './masks';
import { toRow } from './row';
import type { Step } from './schema';

/** Colunas da planilha que a secretaria preenche na ficha do aluno (não vêm do formulário). */
export const DIPLOMA_COLUMNS = [
  'Código SISTEC',
  'Registro escolar',
  'Folha',
  'Livro',
  'Data de conclusão',
  'Semestres e frequências',
] as const;

/** Semestre e % de frequência de um módulo (Enfermagem). */
export interface ModuloFreq {
  semestre: string;
  freq: string;
}

/** "2024.1 = 87,50; 2024.2 = 87,33" (como fica na planilha) ↔ lista por módulo. */
export function parseModulos(s: string): ModuloFreq[] {
  return s
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [semestre = '', freq = ''] = part.split('=').map((x) => x.trim());
      return { semestre, freq };
    });
}

export function formatModulos(list: ModuloFreq[]): string {
  // Módulo sem nada vira "=" para não mudar a posição dos seguintes.
  const parts = list.map((m) => `${m.semestre.trim()} = ${m.freq.trim()}`);
  while (parts.length && parts[parts.length - 1] === ' = ') parts.pop();
  return parts.join('; ');
}

/** Próximo semestre ("2024.1" → "2024.2" → "2025.1"), para sugerir no campo. */
export function nextSemestre(s: string): string {
  const m = /^(\d{4})\.([12])$/.exec(s.trim());
  if (!m) return '';
  return m[2] === '1' ? `${m[1]}.2` : `${Number(m[1]) + 1}.1`;
}

/** O curso do aluno na configuração do diploma (pela modalidade e pelo curso que ele escolheu). */
export function courseOf(answers: Record<string, string>, cfg: DiplomaConfig): DiplomaCourse | undefined {
  return cfg.cursos[courseKeyOf(answers.modalidade ?? '', answers.curso ?? '')];
}

/** Respostas do aluno por id do campo, lidas da linha da planilha. */
export function answersFromRow(steps: Step[], header: string[], row: string[]): Record<string, string> {
  const { columns, fieldIds } = toRow(steps, {});
  const out: Record<string, string> = {};
  columns.forEach((col, i) => {
    const id = fieldIds[i];
    const at = header.indexOf(col);
    if (id && at >= 0) out[id] = String(row[at] ?? '').trim();
  });
  return out;
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "31/12/2025" → "31 de dezembro de 2025" ("" se a data não existe). */
export function longDate(s: string): string {
  const d = parseDate(s.trim());
  return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : '';
}

const ufName = (sigla: string) => UFS.find((u) => u.sigla === sigla.trim().toUpperCase())?.nome ?? sigla;
const upper = (s: string) => s.trim().toLocaleUpperCase('pt-BR');
const stripOutro = (s: string) => s.replace(/^Outro:\s*/, '').trim();

/** "SDS-PE" fica igual; "PC" com RG de PE vira "PC-PE". */
export function rgIssuer(orgao: string, uf: string): string {
  const o = stripOutro(orgao);
  if (!o) return '';
  if (/-[A-Z]{2}$/.test(o) || !uf.trim()) return o;
  return `${o}-${uf.trim().toUpperCase()}`;
}

/** Próximo número de registro: o maior já usado + 1, sem ficar abaixo do primeiro configurado. */
export function nextRegistro(usados: string[], primeiro: string): number {
  const first = Math.max(1, Number(primeiro) || 1);
  const max = usados.reduce((m, r) => Math.max(m, Number(onlyDigits(r)) || 0), 0);
  return Math.max(first, max + 1);
}

/** Folha do livro de registro: com 3 por folha, o registro 155 cai na folha 52. */
export function folhaOf(registro: string | number, porFolha: string): string {
  const n = Number(registro);
  const per = Math.max(1, Number(porFolha) || 3);
  return n > 0 ? String(Math.ceil(n / per)) : '';
}

export interface DiplomaFill {
  values: Record<string, string>;
  lists: Record<string, string[]>;
  /** O que ficou em branco (o diploma sai mesmo assim, com o espaço vazio). */
  missing: string[];
  /** Modelo de Word do curso (em public/). */
  arquivo: string;
  /** Listas com um parágrafo vazio entre os itens. */
  spaced: string[];
}

/** Dados que o modelo precisa: do aluno (planilha), da ficha (SISTEC, registro) e da configuração. */
export function diplomaFill(
  answers: Record<string, string>,
  extra: {
    sistec: string;
    registro: string;
    folha: string;
    livro: string;
    cpf: string;
    /** Data de conclusão deste aluno; em branco, vale a do curso. */
    conclusao?: string;
    modulos?: ModuloFreq[];
  },
  cfg: DiplomaConfig,
): DiplomaFill {
  const a = (id: string) => answers[id] ?? '';
  const curso = courseOf(answers, cfg);
  const modelo = curso ? MODELOS[curso.modelo] : undefined;
  const brasil = a('nasc_pais') !== 'Outro país';
  const pais = upper(a('nasc_pais_outro'));
  const conclusao = (extra.conclusao || curso?.conclusao || '').trim();
  const integrado = a('modalidade') !== 'Subsequente';
  const ant = integrado
    ? { escola: a('ef_escola'), ano: a('ef_ano'), cidade: a('ef_cidade'), uf: a('ef_uf'), hab: 'ENSINO FUNDAMENTAL' }
    : { escola: a('em_escola'), ano: a('em_ano'), cidade: a('em_cidade'), uf: a('em_uf'), hab: 'ENSINO MÉDIO' };
  const filiacao = [a('pai_nome'), a('mae_nome')].filter(Boolean).map(upper).join(' e ');
  const cpf = maskCpf(onlyDigits(extra.cpf || a('aluno_cpf')));

  const values: Record<string, string> = {
    cab_secretaria: cfg.cabecalho.secretaria,
    cab_gerencia: cfg.cabecalho.gerencia,
    cab_escola: cfg.cabecalho.escola,
    cab_endereco: cfg.cabecalho.endereco,
    cab_atos: cfg.cabecalho.atos,
    portaria_curso: curso?.portaria ?? '',
    escola_nome: cfg.escolaNome,
    sistec: extra.sistec.trim(),
    titulo: curso?.titulo ?? (a('curso') ? `Técnico em ${a('curso')}` : ''),
    nome: upper(a('aluno_nome')),
    filiacao,
    naturalidade: brasil
      ? [upper(a('nasc_cidade')), upper(ufName(a('nasc_uf')))].filter(Boolean).join('-')
      : pais,
    nacionalidade: brasil ? 'BRASILEIRA' : pais,
    nascimento: a('aluno_nascimento'),
    rg: a('aluno_rg'),
    rg_orgao: rgIssuer(a('aluno_rg_orgao'), a('aluno_rg_uf')),
    cpf,
    conclusao_data: longDate(conclusao),
    conclusao_texto: curso?.conclusaoTexto ?? '',
    eixo: curso?.eixo ?? '',
    sec_nome: cfg.secretaria.nome,
    sec_cargo: cfg.secretaria.cargo,
    sec_ato: cfg.secretaria.ato,
    sec_do: cfg.secretaria.publicacao,
    sec_matricula: cfg.secretaria.matricula,
    dir_nome: cfg.diretor.nome,
    dir_cargo: cfg.diretor.cargo,
    dir_ato: cfg.diretor.ato,
    dir_do: cfg.diretor.publicacao,
    dir_matricula: cfg.diretor.matricula,
    ant_escola: upper(ant.escola),
    ant_ano: ant.ano,
    ant_cidade: upper(ant.cidade),
    ant_uf: upper(ufName(ant.uf)),
    ant_habilitacao: ant.hab,
    registro: extra.registro.trim(),
    folha: extra.folha.trim(),
    livro: extra.livro.trim(),
    cidade: cfg.cidade,
    ch_total: curso?.chTotal ?? '',
    ...(curso?.extras ?? {}),
  };
  const lists: Record<string, string[]> = { perfil: curso?.perfil ?? [] };
  (curso?.blocos ?? []).forEach((b, i) => {
    const n = i + 1;
    const m = extra.modulos?.[i];
    values[`b${n}_sigla`] = b.sigla;
    values[`b${n}_titulo`] = b.titulo;
    values[`b${n}_total`] = b.total;
    values[`b${n}_semestre`] = m?.semestre.trim() ?? '';
    values[`b${n}_freq`] = m?.freq.trim() ?? '';
    lists[`b${n}_nomes`] = b.itens.map((it) => it.nome);
    lists[`b${n}_ch`] = b.itens.map((it) => it.ch);
  });

  const LABELS: [string, string][] = [
    ['nome', 'nome do aluno'],
    ['filiacao', 'nome da mãe ou do pai'],
    ['naturalidade', 'cidade de nascimento'],
    ['nascimento', 'data de nascimento'],
    ['rg', 'RG'],
    ['rg_orgao', 'órgão expedidor do RG'],
    ['cpf', 'CPF'],
    ['ant_escola', integrado ? 'escola do ensino fundamental' : 'escola do ensino médio'],
    ['ant_ano', 'ano de conclusão da escola anterior'],
    ['ant_cidade', 'cidade da escola anterior'],
    ['sistec', 'código SISTEC'],
    ['registro', 'registro escolar'],
    ['folha', 'folha'],
    ['livro', 'livro'],
    ['conclusao_data', 'data de conclusão'],
  ];
  const missing = LABELS.filter(([k]) => !values[k]).map(([, label]) => label);
  if (modelo?.frequencia)
    curso!.blocos.forEach((b, i) => {
      if (!values[`b${i + 1}_semestre`] || !values[`b${i + 1}_freq`])
        missing.push(`semestre e frequência do módulo ${b.sigla || i + 1}`);
    });
  if (!curso) missing.push('curso sem verso configurado');
  else if (!curso.revisado) missing.push(`verso de ${curso.titulo} ainda não conferido (aba Diploma)`);
  return {
    values,
    lists,
    missing,
    arquivo: modelo?.arquivo ?? MODELOS.integrado.arquivo,
    spaced: modelo?.perfilEspacado ? ['perfil'] : [],
  };
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Preenche o document.xml do modelo: {{chave}} vira o valor; o parágrafo com {{#chave}} é
 * repetido uma vez por item da lista (lista vazia: o parágrafo fica, em branco). Nas listas
 * de `spaced`, entre um item e outro vai um parágrafo vazio, como no modelo.
 */
export function fillTemplate(
  xml: string,
  values: Record<string, string>,
  lists: Record<string, string[]>,
  spaced: string[] = [],
): string {
  // O parágrafo mais de dentro que contém o marcador (nada de outro "<w:p" no meio).
  const out = xml.replace(/<w:p[ >](?:(?!<w:p[ >]).)*?\{\{#(\w+)\}\}.*?<\/w:p>/gs, (para, key: string) => {
    const items = lists[key] ?? [];
    if (!items.length) return para.replace(`{{#${key}}}`, '');
    // Linha em branco: o mesmo parágrafo sem texto e sem marcador de lista (✓).
    const spacer = spaced.includes(key)
      ? para.replace(/<w:r[ >].*?<\/w:r>/gs, '').replace(/<w:numPr>.*?<\/w:numPr>/gs, '')
      : '';
    return items
      .map((it, i) => (i > 0 ? spacer : '') + para.replace(`{{#${key}}}`, escapeXml(it)))
      .join('');
  });
  return out.replace(/\{\{(\w+)\}\}/g, (_, key: string) => escapeXml(values[key] ?? ''));
}

/** Nome do arquivo: "Diploma - ANA SOUZA LIMA.docx" (sem caracteres que o Windows recusa). */
export function diplomaFileName(nome: string): string {
  const clean = nome.replace(/[\\/:*?"<>|]/g, '').trim() || 'aluno';
  return `Diploma - ${clean}.docx`;
}

/** Monta o .docx: abre o modelo, preenche o document.xml e fecha de novo. */
export async function buildDiplomaDocx(template: Uint8Array, fill: DiplomaFill): Promise<Uint8Array> {
  const { strFromU8, unzipSync, zipSync } = await import('fflate');
  const files = unzipSync(template);
  const doc = files['word/document.xml'];
  if (!doc) throw new Error('Modelo do diploma inválido.');
  // Uint8Array.from: o zip só aceita bytes do mesmo "Uint8Array" (nos testes, o TextEncoder é de outro).
  const xml = fillTemplate(strFromU8(doc), fill.values, fill.lists, fill.spaced);
  files['word/document.xml'] = Uint8Array.from(new TextEncoder().encode(xml));
  return zipSync(files, { level: 6 });
}

/** Baixa o modelo do curso (public/diploma-*.docx), preenche e entrega o arquivo para salvar. */
export async function downloadDiploma(fill: DiplomaFill, nome: string): Promise<void> {
  const res = await fetch(fill.arquivo);
  if (!res.ok) throw new Error('Não foi possível baixar o modelo do diploma.');
  const bytes = await buildDiplomaDocx(new Uint8Array(await res.arrayBuffer()), fill);
  const blob = new Blob([bytes as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = diplomaFileName(nome);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** O que a escola já salvou na ficha do aluno (colunas DIPLOMA_COLUMNS da planilha). */
export function savedDiploma(header: string[], row: string[]) {
  const cell = (name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? String(row[i] ?? '').trim() : '';
  };
  return {
    sistec: cell('Código SISTEC'),
    registro: cell('Registro escolar'),
    folha: cell('Folha'),
    livro: cell('Livro'),
    conclusao: cell('Data de conclusão'),
    modulos: cell('Semestres e frequências'),
  };
}

/** Diploma só com o que já está salvo (o botão da lista de matrículas). */
export function fillFromSaved(
  steps: Step[],
  header: string[],
  row: string[],
  cpf: string,
  cfg: DiplomaConfig,
): DiplomaFill {
  const s = savedDiploma(header, row);
  return diplomaFill(answersFromRow(steps, header, row), { ...s, cpf, modulos: parseModulos(s.modulos) }, cfg);
}
