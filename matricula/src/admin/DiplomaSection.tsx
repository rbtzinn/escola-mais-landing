import { useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { replyMessage } from '@/lib/adminApi';
import type { Rec } from '@/lib/adminData';
import {
  answersFromRow,
  diplomaFill,
  downloadDiploma,
  folhaOf,
  nextRegistro,
} from '@/lib/diploma';
import type { DiplomaConfig } from '@/lib/diplomaConfig';
import type { Step } from '@/lib/schema';
import type { Run } from './types';
import { Button, Notice } from './ui';

const cell = (header: string[], row: string[], name: string) => {
  const i = header.indexOf(name);
  return i >= 0 ? String(row[i] ?? '').trim() : '';
};

/**
 * Diploma na ficha do aluno: a secretaria informa o SISTEC (o registro, a folha e o livro já vêm
 * sugeridos pela numeração do livro), salva e baixa o .docx preenchido.
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
  const saved = {
    sistec: cell(header, rec.row, 'Código SISTEC'),
    registro: cell(header, rec.row, 'Registro escolar'),
    folha: cell(header, rec.row, 'Folha'),
    livro: cell(header, rec.row, 'Livro'),
  };
  const sugerido = saved.registro ? '' : String(nextRegistro(registrosUsados, cfg.primeiroRegistro));
  const [sistec, setSistec] = useState(saved.sistec);
  const [registro, setRegistro] = useState(saved.registro || sugerido);
  const [folha, setFolha] = useState(saved.folha || folhaOf(saved.registro || sugerido, cfg.porFolha));
  const [livro, setLivro] = useState(saved.livro || cfg.livro);
  const [folhaManual, setFolhaManual] = useState(!!saved.folha);
  const [busy, setBusy] = useState<'' | 'save' | 'docx'>('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const changed =
    sistec.trim() !== saved.sistec ||
    registro.trim() !== saved.registro ||
    folha.trim() !== saved.folha ||
    livro.trim() !== saved.livro;
  const registroErr = registro && !/^\d{1,7}$/.test(registro.trim()) ? 'Só números.' : undefined;
  const fill = diplomaFill(
    answersFromRow(steps, header, rec.row),
    { sistec, registro, folha, livro, cpf: rec.cpf },
    cfg,
  );

  const save = async (): Promise<boolean> => {
    if (registroErr) return false;
    setBusy('save');
    setMsg(null);
    const r = await run('diploma_aluno', { protocolo: rec.protocolo, sistec, registro, folha, livro });
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
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Não foi possível gerar o diploma.' });
    }
    setBusy('');
  };

  return (
    <section
      aria-labelledby="diploma-titulo"
      className="space-y-3 rounded-2xl border-2 border-fg/15 bg-surface p-4"
    >
      <h3 id="diploma-titulo" className="font-display text-xl font-extrabold">
        Diploma
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="dip-sistec"
          label="Código SISTEC"
          value={sistec}
          onChange={setSistec}
          placeholder="Ex.: 49279/109068309CM"
        />
        <TextField
          id="dip-registro"
          label="Registro escolar nº"
          value={registro}
          inputMode="numeric"
          error={registroErr}
          hint={!saved.registro && registro === sugerido ? 'Próximo número livre do livro.' : undefined}
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
      {fill.missing.length > 0 && (
        <div className="rounded-xl border-2 border-accent/60 bg-accent/15 px-4 py-3 text-sm">
          <p className="font-semibold">Vai sair em branco no diploma:</p>
          <p>{fill.missing.join(' · ')}.</p>
        </div>
      )}
      <Notice tone={msg?.tone}>{msg?.text}</Notice>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="ghost"
          icon="check"
          onClick={() => void save()}
          disabled={!!busy || !changed}
        >
          {busy === 'save' ? 'Salvando…' : 'Salvar dados'}
        </Button>
        <Button
          icon="download"
          onClick={() => void download()}
          disabled={!!busy || rec.status === 'Cancelado'}
        >
          {busy === 'docx' ? 'Gerando…' : changed ? 'Salvar e baixar diploma' : 'Baixar diploma (.docx)'}
        </Button>
      </div>
      {rec.status === 'Cancelado' && (
        <p className="text-sm text-fg-muted">Matrícula cancelada: o diploma não é gerado.</p>
      )}
    </section>
  );
}
