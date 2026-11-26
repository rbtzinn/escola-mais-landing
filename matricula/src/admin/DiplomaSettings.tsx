import clsx from 'clsx';
import { useState } from 'react';
import { FieldLabel, fieldClasses } from '@/components/ui/Field';
import { Listbox } from '@/components/ui/Listbox';
import { TextField } from '@/components/ui/TextField';
import { replyMessage } from '@/lib/adminApi';
import { longDate } from '@/lib/diploma';
import {
  MODELOS,
  courseWarnings,
  fitBlocks,
  itemsToText,
  textToItems,
  type DiplomaConfig,
  type DiplomaCourse,
  type ModeloId,
  type Signer,
} from '@/lib/diplomaConfig';
import { maskDate, parseDate } from '@/lib/masks';
import type { Run } from './types';
import { Button, Card, Notice } from './ui';

function TextArea({
  id,
  label,
  value,
  onChange,
  rows = 4,
  hint,
  mono = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  /** Fonte de largura fixa: ajuda a alinhar listas "nome ; C.H.". */
  mono?: boolean;
}) {
  return (
    <div>
      <FieldLabel id={id}>{label}</FieldLabel>
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={clsx(fieldClasses(false), 'resize-y', mono && 'font-mono text-sm')}
      />
    </div>
  );
}

/** Texto editável de um curso: disciplinas e perfil viram linhas. */
interface CourseText {
  blocos: string[];
  perfil: string;
}
const toText = (c: DiplomaCourse): CourseText => ({
  blocos: c.blocos.map((b) => itemsToText(b.itens)),
  perfil: c.perfil.join('\n'),
});

/** Aba "Diploma" (só direção): o que não vem do aluno e o verso de cada curso. */
export function DiplomaSettings({ cfg: initial, run }: { cfg: DiplomaConfig; run: Run }) {
  const [cfg, setCfg] = useState<DiplomaConfig>(() => structuredClone(initial));
  const keys = Object.keys(cfg.cursos);
  const [cursoKey, setCursoKey] = useState(keys[0] ?? '');
  const [texts, setTexts] = useState<Record<string, CourseText>>(() =>
    Object.fromEntries(Object.entries(initial.cursos).map(([k, c]) => [k, toText(c)])),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const set = <K extends keyof DiplomaConfig>(k: K, v: DiplomaConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const setCab = (k: keyof DiplomaConfig['cabecalho'], v: string) =>
    setCfg((c) => ({ ...c, cabecalho: { ...c.cabecalho, [k]: v } }));
  const setSigner = (who: 'secretaria' | 'diretor', k: keyof Signer, v: string) =>
    setCfg((c) => ({ ...c, [who]: { ...c[who], [k]: v } }));
  const curso = cfg.cursos[cursoKey];
  const text = texts[cursoKey];
  const setCurso = (patch: Partial<DiplomaCourse>) =>
    setCfg((c) => ({ ...c, cursos: { ...c.cursos, [cursoKey]: { ...c.cursos[cursoKey], ...patch } } }));
  const setBloco = (i: number, k: 'sigla' | 'titulo' | 'total', v: string) =>
    setCurso({ blocos: curso.blocos.map((b, j) => (j === i ? { ...b, [k]: v } : b)) });
  const setText = (patch: Partial<CourseText>) =>
    setTexts((t) => ({ ...t, [cursoKey]: { ...t[cursoKey], ...patch } }));

  /** Curso com as disciplinas e o perfil lidos dos campos de texto. */
  const parsed = (k: string): DiplomaCourse => {
    const c = cfg.cursos[k];
    const t = texts[k];
    return {
      ...c,
      blocos: c.blocos.map((b, i) => ({ ...b, itens: textToItems(t.blocos[i] ?? '') })),
      perfil: t.perfil
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    };
  };
  const warnings = curso ? courseWarnings(parsed(cursoKey)) : [];
  const conclusaoErr = curso?.conclusao && !parseDate(curso.conclusao) ? 'Data inválida.' : undefined;
  const modelo = curso ? MODELOS[curso.modelo] : undefined;

  const save = async () => {
    const badDate = keys.find((k) => cfg.cursos[k].conclusao && !parseDate(cfg.cursos[k].conclusao));
    if (badDate) {
      setCursoKey(badDate);
      setMsg({ tone: 'error', text: `Data de conclusão inválida em ${badDate}.` });
      return;
    }
    // O curso aberto na tela conta como conferido ao salvar.
    const cursos = Object.fromEntries(
      keys.map((k) => [k, { ...parsed(k), revisado: cfg.cursos[k].revisado || k === cursoKey }]),
    );
    setBusy(true);
    setMsg(null);
    const r = await run('diploma_config', { config: { ...cfg, cursos } });
    setBusy(false);
    setMsg(
      r.status === 'ok'
        ? { tone: 'ok', text: 'Configuração do diploma salva.' }
        : { tone: 'error', text: replyMessage(r) },
    );
  };

  const signer = (who: 'secretaria' | 'diretor', title: string) => (
    <fieldset className="space-y-3">
      <legend className="mb-2 font-display text-lg font-extrabold">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${who}-nome`} label="Nome" value={cfg[who].nome} onChange={(v) => setSigner(who, 'nome', v)} />
        <TextField
          id={`${who}-cargo`}
          label="Cargo (como sai no diploma)"
          value={cfg[who].cargo}
          onChange={(v) => setSigner(who, 'cargo', v)}
        />
        <TextField
          id={`${who}-matricula`}
          label="Matrícula"
          value={cfg[who].matricula}
          onChange={(v) => setSigner(who, 'matricula', v)}
        />
        <TextField
          id={`${who}-ato`}
          label="Portaria ou ato"
          value={cfg[who].ato}
          onChange={(v) => setSigner(who, 'ato', v)}
        />
        <TextField
          id={`${who}-pub`}
          label="Publicação"
          value={cfg[who].publicacao}
          onChange={(v) => setSigner(who, 'publicacao', v)}
          placeholder="D.O. de 10/09/2025"
        />
      </div>
    </fieldset>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void save();
      }}
      className="space-y-6"
    >
      <Card title="Local e livro de registro">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="dip-cidade"
            label="Cidade (local e data)"
            value={cfg.cidade}
            onChange={(v) => set('cidade', v)}
          />
          <TextField
            id="dip-primeiro"
            label="Primeiro registro emitido pelo painel"
            value={cfg.primeiroRegistro}
            onChange={(v) => set('primeiroRegistro', v.replace(/\D/g, ''))}
            inputMode="numeric"
            hint="O livro já tem registros? Coloque o próximo número livre."
          />
          <TextField
            id="dip-porfolha"
            label="Registros por folha"
            value={cfg.porFolha}
            onChange={(v) => set('porFolha', v.replace(/\D/g, ''))}
            inputMode="numeric"
          />
          <TextField id="dip-livro" label="Livro atual" value={cfg.livro} onChange={(v) => set('livro', v)} />
        </div>
      </Card>

      <Card title="Escola">
        <div className="space-y-4">
          <TextField
            id="dip-escola-nome"
            label="Nome da escola no texto"
            value={cfg.escolaNome}
            onChange={(v) => set('escolaNome', v)}
          />
          <TextField
            id="dip-cab-secretaria"
            label="Cabeçalho: secretaria"
            value={cfg.cabecalho.secretaria}
            onChange={(v) => setCab('secretaria', v)}
          />
          <TextField
            id="dip-cab-gerencia"
            label="Cabeçalho: gerência regional"
            value={cfg.cabecalho.gerencia}
            onChange={(v) => setCab('gerencia', v)}
          />
          <TextField
            id="dip-cab-escola"
            label="Cabeçalho: escola"
            value={cfg.cabecalho.escola}
            onChange={(v) => setCab('escola', v)}
          />
          <TextArea
            id="dip-cab-endereco"
            label="Cabeçalho: endereço e CNPJ"
            rows={2}
            value={cfg.cabecalho.endereco}
            onChange={(v) => setCab('endereco', v)}
          />
          <TextArea
            id="dip-cab-atos"
            label="Cabeçalho: decreto, portaria, cadastro e INEP"
            rows={2}
            value={cfg.cabecalho.atos}
            onChange={(v) => setCab('atos', v)}
          />
        </div>
      </Card>

      <Card title="Assinaturas">
        <div className="space-y-6">
          {signer('secretaria', 'Secretaria escolar')}
          {signer('diretor', 'Direção')}
        </div>
      </Card>

      {curso && text && (
        <Card title="Curso">
          <div className="space-y-4">
            <Listbox
              id="dip-curso"
              name="dip-curso"
              label="Curso"
              value={cursoKey}
              onChange={setCursoKey}
              options={keys.map((k) => ({
                value: k,
                label: cfg.cursos[k].revisado ? k : `${k} (rascunho: confira)`,
              }))}
            />
            {!curso.revisado && (
              <p className="rounded-xl border-2 border-accent/60 bg-accent/15 px-4 py-3 text-sm font-semibold">
                A escola ainda não mandou o modelo deste curso: ele começou como rascunho. Confira e
                preencha as disciplinas e o perfil; ao salvar, ele passa a valer.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="dip-titulo"
                label="Título"
                value={curso.titulo}
                onChange={(v) => setCurso({ titulo: v })}
                placeholder="Técnico em Farmácia"
              />
              <TextField id="dip-eixo" label="Eixo tecnológico" value={curso.eixo} onChange={(v) => setCurso({ eixo: v })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Listbox
                id="dip-modelo"
                name="dip-modelo"
                label="Modelo do diploma"
                value={curso.modelo}
                onChange={(v) => setCurso(fitBlocks({ ...curso, modelo: v as ModeloId }))}
                options={(Object.keys(MODELOS) as ModeloId[]).map((id) => ({ value: id, label: MODELOS[id].nome }))}
              />
              <TextField
                id="dip-conclusao"
                label="Data de conclusão da turma"
                value={curso.conclusao}
                onChange={(v) => setCurso({ conclusao: maskDate(v) })}
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                error={conclusaoErr}
                hint={
                  curso.conclusao && !conclusaoErr
                    ? `No diploma: ${longDate(curso.conclusao)}. Dá para trocar na ficha de um aluno.`
                    : 'Dá para trocar na ficha de um aluno.'
                }
              />
            </div>
            <TextField
              id="dip-conclusao-texto"
              label="Concluiu…"
              value={curso.conclusaoTexto}
              onChange={(v) => setCurso({ conclusaoTexto: v })}
              hint="Ex.: Ensino Médio Integral, Integrado à Educação Profissional (Integrado) ou Educação Profissional Técnico em Farmácia na forma Subsequente"
            />
            <TextField
              id="dip-portaria"
              label="Portaria de credenciamento do curso (cabeçalho)"
              value={curso.portaria}
              onChange={(v) => setCurso({ portaria: v })}
            />

            {curso.blocos.map((b, i) => (
              <fieldset key={i} className="space-y-3 rounded-xl border-2 border-fg/10 p-3">
                <legend className="px-1 font-display text-lg font-extrabold">
                  {curso.modelo === 'integrado' ? `Bloco ${i + 1} do verso` : `Módulo ${['I', 'II', 'III', 'IV'][i]}`}
                </legend>
                {modelo?.totais && (
                  <div className="grid gap-4 sm:grid-cols-[1fr_2fr_8rem]">
                    <TextField
                      id={`dip-b${i}-sigla`}
                      label="Rótulo lateral"
                      value={b.sigla}
                      onChange={(v) => setBloco(i, 'sigla', v)}
                    />
                    <TextField
                      id={`dip-b${i}-titulo`}
                      label="Linha de total"
                      value={b.titulo}
                      onChange={(v) => setBloco(i, 'titulo', v)}
                    />
                    <TextField
                      id={`dip-b${i}-total`}
                      label="Total (C.H.)"
                      value={b.total}
                      inputMode="numeric"
                      onChange={(v) => setBloco(i, 'total', v)}
                    />
                  </div>
                )}
                <TextArea
                  id={`dip-b${i}-itens`}
                  label="Disciplinas"
                  mono
                  rows={Math.min(14, Math.max(4, (text.blocos[i] ?? '').split('\n').length + 1))}
                  hint="Uma por linha: nome ; carga horária. Dá para colar duas colunas da planilha."
                  value={text.blocos[i] ?? ''}
                  onChange={(v) => setText({ blocos: text.blocos.map((t, j) => (j === i ? v : t)) })}
                />
              </fieldset>
            ))}
            {modelo?.totais && (
              <TextField
                id="dip-ch-total"
                label="Total de carga horária do curso"
                value={curso.chTotal}
                inputMode="numeric"
                onChange={(v) => setCurso({ chTotal: v })}
              />
            )}
            {modelo && modelo.extras.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {modelo.extras.map((x) => (
                  <TextField
                    key={x.key}
                    id={`dip-extra-${x.key}`}
                    label={x.label}
                    value={curso.extras[x.key] ?? ''}
                    onChange={(v) => setCurso({ extras: { ...curso.extras, [x.key]: v } })}
                  />
                ))}
              </div>
            )}
            <TextArea
              id="dip-perfil"
              label="Perfil do profissional"
              rows={8}
              hint="Um item por linha (o marcador de cada item o modelo põe sozinho)."
              value={text.perfil}
              onChange={(v) => setText({ perfil: v })}
            />
            {warnings.length > 0 && (
              <div className="rounded-xl border-2 border-accent/60 bg-accent/15 px-4 py-3 text-sm">
                <p className="font-semibold">Confira as contas (o diploma sai como está escrito):</p>
                <ul className="mt-1 list-disc pl-5">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="sticky bottom-0 z-10 -mx-1 space-y-3 bg-bg/95 px-1 py-3 backdrop-blur">
        <Notice tone={msg?.tone}>{msg?.text}</Notice>
        <Button type="submit" disabled={busy} icon="check">
          {busy ? 'Salvando…' : 'Salvar configuração do diploma'}
        </Button>
      </div>
    </form>
  );
}
