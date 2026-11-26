import { useState } from 'react';
import { replyMessage } from '@/lib/adminApi';
import type { Rec } from '@/lib/adminData';
import {
  answersFromRow,
  courseOf,
  diplomaFill,
  downloadDiploma,
  folhaOf,
  formatModulos,
  longDate,
  nextRegistro,
  nextSemestre,
  parseModulos,
  savedDiploma,
  type ModuloFreq,
} from '@/lib/diploma';
import { MODELOS, type DiplomaConfig } from '@/lib/diplomaConfig';
import { maskDate, parseDate } from '@/lib/masks';
import type { Step } from '@/lib/schema';
import type { Run } from './types';
import { Button, Notice, TextField } from './ui';

/** "87,5" e "87.5" viram "87,50"; o resto fica como foi digitado. */
const formatFreq = (s: string) => {
  const n = Number(s.trim().replace('%', '').replace(',', '.'));
  return s.trim() && Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : s.trim();
};

/**
 * Diploma na ficha do aluno. O modelo vem do curso que ele escolheu no formulário; a
 * coordenação só completa o que a escola tem: SISTEC (registro, folha e livro vêm sugeridos),
 * a data de conclusão (vem a do curso) e, em Enfermagem, semestre e frequência de cada módulo.
 */
export function DiplomaSection({
  rec,
  header,
  steps,
  cfg,
  registrosUsados,
  run,
}: {
  rec: Rec;
  header: string[];
  steps: Step[];
  cfg: DiplomaConfig;
  /** Registros de todas as matrículas (para sugerir o próximo). */
  registrosUsados: string[];
  run: Run;
}) {
  const answers = answersFromRow(steps, header, rec.row);
  const curso = courseOf(answers, cfg);
  const modelo = curso ? MODELOS[curso.modelo] : undefined;
  const saved = savedDiploma(header, rec.row);
  const nMod = modelo?.frequencia ? (curso?.blocos.length ?? 0) : 0;
  const savedMods = parseModulos(saved.modulos);
  const sugerido = saved.registro
    ? ''
    : String(nextRegistro(registrosUsados, cfg.primeiroRegistro));
  const [sistec, setSistec] = useState(saved.sistec);
  const [registro, setRegistro] = useState(saved.registro || sugerido);
  const [folha, setFolha] = useState(
    saved.folha || folhaOf(saved.registro || sugerido, cfg.porFolha),
  );
  const [livro, setLivro] = useState(saved.livro || cfg.livro);
  const [conclusao, setConclusao] = useState(saved.conclusao || curso?.conclusao || '');
  const [mods, setMods] = useState<ModuloFreq[]>(() =>
    Array.from({ length: nMod }, (_, i) => savedMods[i] ?? { semestre: '', freq: '' }),
  );
  const [folhaManual, setFolhaManual] = useState(!!saved.folha);
  const [busy, setBusy] = useState<'' | 'save' | 'docx'>('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // A data igual à do curso não é guardada no aluno: se a direção mudar a do curso, ele acompanha.
  const conclusaoAluno = conclusao.trim() === (curso?.conclusao ?? '') ? '' : conclusao.trim();
  const modulos = formatModulos(
    mods.map((m) => ({ semestre: m.semestre, freq: formatFreq(m.freq) })),
  );
  const changed =
    sistec.trim() !== saved.sistec ||
    registro.trim() !== saved.registro ||
    folha.trim() !== saved.folha ||
    livro.trim() !== saved.livro ||
    conclusaoAluno !== saved.conclusao ||
    modulos !== saved.modulos;
  const registroErr = registro && !/^\d{1,7}$/.test(registro.trim()) ? 'Só números.' : undefined;
  const conclusaoErr = conclusao && !parseDate(conclusao) ? 'Data inválida.' : undefined;
  const fill = diplomaFill(
    answers,
    {
      sistec,
      registro,
      folha,
      livro,
      cpf: rec.cpf,
      conclusao,
      modulos: mods.map((m) => ({ semestre: m.semestre, freq: formatFreq(m.freq) })),
    },
    cfg,
  );
  const escola = fill.pendencias.filter((p) => p.origem === 'escola');
  const aluno = fill.pendencias.filter((p) => p.origem === 'aluno');
  const doCurso = fill.pendencias.filter((p) => p.origem === 'curso');
  /** Leva ao campo vazio da ficha. */
  const goTo = (id?: string) => {
    const el = id ? document.getElementById(id) : null;
    el?.scrollIntoView?.({ block: 'center' });
    el?.focus({ preventScroll: true });
  };
  const setMod = (i: number, patch: Partial<ModuloFreq>) =>
    setMods((list) => list.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const save = async (): Promise<boolean> => {
    if (registroErr || conclusaoErr) return false;
    setBusy('save');
    setMsg(null);
    const r = await run('diploma_aluno', {
      protocolo: rec.protocolo,
      sistec,
      registro,
      folha,
      livro,
      conclusao: conclusaoAluno,
      modulos,
    });
    setBusy('');
    if (r.status !== 'ok') {
      setMsg({ tone: 'error', text: replyMessage(r) });
      return false;
    }
    setMsg({ tone: 'ok', text: 'Dados do diploma salvos.' });
    return true;
  };

  const download = async () => {
    // Salva antes, para o número do registro ficar reservado para este aluno.
    if (changed && !(await save())) return;
    setBusy('docx');
    try {
      await downloadDiploma(fill, fill.values.nome || rec.nome);
      setMsg({ tone: 'ok', text: 'Diploma baixado. Confira no Word antes de imprimir.' });
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof Error ? e.message : 'Não foi possível gerar o diploma.',
      });
    }
    setBusy('');
  };

  return (
    <section
      aria-labelledby="diploma-titulo"
      className="space-y-3 rounded-2xl border-2 border-fg/15 bg-surface p-4"
    >
      <div>
        <h3 id="diploma-titulo" className="font-display text-xl font-extrabold">
          Diploma
        </h3>
        <p className="text-sm text-fg-muted">
          {curso
            ? `${curso.titulo} · ${rec.modalidade}. Os dados do aluno vêm do formulário; complete só o que é da escola.`
            : 'O curso deste aluno não tem modelo de diploma configurado.'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4">
        <div className="col-span-2 sm:col-span-1">
          <TextField
            id="dip-sistec"
            label="Código SISTEC"
            value={sistec}
            onChange={setSistec}
            placeholder="Ex.: 49279/109068309CM"
            hint="De cada aluno: o SISTEC gera quando a secretaria registra a conclusão."
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <TextField
            id="dip-conclusao"
            label="Data de conclusão"
            value={conclusao}
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            error={conclusaoErr}
            hint={
              conclusao && !conclusaoErr
                ? `No diploma: ${longDate(conclusao)}${conclusaoAluno ? ' (só deste aluno)' : ' (a do curso)'}.`
                : 'Em branco: usa a do curso (aba Diploma).'
            }
            onChange={(v) => setConclusao(maskDate(v))}
          />
        </div>
        <TextField
          id="dip-registro"
          label="Registro escolar nº"
          value={registro}
          inputMode="numeric"
          error={registroErr}
          hint={
            !saved.registro && registro === sugerido ? 'Próximo número livre do livro.' : undefined
          }
          onChange={(v) => {
            setRegistro(v);
            if (!folhaManual) setFolha(folhaOf(v, cfg.porFolha));
          }}
        />
        <TextField
          id="dip-folha"
          label="Folha"
          value={folha}
          inputMode="numeric"
          hint={folhaManual ? undefined : `Calculada: ${cfg.porFolha} registros por folha.`}
          onChange={(v) => {
            setFolha(v);
            setFolhaManual(true);
          }}
        />
        <TextField id="dip-livro" label="Livro" value={livro} onChange={setLivro} />
      </div>

      {nMod > 0 && (
        <fieldset className="space-y-3">
          <legend className="mb-1 font-semibold">Semestre e frequência por módulo</legend>
          {mods.map((m, i) => {
            const roman = curso?.blocos[i]?.sigla || String(i + 1);
            const sugestao = i > 0 ? nextSemestre(mods[i - 1].semestre) : '';
            return (
              <div
                key={i}
                className="grid grid-cols-[2rem_1fr_1fr] items-end gap-2 sm:grid-cols-[3rem_1fr_1fr] sm:gap-3"
              >
                <span className="pb-3 text-center font-display text-xl font-extrabold">
                  {roman}
                </span>
                <TextField
                  id={`dip-sem-${i}`}
                  label={
                    <>
                      Semestre<span className="sr-only"> do módulo {roman}</span>
                    </>
                  }
                  value={m.semestre}
                  placeholder={sugestao ? `ex.: ${sugestao}` : 'ex.: 2024.1'}
                  onChange={(v) => setMod(i, { semestre: v })}
                />
                <TextField
                  id={`dip-freq-${i}`}
                  label={
                    <>
                      % de frequência<span className="sr-only"> no módulo {roman}</span>
                    </>
                  }
                  value={m.freq}
                  inputMode="decimal"
                  placeholder="ex.: 87,50"
                  onChange={(v) => setMod(i, { freq: v })}
                />
              </div>
            );
          })}
        </fieldset>
      )}

      {fill.pendencias.length > 0 && (
        <div className="space-y-2 rounded-xl border-2 border-accent/60 bg-accent/15 px-4 py-3 text-sm">
          <p className="font-semibold">Vai sair em branco no diploma:</p>
          {escola.length > 0 && (
            <div>
              <p>Preencha aqui na ficha (clique para ir ao campo):</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {escola.map((p) => (
                  <li key={p.label}>
                    <button
                      type="button"
                      onClick={() => goTo(p.campo)}
                      className="min-h-9 rounded-lg border-2 border-fg/25 bg-surface px-3 font-semibold hover:border-fg"
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {aluno.length > 0 && (
            <p>
              <span className="font-semibold">Veio em branco no formulário do aluno:</span>{' '}
              {aluno.map((p) => p.label).join(' · ')}. Dá para completar na planilha, na linha
              desta matrícula.
            </p>
          )}
          {doCurso.length > 0 && (
            <p>
              <span className="font-semibold">Na aba Diploma:</span>{' '}
              {doCurso.map((p) => p.label).join(' · ')}.
            </p>
          )}
          <p className="text-fg-muted">O diploma pode ser baixado mesmo assim, com o espaço em branco.</p>
        </div>
      )}
      <Notice tone={msg?.tone}>{msg?.text}</Notice>
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <Button
          icon="download"
          onClick={() => void download()}
          disabled={!!busy || rec.status === 'Cancelado' || !curso}
        >
          {busy === 'docx'
            ? 'Gerando…'
            : changed
              ? 'Salvar e baixar diploma'
              : 'Baixar diploma (.docx)'}
        </Button>
        <Button
          variant="ghost"
          icon="check"
          onClick={() => void save()}
          disabled={!!busy || !changed}
        >
          {busy === 'save' ? 'Salvando…' : 'Só salvar'}
        </Button>
      </div>
      {rec.status === 'Cancelado' && (
        <p className="text-sm text-fg-muted">Matrícula cancelada: o diploma não é gerado.</p>
      )}
    </section>
  );
}
