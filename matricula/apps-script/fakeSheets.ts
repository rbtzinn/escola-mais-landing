import { createHash, createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Planilha e serviços do Google falsos, em memória, para rodar o Code.js de ponta a ponta nos
 * testes. Contam as leituras (quantas chamadas e quantas células) para provar que o script não lê
 * mais do que precisa. Formatação (cores, filtro, proteção) não faz nada aqui.
 */

type Cell = string | number;

/** Objeto que aceita qualquer chamada em cadeia (`a.b().c()`), para a formatação. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chain = (): any =>
  new Proxy(function () {}, {
    get: (_t, p) => (p === 'then' || p === Symbol.toPrimitive ? undefined : chain()),
    apply: () => chain(),
  });

const colNumber = (letters: string) =>
  [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

export class FakeSheet {
  grid: Cell[][] = [];
  stats = { calls: 0, cellsRead: 0, clear: 0, clearContents: 0 };
  constructor(
    public name: string,
    rows: Cell[][] = [],
  ) {
    this.grid = rows.map((r) => [...r]);
  }
  getName() {
    return this.name;
  }
  getLastRow() {
    for (let i = this.grid.length - 1; i >= 0; i--)
      if (this.grid[i].some((c) => c !== '' && c != null)) return i + 1;
    return 0;
  }
  getLastColumn() {
    let max = 0;
    for (const r of this.grid)
      for (let c = r.length - 1; c >= 0; c--)
        if (r[c] !== '' && r[c] != null) max = Math.max(max, c + 1);
    return max;
  }
  getMaxRows() {
    return 1000;
  }
  at(r: number, c: number): Cell {
    return this.grid[r - 1]?.[c - 1] ?? '';
  }
  put(r: number, c: number, v: Cell) {
    while (this.grid.length < r) this.grid.push([]);
    const row = this.grid[r - 1];
    while (row.length < c) row.push('');
    row[c - 1] = v;
  }
  getRange(a: number | string, b?: number, nr = 1, nc = 1) {
    if (typeof a === 'string') {
      const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(a)!;
      const c1 = colNumber(m[1]);
      const r1 = Number(m[2]);
      return makeRange(
        this,
        r1,
        c1,
        m[4] ? Number(m[4]) - r1 + 1 : 1,
        m[3] ? colNumber(m[3]) - c1 + 1 : 1,
      );
    }
    return makeRange(this, a, b!, nr, nc);
  }
  deleteRow(n: number) {
    this.grid.splice(n - 1, 1);
  }
  clear() {
    this.stats.clear++;
    this.grid = [];
  }
  clearContents() {
    this.stats.clearContents++;
    this.grid = [];
  }
  getBandings() {
    return [];
  }
  getProtections() {
    return [];
  }
  getFilter() {
    return null;
  }
  protect() {
    return chain();
  }
  hideSheet() {}
  setFrozenRows() {}
  setFrozenColumns() {}
  setColumnWidth() {}
  setColumnWidths() {}
  setRowHeight() {}
  setConditionalFormatRules() {}
}

function makeRange(sheet: FakeSheet, r: number, c: number, nr: number, nc: number) {
  const read = () => {
    sheet.stats.calls++;
    sheet.stats.cellsRead += nr * nc;
    return Array.from({ length: nr }, (_, i) =>
      Array.from({ length: nc }, (_, j) => sheet.at(r + i, c + j)),
    );
  };
  const api = {
    getValues: read,
    getDisplayValues: () => read().map((row) => row.map(String)),
    getValue: () => read()[0][0],
    getDisplayValue: () => String(read()[0][0]),
    setValues(v: Cell[][]) {
      v.forEach((row, i) => row.forEach((x, j) => sheet.put(r + i, c + j, x)));
      return proxy;
    },
    setValue(v: Cell) {
      sheet.put(r, c, v);
      return proxy;
    },
  };
  // Qualquer outro método (formatação) devolve o próprio intervalo, para encadear.
  const proxy: typeof api & Record<string, unknown> = new Proxy(api, {
    get: (t, p) => (p in t ? t[p as keyof typeof t] : () => proxy),
  }) as never;
  return proxy;
}

export interface Env {
  ss: { sheets: FakeSheet[] };
  sheet: (name: string) => FakeSheet;
  props: Map<string, string>;
  stats: { locks: number; getSheets: number };
  doPost: (body: object) => Record<string, unknown>;
  setup: () => void;
}

export interface Seed {
  matriculas?: Cell[][];
  aprovados?: Cell[][];
  props?: Record<string, string>;
  /** Outro arquivo do script (para comparar versões). Padrão: o Code.js atual. */
  codeFile?: string;
}

/** Carrega o Code.js do zero (como o Google faz a cada pedido) com os serviços falsos. */
export function loadScript(seed: Seed = {}): Env {
  const stats = { locks: 0, getSheets: 0 };
  const sheets: FakeSheet[] = [
    new FakeSheet('Matrículas', seed.matriculas ?? []),
    new FakeSheet('Resumo por curso'),
    new FakeSheet(
      'Aprovados',
      seed.aprovados ?? [['CPF', 'Data de nascimento', 'Nome', 'Modalidade', 'Curso']],
    ),
    new FakeSheet('Config'),
    new FakeSheet('Exceções'),
    new FakeSheet('Usuários'),
  ];
  const ss = {
    sheets,
    getName: () => 'Planilha de teste',
    getSheets() {
      stats.getSheets++;
      return sheets;
    },
    getSheetByName: (n: string) => sheets.find((s) => s.name === n) ?? null,
    insertSheet(n: string, i?: number) {
      const sh = new FakeSheet(n);
      sheets.splice(i ?? sheets.length, 0, sh);
      return sh;
    },
    deleteSheet(sh: FakeSheet) {
      sheets.splice(sheets.indexOf(sh), 1);
    },
  };
  const props = new Map<string, string>(
    Object.entries({ FORM_TOKEN: 't', ADMIN_SENHA: 'senha-forte-1', ...seed.props }),
  );
  const cache = new Map<string, string>();
  const bytes = (b: Buffer) => [...b].map((x) => (x > 127 ? x - 256 : x));
  const g = {
    SpreadsheetApp: new Proxy(
      { openById: () => ss, getActiveSpreadsheet: () => ss },
      { get: (t, p) => (p in t ? t[p as keyof typeof t] : chain()) },
    ),
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => cache.get(k) ?? null,
        put: (k: string, v: string) => void cache.set(k, v),
      }),
    },
    LockService: {
      getScriptLock: () => ({ waitLock: () => void stats.locks++, releaseLock: () => {} }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => props.get(k) ?? null,
        setProperty: (k: string, v: string) => void props.set(k, v),
      }),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (content: string) => ({
        content,
        setMimeType() {
          return this;
        },
      }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      formatDate: (d: Date, _tz: string, f: string) => {
        const p = (n: number, w = 2) => String(n).padStart(w, '0');
        return f
          .replace('yyyy', p(d.getFullYear(), 4))
          .replace('MM', p(d.getMonth() + 1))
          .replace('dd', p(d.getDate()))
          .replace('HH', p(d.getHours()))
          .replace('mm', p(d.getMinutes()));
      },
      getUuid: () => randomUUID(),
      computeDigest: (_a: string, s: string) => bytes(createHash('sha256').update(s).digest()),
      computeHmacSha256Signature: (m: string, k: string) =>
        bytes(createHmac('sha256', k).update(m).digest()),
    },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => chain(), deleteTrigger: () => {} },
    Logger: { log: () => {} },
  };
  const src =
    readFileSync(seed.codeFile ?? resolve(__dirname, 'Code.js'), 'utf8') +
    '\nmodule.exports.doPost = doPost;\nmodule.exports.setup = setup;';
  // Cada pedido ao Apps Script roda o arquivo do zero (variáveis globais novas); a planilha, as
  // propriedades e o cache é que continuam entre um pedido e outro.
  const fresh = () => {
    const mod = { exports: {} as Record<string, unknown> };
    new Function('module', ...Object.keys(g), src)(mod, ...Object.values(g));
    return mod.exports as unknown as {
      doPost: (e: object) => { content: string };
      setup: () => void;
    };
  };
  return {
    ss,
    sheet: (name) => sheets.find((s) => s.name === name)!,
    props,
    stats,
    doPost: (body) =>
      JSON.parse(fresh().doPost({ postData: { contents: JSON.stringify(body) } }).content),
    setup: () => fresh().setup(),
  };
}
