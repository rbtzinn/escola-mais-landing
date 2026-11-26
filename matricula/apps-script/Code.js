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
 *   4. Se tiver, cole os aprovados na aba "Aprovados" (CPF e data de nascimento; modalidade e
 *      curso opcionais) e, se quiser, o período na aba "Config".
 *   5. Implantar > Nova implantação > App da Web: executar como "Eu"; acesso "Qualquer pessoa".
 *
 * Travas: só dentro do período (uma exceção libera um aluno fora dele); envios em rajada são
 * recusados. A lista de aprovados não bloqueia: serve de checklist na coluna "Lista de
 * aprovados" (Sim, Não, Sim com curso diferente ou Sem lista). Se o mesmo CPF enviar de novo,
 * vale o último envio e os anteriores viram "Cancelado".
 * Toda matrícula entra como "Matriculado"; a coordenação pode marcar "Pendente" (com motivo)
 * ou "Cancelado" pelo painel (/admin) ou direto na planilha.
 *
 * Diploma: a secretaria preenche SISTEC, registro, folha e livro na ficha do aluno (painel) e a
 * direção configura o resto na aba "Diploma" do painel (fica guardado na aba "Diploma").
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
  setupDiploma_(made.diploma);
  secret_();
  writeSummary_(made.summary, sheet);
  styleSummary_(made.summary);
  installSummaryTrigger_(sheet.getParent());
  removeEmptyDefaultSheet_(sheet.getParent());

  var aprovados = Math.max(made.approved.getLastRow() - 1, 0);
  Logger.log('Pronto: abas criadas na planilha "' + sheet.getParent().getName() + '".');
  Logger.log(
    aprovados
      ? 'Lista de aprovados: ' + aprovados + ' aluno(s).'
      : 'A aba "' + APPROVED_NAME + '" está vazia: as matrículas entram com "Sem lista" na coluna "' + LIST_COLUMN + '".',
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
var DIPLOMA_NAME = 'Diploma';
var DIPLOMA_COLUMNS = ['Código SISTEC', 'Registro escolar', 'Folha', 'Livro', 'Data de conclusão', 'Semestres e frequências'];
var MAX_DIPLOMA_JSON = 45000; // uma célula guarda até 50 mil caracteres
var EXCEPTION_COLUMNS = ['CPF', 'Data de nascimento', 'Nome', 'Fora do período', 'Válida até', 'Criada por', 'Criada em', 'Usada em'];
var USER_COLUMNS = ['Nome', 'Login', 'Papel', 'Salt', 'Hash', 'Ativo', 'Criado em'];
var ROLES = ['direcao', 'coordenacao'];
var SESSION_HOURS = 8;
var HASH_ROUNDS = 1000;
var MAX_LOGIN_FAILS = 5; // por login, a cada 15 minutos
var LIST_COLUMN = 'Lista de aprovados';
var FIXED_COLUMNS = ['Enviado em', 'Protocolo', 'Status', 'Observação', 'Alterado por', 'Alterado em', 'CPF do aluno', LIST_COLUMN].concat(DIPLOMA_COLUMNS);
var APPROVED_COLUMNS = ['CPF', 'Data de nascimento', 'Nome', 'Modalidade', 'Curso'];
var STATUS = ['Matriculado', 'Pendente', 'Cancelado'];
var TZ = 'America/Recife';
var MAX_COLUMNS = 400;
var MAX_CELL = 1000;

/** Limites contra quem tenta lotar a planilha ou adivinhar dados. */
var MAX_REQUESTS_PER_MINUTE = 60; // todos os alunos juntos

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
function buildRow(header, data, protocolo, enviadoEm, lista) {
  var byName = {};
  for (var i = 0; i < data.columns.length; i++) byName[data.columns[i]] = data.row[i];
  return header.map(function (col) {
    if (col === 'Enviado em') return enviadoEm;
    if (col === 'Protocolo') return protocolo;
    if (col === 'Status') return 'Matriculado';
    if (col === 'CPF do aluno') return onlyDigits(data.cpf);
    if (col === LIST_COLUMN) return lista || '';
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
  var inome = h.indexOf('nome');
  var im = h.indexOf('modalidade');
  var icur = h.indexOf('curso');
  if (ic < 0 || inasc < 0) return [];
  return rows
    .map(function (r) {
      return {
        cpf: normCpf(r[ic]),
        nasc: (toKey || dateKey)(r[inasc]),
        nome: inome >= 0 ? String(r[inome] || '').trim() : '',
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

/**
 * O checklist da coluna "Lista de aprovados": a lista não bloqueia ninguém, só avisa a
 * coordenação. "Sem lista" quando a aba Aprovados está vazia.
 */
function approvalCheck(list, cpf, nascimento, modalidade, curso) {
  if (!list || !list.length) return 'Sem lista';
  var a = findApproved(list, cpf, nascimento);
  if (!a) return 'Não';
  return courseMatches(a, modalidade, curso) ? 'Sim' : 'Sim, curso diferente';
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

/** O que cada papel pode fazer no painel. A coordenação vê, muda status e preenche o diploma. */
var COORD_ACTIONS = ['painel', 'status', 'diploma_aluno'];
var ADMIN_ACTIONS = [
  'painel',
  'status',
  'diploma_aluno',
  'diploma_config',
  'comprovante',
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

/**
 * Dados do diploma de um aluno: SISTEC, registro (número), folha e livro. Erro ou null.
 * `registros` são os registros já usados por outras matrículas, para não repetir.
 */
function diplomaError(data, registros) {
  var sistec = String(data.sistec || '').trim();
  var registro = String(data.registro || '').trim();
  var folha = String(data.folha || '').trim();
  var livro = String(data.livro || '').trim();
  var conclusao = String(data.conclusao || '').trim();
  if (sistec.length > 60 || folha.length > 10 || livro.length > 10) return 'Texto longo demais.';
  if (String(data.modulos || '').length > 300) return 'Texto longo demais.';
  if (conclusao && !dateKey(conclusao)) return 'Data de conclusão inválida.';
  if (registro && !/^\d{1,7}$/.test(registro)) return 'O registro escolar tem que ser um número.';
  if (registro && registros.indexOf(String(Number(registro))) >= 0)
    return 'O registro ' + registro + ' já é de outro aluno.';
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
    // "ping": o site chama ao abrir só para acordar o script; não lê token nem planilha.
    if (data.action === 'ping') return json({ status: 'ok' });
    if (data.action === 'login' || ADMIN_ACTIONS.indexOf(data.action) >= 0) return json(admin_(data));

    var token = PropertiesService.getScriptProperties().getProperty('FORM_TOKEN');
    if (token && data.token !== token) return json({ status: 'erro', message: 'Envio não autorizado.' });
    if (!isValidCpf(data.cpf)) return json({ status: 'erro', message: 'CPF inválido.' });
    if (data.action !== 'check') {
      var invalid = validatePayload(data);
      if (invalid) return json({ status: 'erro', message: invalid });
    }
    // A conferência do começo só lê: não entra na fila das gravações. Os contadores de tentativas
    // (CacheService) podem contar a menos numa corrida, o que é aceitável.
    if (data.action === 'check') return json(check_(data));
    return json(
      withLock_(function () {
        return save_(data);
      }),
    );
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
 * Travas comuns aos dois pedidos: limite de pedidos e período. Uma exceção criada no painel
 * libera o período para um aluno. A lista de aprovados não trava: vira o checklist da planilha.
 */
function gate_(made, cpf, nascimento) {
  var cache = CacheService.getScriptCache();
  if (tooManyRequests(cache, Date.now())) return { result: { status: 'muitas_tentativas' } };

  var today = todayKey_();
  var exc = findException(readExceptionsSheet_(made.exceptions), cpf, nascimento, today);
  if (exc && !exc.periodo) exc = null;

  var period = readPeriod_(made.config);
  if (!exc && periodStatus(today, period.start, period.end) !== 'aberto')
    return { result: { status: 'fora_do_periodo', inicio: formatKey(period.start), fim: formatKey(period.end) } };
  return { exception: exc };
}

function check_(data) {
  var made = ensureSheets_();
  var g = gate_(made, data.cpf, data.nascimento);
  if (g.result) return g.result;
  return { status: 'ok' };
}

function save_(data) {
  var made = ensureSheets_();
  var sheet = made.sheet;
  var nascimento = columnValue(data, 'Data de nascimento');
  var g = gate_(made, data.cpf, nascimento);
  if (g.result) return g.result;
  var lista = approvalCheck(
    readApprovedSheet_(made.approved),
    data.cpf,
    nascimento,
    columnValue(data, 'Modalidade'),
    columnValue(data, 'Curso'),
  );

  var header = ensureHeader_(sheet, data.columns);
  var dataRows = Math.max(sheet.getLastRow() - 1, 0);
  var protocolo = makeProtocol(new Date().getFullYear(), dataRows + 1);
  var enviadoEm = stamp_();
  var row = buildRow(header, data, protocolo, enviadoEm, lista);
  sheet.getRange(dataRows + 2, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  // Mesmo CPF enviou de novo: vale o último envio e os anteriores viram Cancelado.
  cancelPrevious_(sheet, header, data.cpf, dataRows + 2, protocolo);

  if (g.exception) {
    // A exceção vale uma vez só.
    var excHeader = made.exceptions.getRange(1, 1, 1, Math.max(made.exceptions.getLastColumn(), 1)).getValues()[0];
    var usedCol = excHeader.indexOf('Usada em') + 1;
    if (usedCol > 0)
      made.exceptions.getRange(g.exception.linha, usedCol).setNumberFormat('@').setValue(stamp_() + ' · ' + protocolo);
  }
  writeSummary_(made.summary, sheet);
  // Para o comprovante: data e hora do envio e os próximos passos que a escola escreveu.
  return { status: 'ok', protocolo: protocolo, enviadoEm: enviadoEm, proximos: readNextSteps_(made.config) };
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
      'Alterado por': 'Sistema (novo envio)',
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
    var r = runAction_(made, session, data);
    // O painel já volta atualizado: o site não precisa de uma segunda viagem para recarregar.
    if (r && r.status === 'ok') r.painel = painel_(made, session);
    return r;
  });
}

function runAction_(made, session, data) {
  switch (data.action) {
    case 'status':
      return setStatus_(made, session, data);
    case 'diploma_aluno':
      return setDiplomaStudent_(made, session, data);
    case 'diploma_config':
      return setDiplomaConfig_(made, data);
    case 'periodo':
      return setPeriod_(made, data);
    case 'comprovante':
      return setNextSteps_(made, data);
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
    proximos: readNextSteps_(made.config),
    diploma: readDiplomaConfig_(made.diploma),
  };
  if (session.papel === 'direcao') {
    out.aprovados = readApprovedSheet_(made.approved).map(function (a, i) {
      return { cpf: a.cpf, nasc: formatKey(a.nasc), modalidade: a.modalidade, curso: a.curso, nome: a.nome };
    });
    out.excecoes = readExceptionsSheet_(made.exceptions).map(function (e) {
      return {
        linha: e.linha,
        cpf: e.cpf,
        nasc: formatKey(e.nasc),
        nome: e.nome,
        periodo: e.periodo,
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

/** SISTEC, registro, folha, livro, conclusão e frequências de uma matrícula (ficha no painel). */
function setDiplomaStudent_(made, session, data) {
  var sheet = made.sheet;
  var header = ensureHeader_(sheet, []);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { status: 'erro', message: 'Matrícula não encontrada.' };
  var n = lastRow - 1;
  var protocols = sheet.getRange(2, header.indexOf('Protocolo') + 1, n, 1).getDisplayValues();
  var regs = sheet.getRange(2, header.indexOf('Registro escolar') + 1, n, 1).getDisplayValues();
  var line = -1;
  var others = [];
  for (var i = 0; i < n; i++) {
    if (String(protocols[i][0]).trim() === String(data.protocolo)) line = i + 2;
    else if (String(regs[i][0]).trim()) others.push(String(Number(onlyDigits(regs[i][0]))));
  }
  if (line < 0) return { status: 'erro', message: 'Matrícula não encontrada.' };
  var err = diplomaError(data, others);
  if (err) return { status: 'erro', message: err };
  setCells_(sheet, header, line, {
    'Código SISTEC': String(data.sistec || '').trim(),
    'Registro escolar': String(data.registro || '').trim(),
    Folha: String(data.folha || '').trim(),
    Livro: String(data.livro || '').trim(),
    'Data de conclusão': String(data.conclusao || '').trim(),
    'Semestres e frequências': String(data.modulos || '').trim(),
    'Alterado por': session.nome,
    'Alterado em': stamp_(),
  });
  return { status: 'ok' };
}

/** Configuração do diploma (JSON numa célula da aba Diploma). */
function readDiplomaConfig_(sheet) {
  if (sheet.getLastRow() < 2) return null;
  var raw = String(sheet.getRange(2, 1).getValue() || '');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function setDiplomaConfig_(made, data) {
  if (!data.config || typeof data.config !== 'object') return { status: 'erro', message: 'Configuração vazia.' };
  var raw = JSON.stringify(data.config);
  if (raw.length > MAX_DIPLOMA_JSON) return { status: 'erro', message: 'Configuração grande demais.' };
  setupDiploma_(made.diploma);
  made.diploma.getRange(2, 1).setNumberFormat('@').setValue(raw);
  return { status: 'ok' };
}

function setPeriod_(made, data) {
  var start = data.inicio ? dateKey(data.inicio) : '';
  var end = data.fim ? dateKey(data.fim) : '';
  if ((data.inicio && !start) || (data.fim && !end)) return { status: 'erro', message: 'Data inválida.' };
  if (start && end && end < start) return { status: 'erro', message: 'O fim é antes do início.' };
  if (made.config.getLastRow() === 0) setupConfig_(made.config);
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
  if (sheet.getLastRow() === 0) setupApproved_(sheet);
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
  var sheet = made.exceptions;
  // Escreve pelo nome da coluna: planilhas antigas ainda têm "Fora da lista" e "Reenvio".
  var header = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var values = {
    CPF: cpf,
    'Data de nascimento': formatKey(nasc),
    Nome: safeCell(String(data.nome || '').trim().slice(0, 120)),
    'Fora do período': YES,
    'Válida até': formatKey(validade),
    'Criada por': session.nome,
    'Criada em': stamp_(),
  };
  var row = header.map(function (h) {
    return values[h] != null ? values[h] : '';
  });
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
  var ic = header.indexOf('CPF do aluno');
  var is = header.indexOf('Status');
  if (ic < 0) return false;
  // Lê só as duas colunas que importam, não as 100 e tantas da matrícula.
  var n = lastRow - 1;
  var cpfs = sheet.getRange(2, ic + 1, n, 1).getValues();
  var statuses = is >= 0 ? sheet.getRange(2, is + 1, n, 1).getValues() : null;
  var active = [];
  for (var i = 0; i < n; i++) if (!statuses || String(statuses[i][0]).trim() !== 'Cancelado') active.push(cpfs[i][0]);
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
var NEXT_STEPS_LABEL = 'Próximos passos (comprovante)';
var MAX_NEXT_STEPS = 1500;

/** Texto dos próximos passos do comprovante (aba Config). */
function readNextSteps_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return '';
  var rows = sheet.getRange(1, 1, lastRow, 2).getDisplayValues();
  for (var i = 0; i < rows.length; i++)
    if (normText(rows[i][0]) === normText(NEXT_STEPS_LABEL)) return String(rows[i][1] || '');
  return '';
}

function setNextSteps_(made, data) {
  var texto = String(data.texto || '').trim();
  if (texto.length > MAX_NEXT_STEPS) return { status: 'erro', message: 'Texto longo demais.' };
  var sheet = made.config;
  if (sheet.getLastRow() === 0) setupConfig_(sheet);
  var rows = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  var line = -1;
  for (var i = 0; i < rows.length; i++) if (normText(rows[i][0]) === normText(NEXT_STEPS_LABEL)) line = i + 1;
  if (line < 0) {
    line = sheet.getLastRow() + 1;
    sheet.getRange(line, 1).setValue(NEXT_STEPS_LABEL);
  }
  sheet.getRange(line, 2).setNumberFormat('@').setWrap(true).setValue(safeCell(texto));
  return { status: 'ok' };
}

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
/* Cada execução do Apps Script roda o arquivo do zero: estas variáveis valem só para um pedido. */
var ss_ = null;
var made_ = null;

function spreadsheet_() {
  if (ss_) return ss_;
  var id = extractSheetId(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  if (id) ss_ = SpreadsheetApp.openById(id);
  else {
    ss_ = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss_)
      throw new Error(
        'Planilha não encontrada. Em Configurações do projeto > Propriedades do script, crie SHEET_ID com o link da planilha.',
      );
  }
  return ss_;
}

/** As abas do projeto, buscadas numa chamada só (cada getSheetByName é uma ida ao Google). */
function ensureSheets_() {
  if (made_) return made_;
  var ss = spreadsheet_();
  var byName = {};
  ss.getSheets().forEach(function (sh) {
    byName[sh.getName()] = sh;
  });
  var get = function (name, index) {
    if (!byName[name]) byName[name] = index === undefined ? ss.insertSheet(name) : ss.insertSheet(name, index);
    return byName[name];
  };
  var sheet = get(SHEET_NAME, 0);
  var summary = get(SUMMARY_NAME);
  var approved = get(APPROVED_NAME);
  var config = get(CONFIG_NAME);
  var exceptions = get(EXCEPTIONS_NAME);
  var users = get(USERS_NAME);
  var diploma = get(DIPLOMA_NAME);
  if (users.getLastRow() === 0) users.getRange(1, 1, 1, USER_COLUMNS.length).setValues([USER_COLUMNS]);
  if (exceptions.getLastRow() === 0) exceptions.getRange(1, 1, 1, EXCEPTION_COLUMNS.length).setValues([EXCEPTION_COLUMNS]);
  made_ = { sheet: sheet, summary: summary, approved: approved, config: config, exceptions: exceptions, users: users, diploma: diploma };
  return made_;
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
      'Cole aqui os aprovados (opcional). Só CPF e Data de nascimento (dd/mm/aaaa) são obrigatórios. ' +
        'A lista não bloqueia ninguém: cada matrícula ganha "Sim", "Não" ou "Sim, curso diferente" na coluna "Lista de aprovados".',
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

/** Aba "Diploma": a configuração do diploma, salva pelo painel (não edite à mão). */
function setupDiploma_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1).setValue('Configuração do diploma: edite pelo painel /admin, aba Diploma.');
    sheet.getRange(1, 1).setBackground(BLUE).setFontColor(CREAM).setFontWeight('bold');
    sheet.setColumnWidth(1, 600);
  }
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

/**
 * Reescreve os números da aba de resumo. Lê só as colunas Modalidade, Curso e Status (não a
 * matrícula inteira) e não mexe na formatação, que o `setup` aplica uma vez (styleSummary_).
 */
function writeSummary_(summary, sheet) {
  var lastRow = sheet.getLastRow();
  var wanted = ['Modalidade', 'Curso', 'Status'];
  var rows = [];
  if (lastRow > 1) {
    var head = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    var n = lastRow - 1;
    var cols = wanted.map(function (name) {
      var i = head.indexOf(name);
      return i >= 0 ? sheet.getRange(2, i + 1, n, 1).getValues() : null;
    });
    for (var r = 0; r < n; r++)
      rows.push(
        cols.map(function (c) {
          return c ? c[r][0] : '';
        }),
      );
  }
  var table = countByCourse(wanted, rows);
  var total = 0;
  var pending = 0;
  table.forEach(function (t) {
    total += t[2];
    pending += t[3];
  });

  summary.clearContents();
  summary.getRange('A1:D1').setValues([['Modalidade', 'Curso', 'Matrículas', 'Pendentes']]);
  if (table.length) summary.getRange(2, 1, table.length, 4).setValues(table);
  else summary.getRange('A2').setValue('Sem matrículas ainda');
  summary.getRange('F1:G2').setValues([
    ['Total', 'Pendentes'],
    [total, pending],
  ]);
}

/** Formatação da aba de resumo (uma vez, no setup). */
function styleSummary_(summary) {
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
  // Lista de aprovados: amarelo quando não está na lista ou o curso é outro.
  var head = sheet.getRange(1, 1, 1, width).getValues()[0];
  var rules = [];
  var is = head.indexOf('Status');
  if (is >= 0) {
    var col = sheet.getRange(2, is + 1, sheet.getMaxRows() - 1, 1);
    col.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pendente').setBackground(YELLOW).setRanges([col]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Cancelado').setBackground(GRAY).setRanges([col]).build());
  }
  var il = head.indexOf(LIST_COLUMN);
  if (il >= 0) {
    var lcol = sheet.getRange(2, il + 1, sheet.getMaxRows() - 1, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Não').setBackground(YELLOW).setRanges([lcol]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Sim, curso diferente').setBackground(YELLOW).setRanges([lcol]).build());
  }
  sheet.setConditionalFormatRules(rules);

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
    approvalCheck: approvalCheck,
    tooManyRequests: tooManyRequests,
    readExceptions: readExceptions,
    findException: findException,
    validLogin: validLogin,
    hashPassword: hashPassword,
    sameText: sameText,
    signToken: signToken,
    verifyToken: verifyToken,
    canDo: canDo,
    statusError: statusError,
    diplomaError: diplomaError,
    checkApprovedLines: checkApprovedLines,
    STATUS: STATUS,
    FIXED_COLUMNS: FIXED_COLUMNS,
  };
}
