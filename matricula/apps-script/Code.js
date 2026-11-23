/**
 * Escola+ · Matrícula: recebe o formulário e grava na planilha da escola.
 *
 * Como usar (passo a passo em apps-script/README.md):
 *   1. Abra o editor: pela planilha (Extensões > Apps Script) ou direto em https://script.new.
 *      Cole este arquivo e salve.
 *   2. Em Configurações do projeto > Propriedades do script, crie:
 *      - FORM_TOKEN: o mesmo valor de VITE_FORM_TOKEN na Vercel;
 *      - SHEET_ID: o link (ou o ID) da planilha. Só é preciso se abriu pelo script.new.
 *   3. Rode `setup` uma vez (cria as abas e a formatação).
 *   4. Implantar > Nova implantação > App da Web: executar como "Eu"; acesso "Qualquer pessoa".
 *
 * As funções puras (sem SpreadsheetApp) ficam no topo e são testadas no projeto com Vitest.
 */

/* ---------- Comece por aqui: escolha `setup` ao lado de Executar ---------- */

/** Rode uma vez: cria as abas "Matrículas" e "Resumo por curso", já formatadas. */
function setup() {
  var made = ensureSheets_();
  var sheet = made.sheet;
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, FIXED_COLUMNS.length).setValues([FIXED_COLUMNS]);
  styleHeader_(sheet, Math.max(sheet.getLastColumn(), FIXED_COLUMNS.length));

  var summary = made.summary;
  summary.clear();
  summary.getRange('A1:C1').setValues([['Modalidade', 'Curso', 'Matrículas']]);
  // Acha as colunas "Modalidade" e "Curso" pelo nome, então funciona mesmo se a ordem mudar.
  // Apps Script grava fórmulas na sintaxe em inglês (vírgulas), qualquer que seja o idioma.
  var col = function (name) {
    return "INDEX('" + SHEET_NAME + "'!A2:ZZ,0,MATCH(\"" + name + "\",'" + SHEET_NAME + "'!A1:ZZ1,0))";
  };
  summary
    .getRange('A2')
    .setFormula(
      '=IFERROR(QUERY({' + col('Modalidade') + ',' + col('Curso') +
        "},\"select Col1, Col2, count(Col2) where Col2 is not null group by Col1, Col2 label count(Col2) ''\",0),\"Sem matrículas ainda\")",
    );
  summary.getRange('E1').setValue('Total');
  summary.getRange('E2').setFormula("=COUNTA('" + SHEET_NAME + "'!B2:B)");
  summary.getRange('A1:E1').setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
  summary.getRange('E2').setFontSize(18).setFontWeight('bold').setFontColor(PINK);
  summary.setColumnWidth(1, 140);
  summary.setColumnWidth(2, 200);
  summary.setColumnWidth(3, 120);
  summary.setFrozenRows(1);
  Logger.log('Pronto: abas "' + SHEET_NAME + '" e "' + SUMMARY_NAME + '" criadas na planilha "' + made.sheet.getParent().getName() + '".');
}

/* ---------- Configuração ---------- */

var SHEET_NAME = 'Matrículas';
var SUMMARY_NAME = 'Resumo por curso';
var FIXED_COLUMNS = ['Enviado em', 'Protocolo', 'CPF do aluno'];
var MAX_COLUMNS = 400;
var MAX_CELL = 1000;

var BLUE = '#0032a8';
var CREAM = '#fef1cf';
var CREAM_DARK = '#f7e6bd';
var INK = '#141a3c';
var PINK = '#fc3b7f';

/* ---------- Funções puras ---------- */

function onlyDigits(s) {
  return String(s == null ? '' : s).replace(/\D/g, '');
}

/** Mesma conferência do formulário: os dois dígitos verificadores do CPF. */
function isValidCpf(raw) {
  var d = onlyDigits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  function digit(len) {
    var sum = 0;
    for (var i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    var r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  }
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}

/** Recusa o que não veio do formulário: CPF inválido, formato errado, texto grande demais. */
function validatePayload(data) {
  if (!data || typeof data !== 'object') return 'Envio vazio.';
  if (!isValidCpf(data.cpf)) return 'CPF inválido.';
  if (!Array.isArray(data.columns) || !Array.isArray(data.row)) return 'Formato inválido.';
  if (data.columns.length !== data.row.length || data.columns.length > MAX_COLUMNS)
    return 'Formato inválido.';
  for (var i = 0; i < data.row.length; i++) {
    if (typeof data.columns[i] !== 'string' || typeof data.row[i] !== 'string')
      return 'Formato inválido.';
    if (data.row[i].length > MAX_CELL) return 'Resposta grande demais.';
  }
  return null;
}

/**
 * Impede que uma resposta vire fórmula na planilha (=, +, -, @ no começo): um aluno poderia
 * digitar "=IMPORTXML(...)". Prefixar com apóstrofo faz o Sheets tratar como texto.
 */
function safeCell(v) {
  var s = String(v == null ? '' : v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/** Cabeçalho final: o atual mais as colunas novas que o formulário passou a enviar. */
function mergeHeader(current, columns) {
  var header = current && current.length ? current.slice() : FIXED_COLUMNS.slice();
  for (var i = 0; i < columns.length; i++) if (header.indexOf(columns[i]) < 0) header.push(columns[i]);
  return header;
}

/** Linha na ordem do cabeçalho da planilha (que pode ter colunas em outra ordem). */
function buildRow(header, data, protocolo, enviadoEm) {
  var byName = {};
  for (var i = 0; i < data.columns.length; i++) byName[data.columns[i]] = data.row[i];
  return header.map(function (col) {
    if (col === 'Enviado em') return enviadoEm;
    if (col === 'Protocolo') return protocolo;
    if (col === 'CPF do aluno') return onlyDigits(data.cpf);
    return safeCell(byName[col] != null ? byName[col] : '');
  });
}

/** Linha (0 = primeira de dados) do CPF na coluna de CPFs, ou -1. */
function findCpfRow(cpfColumn, cpf) {
  var target = onlyDigits(cpf);
  for (var i = 0; i < cpfColumn.length; i++) if (onlyDigits(cpfColumn[i]) === target) return i;
  return -1;
}

/** Aceita o link inteiro da planilha ou só o ID ("…/spreadsheets/d/<ID>/edit" → "<ID>"). */
function extractSheetId(raw) {
  var s = String(raw == null ? '' : raw).trim();
  var m = /\/d\/([a-zA-Z0-9-_]+)/.exec(s);
  return m ? m[1] : s;
}

function makeProtocol(year, n) {
  return 'MAT-' + year + '-' + ('0000' + n).slice(-4);
}

/* ---------- Planilha ---------- */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty('FORM_TOKEN');
    if (token && data.token !== token) return json({ status: 'erro', message: 'Envio não autorizado.' });
    var invalid = validatePayload(data);
    if (invalid) return json({ status: 'erro', message: invalid });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sheet = ensureSheets_().sheet;
      var lastCol = Math.max(sheet.getLastColumn(), 1);
      var current = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      current = current.filter(function (c) {
        return c !== '';
      });
      var header = mergeHeader(current, data.columns);
      if (header.length !== current.length) {
        sheet.getRange(1, 1, 1, header.length).setValues([header]);
        styleHeader_(sheet, header.length);
      }

      var dataRows = Math.max(sheet.getLastRow() - 1, 0);
      var cpfCol = header.indexOf('CPF do aluno') + 1;
      var cpfs = dataRows ? sheet.getRange(2, cpfCol, dataRows, 1).getValues().map(function (r) {
        return r[0];
      }) : [];
      if (findCpfRow(cpfs, data.cpf) >= 0) return json({ status: 'cpf_duplicado' });

      var now = new Date();
      var protocolo = makeProtocol(now.getFullYear(), dataRows + 1);
      var stamp = Utilities.formatDate(now, 'America/Recife', 'dd/MM/yyyy HH:mm');
      var row = buildRow(header, data, protocolo, stamp);
      var target = sheet.getRange(dataRows + 2, 1, 1, row.length);
      target.setNumberFormat('@').setValues([row]);
      return json({ status: 'ok', protocolo: protocolo });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json({ status: 'erro', message: 'Falha ao gravar na planilha.' });
  }
}

/** A planilha: a do SHEET_ID (script aberto pelo script.new) ou aquela onde o script foi colado. */
function spreadsheet_() {
  var id = extractSheetId(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss)
    throw new Error(
      'Planilha não encontrada. Em Configurações do projeto > Propriedades do script, crie SHEET_ID com o link da planilha.',
    );
  return ss;
}

function ensureSheets_() {
  var ss = spreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME, 0);
  var summary = ss.getSheetByName(SUMMARY_NAME) || ss.insertSheet(SUMMARY_NAME);
  return { sheet: sheet, summary: summary };
}

function styleHeader_(sheet, width) {
  var header = sheet.getRange(1, 1, 1, width);
  header
    .setBackground(BLUE)
    .setFontColor(CREAM)
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);
  sheet.setRowHeight(1, 48);
  sheet.setColumnWidths(1, width, 180);
  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 130);
  sheet.getRange(1, 1, sheet.getMaxRows(), width).setNumberFormat('@').setFontColor(INK);
  header.setFontColor(CREAM);

  // Linhas alternadas creme e filtro em todas as colunas.
  sheet.getBandings().forEach(function (b) {
    b.remove();
  });
  sheet
    .getRange(1, 1, sheet.getMaxRows(), width)
    .applyRowBanding()
    .setHeaderRowColor(BLUE)
    .setFirstRowColor('#ffffff')
    .setSecondRowColor(CREAM_DARK);
  var filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), width).createFilter();
}

/* Exporta as funções puras para os testes (no Google, `module` não existe). */
if (typeof module !== 'undefined') {
  module.exports = {
    isValidCpf: isValidCpf,
    validatePayload: validatePayload,
    safeCell: safeCell,
    mergeHeader: mergeHeader,
    buildRow: buildRow,
    findCpfRow: findCpfRow,
    makeProtocol: makeProtocol,
    extractSheetId: extractSheetId,
    FIXED_COLUMNS: FIXED_COLUMNS,
  };
}
