/**
 * Escola+ · Matrícula: recebe o formulário e grava na planilha da escola.
 *
 * Como usar (passo a passo em apps-script/README.md):
 *   1. Abra o editor: pela planilha (Extensões > Apps Script) ou direto em https://script.new.
 *      Cole este arquivo e salve.
 *   2. Em Configurações do projeto > Propriedades do script, crie:
 *      - FORM_TOKEN: o mesmo valor de VITE_FORM_TOKEN na Vercel;
 *      - SHEET_ID: o link (ou o ID) da planilha. Só é preciso se abriu pelo script.new.
 *   3. Rode `setup` (cria as abas e a formatação; rode de novo sempre que trocar este código).
 *   4. Cole os aprovados na aba "Aprovados" (CPF e data de nascimento; modalidade e curso
 *      opcionais) e, se quiser, o período na aba "Config".
 *   5. Implantar > Nova implantação > App da Web: executar como "Eu"; acesso "Qualquer pessoa".
 *
 * Travas: só quem está na lista de aprovados (CPF + nascimento) se matricula, dentro do
 * período, sem repetir CPF; muitas tentativas erradas ou envios em rajada são recusados.
 * Toda matrícula entra como "Pendente"; a secretaria muda o Status para "Confirmada".
 *
 * As funções puras (sem SpreadsheetApp) ficam no topo e são testadas no projeto com Vitest.
 */

/* ---------- Comece por aqui: escolha `setup` ao lado de Executar ---------- */

/**
 * Rode uma vez (e de novo sempre que atualizar este código): cria as abas "Matrículas",
 * "Resumo por curso", "Aprovados" e "Config", já formatadas, sem apagar o que já existe.
 */
function setup() {
  var made = ensureSheets_();
  var sheet = made.sheet;
  var current = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0] : [];
  var header = mergeHeader(
    current.filter(function (c) {
      return c !== '';
    }),
    [],
  );
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  styleHeader_(sheet, header.length);
  setupApproved_(made.approved);
  setupConfig_(made.config);
  writeSummary_(made.summary, sheet);
  installSummaryTrigger_(sheet.getParent());
  removeEmptyDefaultSheet_(sheet.getParent());

  var aprovados = Math.max(made.approved.getLastRow() - 1, 0);
  Logger.log('Pronto: abas criadas na planilha "' + sheet.getParent().getName() + '".');
  Logger.log(
    aprovados
      ? 'Lista de aprovados: ' + aprovados + ' aluno(s).'
      : 'ATENÇÃO: a aba "' + APPROVED_NAME + '" está vazia. Cole CPF e data de nascimento dos aprovados; sem isso ninguém consegue se matricular.',
  );
}

/** Roda sozinho quando alguém edita a planilha (ex.: muda o Status): refaz o resumo. */
function atualizarResumo(e) {
  if (e && e.range && e.range.getSheet().getName() !== SHEET_NAME) return;
  var made = ensureSheets_();
  writeSummary_(made.summary, made.sheet);
}

/* ---------- Configuração ---------- */

var SHEET_NAME = 'Matrículas';
var SUMMARY_NAME = 'Resumo por curso';
var APPROVED_NAME = 'Aprovados';
var CONFIG_NAME = 'Config';
var FIXED_COLUMNS = ['Enviado em', 'Protocolo', 'Status', 'CPF do aluno'];
var APPROVED_COLUMNS = ['CPF', 'Data de nascimento', 'Nome', 'Modalidade', 'Curso'];
var STATUS = ['Pendente', 'Confirmada', 'Cancelada'];
var TZ = 'America/Recife';
var MAX_COLUMNS = 400;
var MAX_CELL = 1000;

/** Limites contra quem tenta lotar a planilha ou adivinhar dados. */
var MAX_REQUESTS_PER_MINUTE = 60; // todos os alunos juntos
var MAX_FAILS_PER_CPF = 5; // CPF + nascimento errados, por hora
var FAIL_WINDOW_SECONDS = 3600;

var BLUE = '#0032a8';
var CREAM = '#fef1cf';
var CREAM_DARK = '#f7e6bd';
var INK = '#141a3c';
var PINK = '#fc3b7f';
var GREEN = '#d7f0dc';
var GRAY = '#e4e4e4';

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

/**
 * Cabeçalho final: o atual mais as colunas que faltam (as fixas, como "Status" em planilha
 * antiga, e as novas que o formulário passou a enviar).
 */
function mergeHeader(current, columns) {
  var header = current && current.length ? current.slice() : [];
  FIXED_COLUMNS.concat(columns).forEach(function (c) {
    if (header.indexOf(c) < 0) header.push(c);
  });
  return header;
}

/** Linha na ordem do cabeçalho da planilha (que pode ter colunas em outra ordem). */
function buildRow(header, data, protocolo, enviadoEm) {
  var byName = {};
  for (var i = 0; i < data.columns.length; i++) byName[data.columns[i]] = data.row[i];
  return header.map(function (col) {
    if (col === 'Enviado em') return enviadoEm;
    if (col === 'Protocolo') return protocolo;
    if (col === 'Status') return 'Pendente';
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

/**
 * Contagem por modalidade e curso a partir das linhas da planilha (sem o cabeçalho):
 * [modalidade, curso, matrículas, confirmadas]. Matrícula cancelada não conta.
 * Feita pelo script, e não por fórmula, para funcionar em planilha de qualquer idioma.
 */
function countByCourse(header, rows) {
  var im = header.indexOf('Modalidade');
  var ic = header.indexOf('Curso');
  var is = header.indexOf('Status');
  if (ic < 0) return [];
  var counts = {};
  var order = [];
  rows.forEach(function (r) {
    var curso = String(r[ic] || '').trim();
    var status = is >= 0 ? String(r[is] || '').trim() : '';
    if (!curso || status === 'Cancelada') return;
    var mod = im >= 0 ? String(r[im] || '').trim() : '';
    var key = mod + '\u0000' + curso;
    if (!(key in counts)) {
      counts[key] = [0, 0];
      order.push(key);
    }
    counts[key][0]++;
    if (status === 'Confirmada') counts[key][1]++;
  });
  return order.sort().map(function (k) {
    var parts = k.split('\u0000');
    return [parts[0], parts[1], counts[k][0], counts[k][1]];
  });
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

/* ---------- Lista de aprovados, período e limites (funções puras) ---------- */

/** Texto para comparar: sem acento, minúsculo, espaços simples ("Farmácia " = "farmacia"). */
function normText(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** CPF com 11 dígitos, repondo zeros que a planilha come quando o CPF vira número. */
function normCpf(s) {
  var d = onlyDigits(s);
  return d.length >= 9 && d.length < 11 ? ('00' + d).slice(-11) : d;
}

/**
 * Data em texto ("15/03/2010", "5/3/2010", "15-03-2010", "2010-03-15") como chave "20100315",
 * ou "" se não for uma data de verdade.
 */
function dateKey(s) {
  var t = String(s == null ? '' : s).trim();
  var m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(t);
  var y, mo, d;
  if (m) {
    d = +m[1];
    mo = +m[2];
    y = +m[3];
  } else if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t))) {
    y = +m[1];
    mo = +m[2];
    d = +m[3];
  } else return '';
  var date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return '';
  return String(y) + ('0' + mo).slice(-2) + ('0' + d).slice(-2);
}

/** "20270201" → "01/02/2027". */
function formatKey(k) {
  return k ? k.slice(6, 8) + '/' + k.slice(4, 6) + '/' + k.slice(0, 4) : '';
}

/** 'antes', 'aberto' ou 'depois'. Data em branco não limita. */
function periodStatus(todayKey, startKey, endKey) {
  if (startKey && todayKey < startKey) return 'antes';
  if (endKey && todayKey > endKey) return 'depois';
  return 'aberto';
}

/**
 * Linhas da aba Aprovados viram {cpf, nasc, modalidade, curso}. Acha as colunas pelo nome,
 * então a escola pode mudar a ordem ou acrescentar outras. `toKey` converte a data da célula.
 */
function readApproved(header, rows, toKey) {
  var h = header.map(normText);
  var ic = h.indexOf('cpf');
  var inasc = h.indexOf('data de nascimento');
  var im = h.indexOf('modalidade');
  var icur = h.indexOf('curso');
  if (ic < 0 || inasc < 0) return [];
  return rows
    .map(function (r) {
      return {
        cpf: normCpf(r[ic]),
        nasc: (toKey || dateKey)(r[inasc]),
        modalidade: im >= 0 ? String(r[im] || '').trim() : '',
        curso: icur >= 0 ? String(r[icur] || '').trim() : '',
      };
    })
    .filter(function (a) {
      return a.cpf.length === 11;
    });
}

/** O aprovado com esse CPF e essa data de nascimento, ou null. */
function findApproved(list, cpf, nascimento) {
  var c = normCpf(cpf);
  var n = dateKey(nascimento);
  if (!n) return null;
  for (var i = 0; i < list.length; i++) if (list[i].cpf === c && list[i].nasc === n) return list[i];
  return null;
}

/** Valor de uma coluna no envio do formulário ("Curso", "Data de nascimento"...). */
function columnValue(data, name) {
  var i = data.columns.indexOf(name);
  return i >= 0 ? String(data.row[i] || '').trim() : '';
}

/** A modalidade ou o curso escolhidos batem com os da lista? (Coluna vazia na lista: tudo vale.) */
function courseMatches(approved, modalidade, curso) {
  if (approved.modalidade && normText(approved.modalidade) !== normText(modalidade)) return false;
  if (approved.curso && normText(approved.curso) !== normText(curso)) return false;
  return true;
}

/** Soma 1 num contador do cache e devolve o novo valor. */
function bump(cache, key, seconds) {
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), seconds);
  return n;
}

/** Passou do limite de pedidos por minuto (todos juntos)? */
function tooManyRequests(cache, nowMs) {
  return bump(cache, 'req:' + Math.floor(nowMs / 60000), 120) > MAX_REQUESTS_PER_MINUTE;
}

/** Esse CPF já errou demais na última hora? */
function tooManyFails(cache, cpf) {
  return Number(cache.get('fail:' + normCpf(cpf)) || 0) >= MAX_FAILS_PER_CPF;
}

function registerFail(cache, cpf) {
  bump(cache, 'fail:' + normCpf(cpf), FAIL_WINDOW_SECONDS);
}

/* ---------- Planilha ---------- */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Dois pedidos chegam aqui:
 *  - action "check": no começo do formulário, confere CPF e nascimento na lista de aprovados;
 *  - sem action: o envio da matrícula, que confere tudo de novo antes de gravar.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty('FORM_TOKEN');
    if (token && data.token !== token) return json({ status: 'erro', message: 'Envio não autorizado.' });
    if (!data || !isValidCpf(data.cpf)) return json({ status: 'erro', message: 'CPF inválido.' });
    if (data.action !== 'check') {
      var invalid = validatePayload(data);
      if (invalid) return json({ status: 'erro', message: invalid });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      return json(data.action === 'check' ? check_(data) : save_(data));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json({ status: 'erro', message: 'Falha ao gravar na planilha.' });
  }
}

/** Travas comuns aos dois pedidos: limite, período, lista e CPF já matriculado. */
function gate_(made, cpf, nascimento) {
  var cache = CacheService.getScriptCache();
  if (tooManyRequests(cache, Date.now()) || tooManyFails(cache, cpf)) return { result: { status: 'muitas_tentativas' } };

  var period = readPeriod_(made.config);
  var today = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  if (periodStatus(today, period.start, period.end) !== 'aberto')
    return { result: { status: 'fora_do_periodo', inicio: formatKey(period.start), fim: formatKey(period.end) } };

  var approved = findApproved(readApprovedSheet_(made.approved), cpf, nascimento);
  if (!approved) {
    registerFail(cache, cpf);
    return { result: { status: 'nao_encontrado' } };
  }
  if (findActiveCpf_(made.sheet, cpf)) return { result: { status: 'cpf_duplicado' } };
  return { approved: approved };
}

function check_(data) {
  var made = ensureSheets_();
  var g = gate_(made, data.cpf, data.nascimento);
  if (g.result) return g.result;
  return { status: 'ok', modalidade: g.approved.modalidade, curso: g.approved.curso };
}

function save_(data) {
  var made = ensureSheets_();
  var sheet = made.sheet;
  var g = gate_(made, data.cpf, columnValue(data, 'Data de nascimento'));
  if (g.result) return g.result;
  if (!courseMatches(g.approved, columnValue(data, 'Modalidade'), columnValue(data, 'Curso')))
    return { status: 'curso_diferente' };

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
  var now = new Date();
  var protocolo = makeProtocol(now.getFullYear(), dataRows + 1);
  var stamp = Utilities.formatDate(now, TZ, 'dd/MM/yyyy HH:mm');
  var row = buildRow(header, data, protocolo, stamp);
  sheet.getRange(dataRows + 2, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  writeSummary_(made.summary, sheet);
  return { status: 'ok', protocolo: protocolo };
}

/** O CPF já tem matrícula que não foi cancelada? */
function findActiveCpf_(sheet, cpf) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var header = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
  var ic = header.indexOf('CPF do aluno');
  var is = header.indexOf('Status');
  if (ic < 0) return false;
  var active = rows
    .filter(function (r) {
      return is < 0 || String(r[is]).trim() !== 'Cancelada';
    })
    .map(function (r) {
      return r[ic];
    });
  return findCpfRow(active, cpf) >= 0;
}

/** Data de uma célula (texto ou data de verdade da planilha) como chave "aaaammdd". */
function cellDateKey_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()))
    return Utilities.formatDate(v, TZ, 'yyyyMMdd');
  return dateKey(v);
}

function readApprovedSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(1, 1, lastRow, Math.max(sheet.getLastColumn(), 1)).getValues();
  return readApproved(values[0], values.slice(1), cellDateKey_);
}

/** Início e fim da matrícula na aba Config (linhas "Início da matrícula" e "Fim da matrícula"). */
function readPeriod_(sheet) {
  var lastRow = sheet.getLastRow();
  var out = { start: '', end: '' };
  if (lastRow < 1) return out;
  sheet
    .getRange(1, 1, lastRow, 2)
    .getValues()
    .forEach(function (r) {
      var label = normText(r[0]);
      if (label === 'inicio da matricula') out.start = cellDateKey_(r[1]);
      if (label === 'fim da matricula') out.end = cellDateKey_(r[1]);
    });
  return out;
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
  var approved = ss.getSheetByName(APPROVED_NAME) || ss.insertSheet(APPROVED_NAME);
  var config = ss.getSheetByName(CONFIG_NAME) || ss.insertSheet(CONFIG_NAME);
  return { sheet: sheet, summary: summary, approved: approved, config: config };
}

/** Aba "Aprovados": cabeçalho e colunas como texto (CPF não perde o zero do começo). */
function setupApproved_(sheet) {
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, APPROVED_COLUMNS.length).setValues([APPROVED_COLUMNS]);
  var width = Math.max(sheet.getLastColumn(), APPROVED_COLUMNS.length);
  sheet.getRange(1, 1, sheet.getMaxRows(), width).setNumberFormat('@');
  sheet.getRange(1, 1, 1, width).setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, width, 160);
  sheet.setColumnWidth(3, 260);
  sheet
    .getRange(1, 1)
    .setNote(
      'Cole aqui os aprovados. Só CPF e Data de nascimento (dd/mm/aaaa) são obrigatórios. ' +
        'Se Modalidade e Curso estiverem preenchidos, o aluno só consegue escolher esse curso.',
    );
}

/** Aba "Config": período da matrícula. Em branco, não limita. */
function setupConfig_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 4, 2).setValues([
      ['Configuração', 'Valor'],
      ['Início da matrícula', ''],
      ['Fim da matrícula', ''],
      ['Como usar', 'Datas no formato dd/mm/aaaa. Em branco, o formulário fica aberto.'],
    ]);
  }
  sheet.getRange('B2:B3').setNumberFormat('@');
  sheet.getRange('A1:B1').setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
  sheet.getRange('A4:B4').setFontColor('#666666').setWrap(true);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 260);
  sheet.setFrozenRows(1);
}

/** Gatilho que refaz o resumo quando alguém muda a planilha (ex.: Status para "Confirmada"). */
function installSummaryTrigger_(ss) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'atualizarResumo') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('atualizarResumo').forSpreadsheet(ss).onEdit().create();
}

/** Reescreve a aba de resumo: matrículas por modalidade e curso, confirmadas e o total. */
function writeSummary_(summary, sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var header = lastRow > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var table = countByCourse(header, rows);
  var total = 0;
  var confirmed = 0;
  table.forEach(function (t) {
    total += t[2];
    confirmed += t[3];
  });

  summary.clear();
  summary.getRange('A1:D1').setValues([['Modalidade', 'Curso', 'Matrículas', 'Confirmadas']]);
  if (table.length) summary.getRange(2, 1, table.length, 4).setValues(table);
  else summary.getRange('A2').setValue('Sem matrículas ainda');
  summary.getRange('F1:G2').setValues([
    ['Total', 'Confirmadas'],
    [total, confirmed],
  ]);
  summary.getRange('A1:G1').setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
  summary.getRange('E1').setBackground(null);
  summary.getRange('F2:G2').setFontSize(18).setFontWeight('bold').setFontColor(PINK);
  summary.setColumnWidth(1, 140);
  summary.setColumnWidth(2, 200);
  summary.setColumnWidth(3, 110);
  summary.setColumnWidth(4, 110);
  summary.setColumnWidth(5, 24);
  summary.setFrozenRows(1);
}

/** Apaga a aba vazia que vem na planilha nova ("Página1" / "Sheet1"), se ela estiver vazia. */
function removeEmptyDefaultSheet_(ss) {
  ss.getSheets().forEach(function (sh) {
    var name = sh.getName();
    if (/^(Página|Sheet|Planilha)\s?1$/.test(name) && sh.getLastRow() === 0)
      ss.deleteSheet(sh);
  });
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
  // Só o cabeçalho fica fixo: no celular, colunas congeladas escondem as do lado.
  sheet.setFrozenColumns(0);
  sheet.setRowHeight(1, 48);
  sheet.setColumnWidths(1, width, 180);
  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 130);
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

  // Status: lista para escolher e cor (verde confirmada, cinza cancelada).
  var is = sheet.getRange(1, 1, 1, width).getValues()[0].indexOf('Status');
  if (is >= 0) {
    var col = sheet.getRange(2, is + 1, sheet.getMaxRows() - 1, 1);
    col.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).build());
    sheet.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Confirmada').setBackground(GREEN).setRanges([col]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Cancelada').setBackground(GRAY).setRanges([col]).build(),
    ]);
  }

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
    countByCourse: countByCourse,
    normText: normText,
    normCpf: normCpf,
    dateKey: dateKey,
    formatKey: formatKey,
    periodStatus: periodStatus,
    readApproved: readApproved,
    findApproved: findApproved,
    columnValue: columnValue,
    courseMatches: courseMatches,
    tooManyRequests: tooManyRequests,
    tooManyFails: tooManyFails,
    registerFail: registerFail,
    FIXED_COLUMNS: FIXED_COLUMNS,
  };
}
