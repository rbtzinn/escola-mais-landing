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
 * Toda matrícula entra como "Matriculado"; a coordenação pode marcar "Pendente" (com motivo)
 * ou "Cancelado" pelo painel (/admin) ou direto na planilha.
 *
 * Painel: crie a propriedade ADMIN_SENHA. O 1º acesso em /admin é com o login "admin" e essa
 * senha; depois a direção cria os usuários no próprio painel.
 *
 * As funções puras (sem SpreadsheetApp) ficam no topo e são testadas no projeto com Vitest.
 */

/* ---------- Comece por aqui: escolha `setup` ao lado de Executar ---------- */

/**
 * Rode uma vez (e de novo sempre que atualizar este código): cria as abas "Matrículas",
 * "Resumo por curso", "Aprovados", "Config", "Exceções" e "Usuários" (escondida), já
 * formatadas, sem apagar o que já existe.
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
  setupExceptions_(made.exceptions);
  setupUsers_(made.users);
  secret_();
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
  Logger.log(
    props_().getProperty('ADMIN_SENHA')
      ? 'Painel: entre em /admin com o login "admin" e a senha ADMIN_SENHA.'
      : 'ATENÇÃO: crie a propriedade ADMIN_SENHA para entrar no painel /admin.',
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
var EXCEPTIONS_NAME = 'Exceções';
var USERS_NAME = 'Usuários';
var EXCEPTION_COLUMNS = ['CPF', 'Data de nascimento', 'Nome', 'Fora do período', 'Fora da lista', 'Reenvio', 'Válida até', 'Criada por', 'Criada em', 'Usada em'];
var USER_COLUMNS = ['Nome', 'Login', 'Papel', 'Salt', 'Hash', 'Ativo', 'Criado em'];
var ROLES = ['direcao', 'coordenacao'];
var SESSION_HOURS = 8;
var HASH_ROUNDS = 1000;
var MAX_LOGIN_FAILS = 5; // por login, a cada 15 minutos
var FIXED_COLUMNS = ['Enviado em', 'Protocolo', 'Status', 'Observação', 'Alterado por', 'Alterado em', 'CPF do aluno'];
var APPROVED_COLUMNS = ['CPF', 'Data de nascimento', 'Nome', 'Modalidade', 'Curso'];
var STATUS = ['Matriculado', 'Pendente', 'Cancelado'];
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
var YELLOW = '#fde9a8';
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
    if (col === 'Status') return 'Matriculado';
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
 * [modalidade, curso, matrículas, pendentes]. Matrícula cancelada não conta.
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
    if (!curso || status === 'Cancelado') return;
    var mod = im >= 0 ? String(r[im] || '').trim() : '';
    var key = mod + '\u0000' + curso;
    if (!(key in counts)) {
      counts[key] = [0, 0];
      order.push(key);
    }
    counts[key][0]++;
    if (status === 'Pendente') counts[key][1]++;
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

/* ---------- Exceções, usuários e sessão (funções puras) ---------- */

var YES = 'Sim';

/**
 * Linhas da aba Exceções viram objetos. `linha` é o número da linha na planilha (2 = primeira),
 * para o painel conseguir remover.
 */
function readExceptions(header, rows, toKey) {
  var h = header.map(normText);
  var col = function (name) {
    return h.indexOf(normText(name));
  };
  var key = toKey || dateKey;
  var yes = function (v) {
    return normText(v) === 'sim';
  };
  return rows
    .map(function (r, i) {
      return {
        linha: i + 2,
        cpf: normCpf(r[col('CPF')]),
        nasc: key(r[col('Data de nascimento')]),
        nome: String(r[col('Nome')] || '').trim(),
        periodo: yes(r[col('Fora do período')]),
        lista: yes(r[col('Fora da lista')]),
        reenvio: yes(r[col('Reenvio')]),
        validade: key(r[col('Válida até')]),
        criadaPor: String(r[col('Criada por')] || '').trim(),
        criadaEm: String(r[col('Criada em')] || '').trim(),
        usadaEm: String(r[col('Usada em')] || '').trim(),
      };
    })
    .filter(function (e) {
      return e.cpf.length === 11;
    });
}

/** Exceção que vale agora para esse aluno: CPF e nascimento batem, não foi usada e está no prazo. */
function findException(list, cpf, nascimento, todayKey) {
  var c = normCpf(cpf);
  var n = dateKey(nascimento);
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    if (e.cpf === c && e.nasc === n && !e.usadaEm && (!e.validade || e.validade >= todayKey)) return e;
  }
  return null;
}

/** Login aceito: minúsculas, números, ponto, hífen e sublinhado (3 a 30). */
function validLogin(s) {
  return /^[a-z0-9._-]{3,30}$/.test(String(s || ''));
}

/** Senha embaralhada: o mesmo texto e o mesmo salt dão o mesmo resultado; o contrário é impossível. */
function hashPassword(senha, salt, digestFn) {
  var h = '';
  for (var i = 0; i < HASH_ROUNDS; i++) h = digestFn(salt + '|' + h + '|' + senha);
  return h;
}

/** Comparação que não para no primeiro caractere diferente. */
function sameText(a, b) {
  a = String(a);
  b = String(b);
  var diff = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Sessão: "login|papel|expira|assinatura". A assinatura impede trocar o papel ou o prazo. */
function signToken(login, papel, expMs, secret, hmacFn) {
  var body = login + '|' + papel + '|' + expMs;
  return body + '|' + hmacFn(body, secret);
}

/** Dados da sessão, ou null se a assinatura não bate ou se venceu. */
function verifyToken(token, secret, hmacFn, nowMs) {
  var parts = String(token || '').split('|');
  if (parts.length !== 4) return null;
  var body = parts.slice(0, 3).join('|');
  if (!sameText(hmacFn(body, secret), parts[3])) return null;
  var exp = Number(parts[2]);
  if (!(exp > nowMs)) return null;
  if (ROLES.indexOf(parts[1]) < 0) return null;
  return { login: parts[0], papel: parts[1], exp: exp };
}

/** O que cada papel pode fazer no painel. A coordenação só vê e muda status. */
var COORD_ACTIONS = ['painel', 'status'];
var ADMIN_ACTIONS = [
  'painel',
  'status',
  'periodo',
  'aprovados_add',
  'aprovados_remover',
  'excecao_add',
  'excecao_remover',
  'usuario_add',
  'usuario_senha',
  'usuario_ativo',
];
function canDo(papel, action) {
  if (papel === 'direcao') return ADMIN_ACTIONS.indexOf(action) >= 0;
  if (papel === 'coordenacao') return COORD_ACTIONS.indexOf(action) >= 0;
  return false;
}

/** Erro na mudança de status, ou null. Pendente precisa de motivo. */
function statusError(status, observacao) {
  if (STATUS.indexOf(status) < 0) return 'Status inválido.';
  if (status === 'Pendente' && !String(observacao || '').trim()) return 'Escreva o motivo da pendência.';
  if (String(observacao || '').length > 500) return 'Motivo muito longo.';
  return null;
}

/** Linhas coladas no painel: {cpf, nasc, nome, modalidade, curso}. Devolve as boas e as recusadas. */
function checkApprovedLines(lines) {
  var ok = [];
  var bad = [];
  (lines || []).forEach(function (l, i) {
    var cpf = normCpf(l && l.cpf);
    var nasc = dateKey(l && l.nasc);
    if (!isValidCpf(cpf)) bad.push({ linha: i + 1, motivo: 'CPF inválido' });
    else if (!nasc) bad.push({ linha: i + 1, motivo: 'Data de nascimento inválida' });
    else
      ok.push({
        cpf: cpf,
        nasc: formatKey(nasc),
        nome: String(l.nome || '').trim().slice(0, 120),
        modalidade: String(l.modalidade || '').trim().slice(0, 40),
        curso: String(l.curso || '').trim().slice(0, 80),
      });
  });
  return { ok: ok, bad: bad };
}

/* ---------- Planilha ---------- */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Pedidos que chegam aqui:
 *  - do formulário: action "check" (confere CPF e nascimento no começo) ou sem action (o envio);
 *  - do painel (/admin): "login" e as ações de ADMIN_ACTIONS, sempre com a sessão.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== 'object') return json({ status: 'erro', message: 'Envio vazio.' });
    if (data.action === 'login' || ADMIN_ACTIONS.indexOf(data.action) >= 0) return json(admin_(data));

    var token = PropertiesService.getScriptProperties().getProperty('FORM_TOKEN');
    if (token && data.token !== token) return json({ status: 'erro', message: 'Envio não autorizado.' });
    if (!isValidCpf(data.cpf)) return json({ status: 'erro', message: 'CPF inválido.' });
    if (data.action !== 'check') {
      var invalid = validatePayload(data);
      if (invalid) return json({ status: 'erro', message: invalid });
    }
    return json(withLock_(function () {
      return data.action === 'check' ? check_(data) : save_(data);
    }));
  } catch (err) {
    return json({ status: 'erro', message: 'Falha ao gravar na planilha.' });
  }
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function todayKey_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
}

function stamp_() {
  return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm');
}

/**
 * Travas comuns aos dois pedidos: limite, período, lista e CPF já matriculado.
 * Uma exceção criada no painel pode liberar o período, a lista e/ou o reenvio.
 */
function gate_(made, cpf, nascimento) {
  var cache = CacheService.getScriptCache();
  if (tooManyRequests(cache, Date.now()) || tooManyFails(cache, cpf)) return { result: { status: 'muitas_tentativas' } };

  var today = todayKey_();
  var exc = findException(readExceptionsSheet_(made.exceptions), cpf, nascimento, today);

  var period = readPeriod_(made.config);
  if (!(exc && exc.periodo) && periodStatus(today, period.start, period.end) !== 'aberto')
    return { result: { status: 'fora_do_periodo', inicio: formatKey(period.start), fim: formatKey(period.end) } };

  var approved = findApproved(readApprovedSheet_(made.approved), cpf, nascimento);
  if (!approved && exc && exc.lista) approved = { cpf: normCpf(cpf), nasc: dateKey(nascimento), modalidade: '', curso: '' };
  if (!approved) {
    registerFail(cache, cpf);
    return { result: { status: 'nao_encontrado' } };
  }
  if (!(exc && exc.reenvio) && findActiveCpf_(made.sheet, cpf)) return { result: { status: 'cpf_duplicado' } };
  return { approved: approved, exception: exc };
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

  var header = ensureHeader_(sheet, data.columns);
  var dataRows = Math.max(sheet.getLastRow() - 1, 0);
  var protocolo = makeProtocol(new Date().getFullYear(), dataRows + 1);
  var row = buildRow(header, data, protocolo, stamp_());
  sheet.getRange(dataRows + 2, 1, 1, row.length).setNumberFormat('@').setValues([row]);

  if (g.exception) {
    // Reenvio: as matrículas anteriores desse CPF viram Cancelado. A exceção vale uma vez só.
    if (g.exception.reenvio) cancelPrevious_(sheet, header, data.cpf, dataRows + 2, protocolo);
    var usedCol = EXCEPTION_COLUMNS.indexOf('Usada em') + 1;
    made.exceptions.getRange(g.exception.linha, usedCol).setNumberFormat('@').setValue(stamp_() + ' · ' + protocolo);
  }
  writeSummary_(made.summary, sheet);
  return { status: 'ok', protocolo: protocolo };
}

/** Cabeçalho com as colunas fixas e as novas do formulário; reescreve e formata se mudou. */
function ensureHeader_(sheet, columns) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var current = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  current = current.filter(function (c) {
    return c !== '';
  });
  var header = mergeHeader(current, columns || []);
  if (header.length !== current.length) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    styleHeader_(sheet, header.length);
  }
  return header;
}

function cancelPrevious_(sheet, header, cpf, newRow, protocolo) {
  var ic = header.indexOf('CPF do aluno');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var rows = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
  rows.forEach(function (r, i) {
    var line = i + 2;
    if (line === newRow || normCpf(r[ic]) !== normCpf(cpf)) return;
    if (String(r[header.indexOf('Status')]).trim() === 'Cancelado') return;
    setCells_(sheet, header, line, {
      Status: 'Cancelado',
      'Observação': 'Substituída por ' + protocolo,
      'Alterado por': 'Sistema (reenvio)',
      'Alterado em': stamp_(),
    });
  });
}

function setCells_(sheet, header, line, values) {
  Object.keys(values).forEach(function (k) {
    var c = header.indexOf(k);
    if (c >= 0) sheet.getRange(line, c + 1).setNumberFormat('@').setValue(safeCell(values[k]));
  });
}

/* ---------- Painel (/admin) ---------- */

function props_() {
  return PropertiesService.getScriptProperties();
}

/** Segredo que assina as sessões; criado na primeira vez. */
function secret_() {
  var p = props_();
  var s = p.getProperty('ADMIN_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    p.setProperty('ADMIN_SECRET', s);
  }
  return s;
}

function toHex_(bytes) {
  return bytes
    .map(function (b) {
      return ('0' + (b & 0xff).toString(16)).slice(-2);
    })
    .join('');
}

function hmacHex_(msg, secret) {
  return toHex_(Utilities.computeHmacSha256Signature(msg, secret));
}

function digestHex_(s) {
  return toHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}

function admin_(data) {
  if (data.action === 'login') return withLock_(function () {
    return login_(data);
  });
  var session = verifyToken(data.sessao, secret_(), hmacHex_, Date.now());
  if (!session) return { status: 'sessao_expirada' };
  var made = ensureSheets_();
  var user = findUser_(made.users, session.login);
  if (session.login !== 'admin' && (!user || !user.ativo)) return { status: 'sessao_expirada' };
  if (!canDo(session.papel, data.action)) return { status: 'sem_permissao' };
  session.nome = session.login === 'admin' ? 'Direção' : user.nome;

  if (data.action === 'painel') return painel_(made, session);
  return withLock_(function () {
    switch (data.action) {
      case 'status':
        return setStatus_(made, session, data);
      case 'periodo':
        return setPeriod_(made, data);
      case 'aprovados_add':
        return addApproved_(made, data);
      case 'aprovados_remover':
        return removeApproved_(made, data);
      case 'excecao_add':
        return addException_(made, session, data);
      case 'excecao_remover':
        return removeException_(made, data);
      case 'usuario_add':
        return addUser_(made, data);
      case 'usuario_senha':
        return setPassword_(made, data);
      case 'usuario_ativo':
        return setActive_(made, data);
    }
    return { status: 'erro', message: 'Ação desconhecida.' };
  });
}

function login_(data) {
  var login = String(data.login || '').trim().toLowerCase();
  var senha = String(data.senha || '');
  var cache = CacheService.getScriptCache();
  var failKey = 'login:' + login;
  if (Number(cache.get(failKey) || 0) >= MAX_LOGIN_FAILS) return { status: 'muitas_tentativas' };

  var made = ensureSheets_();
  var ok = null;
  var master = props_().getProperty('ADMIN_SENHA');
  if (login === 'admin' && master && sameText(senha, master)) ok = { login: 'admin', papel: 'direcao', nome: 'Direção' };
  else {
    var u = findUser_(made.users, login);
    if (u && u.ativo && sameText(hashPassword(senha, u.salt, digestHex_), u.hash)) ok = u;
  }
  if (!ok) {
    bump(cache, failKey, 900);
    return { status: 'login_invalido' };
  }
  var exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return { status: 'ok', sessao: signToken(ok.login, ok.papel, exp, secret_(), hmacHex_), nome: ok.nome, papel: ok.papel, exp: exp };
}

/** Tudo o que o painel mostra, de uma vez (textos como aparecem na planilha). */
function painel_(made, session) {
  var sheet = made.sheet;
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var values = lastRow > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues() : [[]];
  var period = readPeriod_(made.config);
  var out = {
    status: 'ok',
    usuario: { nome: session.nome, papel: session.papel },
    hoje: formatKey(todayKey_()),
    cabecalho: values[0],
    linhas: values.slice(1),
    periodo: { inicio: formatKey(period.start), fim: formatKey(period.end) },
  };
  if (session.papel === 'direcao') {
    out.aprovados = readApprovedSheet_(made.approved).map(function (a, i) {
      return { cpf: a.cpf, nasc: formatKey(a.nasc), modalidade: a.modalidade, curso: a.curso, nome: approvedNames_(made.approved)[a.cpf] || '' };
    });
    out.excecoes = readExceptionsSheet_(made.exceptions).map(function (e) {
      return {
        linha: e.linha,
        cpf: e.cpf,
        nasc: formatKey(e.nasc),
        nome: e.nome,
        periodo: e.periodo,
        lista: e.lista,
        reenvio: e.reenvio,
        validade: formatKey(e.validade),
        criadaPor: e.criadaPor,
        criadaEm: e.criadaEm,
        usadaEm: e.usadaEm,
      };
    });
    out.usuarios = readUsers_(made.users).map(function (u) {
      return { nome: u.nome, login: u.login, papel: u.papel, ativo: u.ativo };
    });
  }
  return out;
}

var approvedNamesCache_ = null;
function approvedNames_(sheet) {
  if (approvedNamesCache_) return approvedNamesCache_;
  var map = {};
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var values = sheet.getRange(1, 1, lastRow, Math.max(sheet.getLastColumn(), 1)).getDisplayValues();
    var h = values[0].map(normText);
    var ic = h.indexOf('cpf');
    var inome = h.indexOf('nome');
    if (ic >= 0 && inome >= 0)
      values.slice(1).forEach(function (r) {
        map[normCpf(r[ic])] = String(r[inome] || '').trim();
      });
  }
  approvedNamesCache_ = map;
  return map;
}

function setStatus_(made, session, data) {
  var err = statusError(data.status, data.observacao);
  if (err) return { status: 'erro', message: err };
  var sheet = made.sheet;
  var header = ensureHeader_(sheet, []);
  var ip = header.indexOf('Protocolo');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { status: 'erro', message: 'Matrícula não encontrada.' };
  var protocols = sheet.getRange(2, ip + 1, lastRow - 1, 1).getDisplayValues();
  for (var i = 0; i < protocols.length; i++) {
    if (String(protocols[i][0]).trim() !== String(data.protocolo)) continue;
    var line = i + 2;
    if (data.status === 'Matriculado' || data.status === 'Pendente') {
      // Reativar: não pode haver outra matrícula ativa com o mesmo CPF.
      var cpf = sheet.getRange(line, header.indexOf('CPF do aluno') + 1).getDisplayValue();
      var current = sheet.getRange(line, header.indexOf('Status') + 1).getDisplayValue();
      if (current === 'Cancelado' && findActiveCpf_(sheet, cpf))
        return { status: 'erro', message: 'Esse CPF já tem outra matrícula ativa.' };
    }
    setCells_(sheet, header, line, {
      Status: data.status,
      'Observação': String(data.observacao || '').trim(),
      'Alterado por': session.nome,
      'Alterado em': stamp_(),
    });
    writeSummary_(made.summary, sheet);
    return { status: 'ok' };
  }
  return { status: 'erro', message: 'Matrícula não encontrada.' };
}

function setPeriod_(made, data) {
  var start = data.inicio ? dateKey(data.inicio) : '';
  var end = data.fim ? dateKey(data.fim) : '';
  if ((data.inicio && !start) || (data.fim && !end)) return { status: 'erro', message: 'Data inválida.' };
  if (start && end && end < start) return { status: 'erro', message: 'O fim é antes do início.' };
  setupConfig_(made.config);
  var rows = made.config.getRange(1, 1, made.config.getLastRow(), 1).getValues();
  rows.forEach(function (r, i) {
    var label = normText(r[0]);
    if (label === 'inicio da matricula') made.config.getRange(i + 1, 2).setValue(formatKey(start));
    if (label === 'fim da matricula') made.config.getRange(i + 1, 2).setValue(formatKey(end));
  });
  return { status: 'ok' };
}

/** Acrescenta aprovados. CPF que já está na lista tem a linha atualizada. */
function addApproved_(made, data) {
  var checked = checkApprovedLines(data.linhas);
  var sheet = made.approved;
  setupApproved_(sheet);
  var width = Math.max(sheet.getLastColumn(), APPROVED_COLUMNS.length);
  var header = sheet.getRange(1, 1, 1, width).getValues()[0].map(normText);
  var col = function (n) {
    return header.indexOf(normText(n));
  };
  var lastRow = sheet.getLastRow();
  var existing = lastRow >= 2 ? sheet.getRange(2, col('CPF') + 1, lastRow - 1, 1).getDisplayValues().map(function (r) {
    return normCpf(r[0]);
  }) : [];
  var added = 0;
  var updated = 0;
  checked.ok.forEach(function (a) {
    var row = new Array(width).fill('');
    row[col('CPF')] = a.cpf;
    row[col('Data de nascimento')] = a.nasc;
    if (col('Nome') >= 0) row[col('Nome')] = safeCell(a.nome);
    if (col('Modalidade') >= 0) row[col('Modalidade')] = safeCell(a.modalidade);
    if (col('Curso') >= 0) row[col('Curso')] = safeCell(a.curso);
    var at = existing.indexOf(a.cpf);
    if (at >= 0) {
      sheet.getRange(at + 2, 1, 1, width).setNumberFormat('@').setValues([row]);
      updated++;
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, width).setNumberFormat('@').setValues([row]);
      existing.push(a.cpf);
      added++;
    }
  });
  return { status: 'ok', adicionados: added, atualizados: updated, recusadas: checked.bad };
}

function removeApproved_(made, data) {
  var sheet = made.approved;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { status: 'ok', removidos: 0 };
  var header = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(normText);
  var ic = header.indexOf('cpf');
  var cpfs = sheet.getRange(2, ic + 1, lastRow - 1, 1).getDisplayValues();
  var removed = 0;
  for (var i = cpfs.length - 1; i >= 0; i--) {
    if (normCpf(cpfs[i][0]) === normCpf(data.cpf)) {
      sheet.deleteRow(i + 2);
      removed++;
    }
  }
  return { status: 'ok', removidos: removed };
}

function addException_(made, session, data) {
  var cpf = normCpf(data.cpf);
  var nasc = dateKey(data.nascimento);
  var validade = dateKey(data.validade);
  if (!isValidCpf(cpf)) return { status: 'erro', message: 'CPF inválido.' };
  if (!nasc) return { status: 'erro', message: 'Data de nascimento inválida.' };
  if (!validade || validade < todayKey_()) return { status: 'erro', message: 'O prazo tem que ser hoje ou depois.' };
  if (!data.periodo && !data.lista && !data.reenvio) return { status: 'erro', message: 'Escolha o que a exceção libera.' };
  var sheet = made.exceptions;
  setupExceptions_(sheet);
  var yes = function (v) {
    return v ? YES : '';
  };
  var row = [cpf, formatKey(nasc), safeCell(String(data.nome || '').trim().slice(0, 120)), yes(data.periodo), yes(data.lista), yes(data.reenvio), formatKey(validade), session.nome, stamp_(), ''];
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  return { status: 'ok' };
}

function removeException_(made, data) {
  var sheet = made.exceptions;
  var line = Number(data.linha);
  if (!(line >= 2 && line <= sheet.getLastRow())) return { status: 'erro', message: 'Exceção não encontrada.' };
  // Confere o CPF para não apagar outra linha se a planilha mudou desde que o painel carregou.
  if (normCpf(sheet.getRange(line, 1).getDisplayValue()) !== normCpf(data.cpf))
    return { status: 'erro', message: 'A lista mudou. Recarregue o painel.' };
  sheet.deleteRow(line);
  return { status: 'ok' };
}

function readUsers_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(1, 1, lastRow, USER_COLUMNS.length).getDisplayValues();
  return values.slice(1).map(function (r, i) {
    return {
      linha: i + 2,
      nome: r[0],
      login: String(r[1]).trim().toLowerCase(),
      papel: r[2],
      salt: r[3],
      hash: r[4],
      ativo: normText(r[5]) === 'sim',
    };
  });
}

function findUser_(sheet, login) {
  var users = readUsers_(sheet);
  for (var i = 0; i < users.length; i++) if (users[i].login === login) return users[i];
  return null;
}

function addUser_(made, data) {
  var login = String(data.login || '').trim().toLowerCase();
  var nome = String(data.nome || '').trim().slice(0, 80);
  if (!nome) return { status: 'erro', message: 'Escreva o nome.' };
  if (!validLogin(login) || login === 'admin') return { status: 'erro', message: 'Login inválido: use letras minúsculas, números e ponto (3 a 30).' };
  if (ROLES.indexOf(data.papel) < 0) return { status: 'erro', message: 'Papel inválido.' };
  if (String(data.senha || '').length < 8) return { status: 'erro', message: 'A senha precisa de pelo menos 8 caracteres.' };
  if (findUser_(made.users, login)) return { status: 'erro', message: 'Esse login já existe.' };
  var salt = Utilities.getUuid();
  var row = [safeCell(nome), login, data.papel, salt, hashPassword(String(data.senha), salt, digestHex_), YES, stamp_()];
  made.users.getRange(made.users.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  return { status: 'ok' };
}

function setPassword_(made, data) {
  var u = findUser_(made.users, String(data.login || '').toLowerCase());
  if (!u) return { status: 'erro', message: 'Usuário não encontrado.' };
  if (String(data.senha || '').length < 8) return { status: 'erro', message: 'A senha precisa de pelo menos 8 caracteres.' };
  var salt = Utilities.getUuid();
  made.users.getRange(u.linha, 4, 1, 2).setValues([[salt, hashPassword(String(data.senha), salt, digestHex_)]]);
  return { status: 'ok' };
}

function setActive_(made, data) {
  var u = findUser_(made.users, String(data.login || '').toLowerCase());
  if (!u) return { status: 'erro', message: 'Usuário não encontrado.' };
  made.users.getRange(u.linha, 6).setValue(data.ativo ? YES : 'Não');
  return { status: 'ok' };
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
      return is < 0 || String(r[is]).trim() !== 'Cancelado';
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
  var exceptions = ss.getSheetByName(EXCEPTIONS_NAME) || ss.insertSheet(EXCEPTIONS_NAME);
  var users = ss.getSheetByName(USERS_NAME) || ss.insertSheet(USERS_NAME);
  if (users.getLastRow() === 0) users.getRange(1, 1, 1, USER_COLUMNS.length).setValues([USER_COLUMNS]);
  if (exceptions.getLastRow() === 0) exceptions.getRange(1, 1, 1, EXCEPTION_COLUMNS.length).setValues([EXCEPTION_COLUMNS]);
  return { sheet: sheet, summary: summary, approved: approved, config: config, exceptions: exceptions, users: users };
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

function readExceptionsSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(1, 1, lastRow, Math.max(sheet.getLastColumn(), 1)).getValues();
  return readExceptions(values[0], values.slice(1), cellDateKey_);
}

/** Aba "Exceções": criada pelo painel; dá para ver e apagar linhas na planilha também. */
function setupExceptions_(sheet) {
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, EXCEPTION_COLUMNS.length).setValues([EXCEPTION_COLUMNS]);
  sheet.getRange(1, 1, sheet.getMaxRows(), EXCEPTION_COLUMNS.length).setNumberFormat('@');
  sheet.getRange(1, 1, 1, EXCEPTION_COLUMNS.length).setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, EXCEPTION_COLUMNS.length, 130);
}

/** Aba "Usuários": escondida e protegida. As senhas ficam embaralhadas (não dá para ler). */
function setupUsers_(sheet) {
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, USER_COLUMNS.length).setValues([USER_COLUMNS]);
  sheet.getRange(1, 1, sheet.getMaxRows(), USER_COLUMNS.length).setNumberFormat('@');
  sheet.getRange(1, 1, 1, USER_COLUMNS.length).setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.hideSheet();
  var protection = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0] || sheet.protect();
  protection.setDescription('Usuários do painel: mexa pelo painel /admin.');
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
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

/** Gatilho que refaz o resumo quando alguém muda a planilha (ex.: Status para "Pendente"). */
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
  var pending = 0;
  table.forEach(function (t) {
    total += t[2];
    pending += t[3];
  });

  summary.clear();
  summary.getRange('A1:D1').setValues([['Modalidade', 'Curso', 'Matrículas', 'Pendentes']]);
  if (table.length) summary.getRange(2, 1, table.length, 4).setValues(table);
  else summary.getRange('A2').setValue('Sem matrículas ainda');
  summary.getRange('F1:G2').setValues([
    ['Total', 'Pendentes'],
    [total, pending],
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

  // Status: lista para escolher e cor (amarelo pendente, cinza cancelado).
  var is = sheet.getRange(1, 1, 1, width).getValues()[0].indexOf('Status');
  if (is >= 0) {
    var col = sheet.getRange(2, is + 1, sheet.getMaxRows() - 1, 1);
    col.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).build());
    sheet.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pendente').setBackground(YELLOW).setRanges([col]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Cancelado').setBackground(GRAY).setRanges([col]).build(),
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
    readExceptions: readExceptions,
    findException: findException,
    validLogin: validLogin,
    hashPassword: hashPassword,
    sameText: sameText,
    signToken: signToken,
    verifyToken: verifyToken,
    canDo: canDo,
    statusError: statusError,
    checkApprovedLines: checkApprovedLines,
    STATUS: STATUS,
    FIXED_COLUMNS: FIXED_COLUMNS,
  };
}
