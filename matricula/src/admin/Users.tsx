import { useState } from 'react';
import { ChoiceFieldset, ChoiceOption } from '@/components/Choices';
import { TextField } from '@/components/ui/TextField';
import { replyMessage, type Role } from '@/lib/adminApi';
import type { PanelData, Run } from './types';
import { Button, Card, Notice } from './ui';

const ROLE_LABEL: Record<Role, string> = {
  direcao: 'Direção (tudo)',
  coordenacao: 'Coordenação (só status)',
};

function PasswordReset({ login, run }: { login: string; run: Run }) {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  if (!open)
    return (
      <Button variant="ghost" icon="key" onClick={() => setOpen(true)}>
        Trocar senha
      </Button>
    );
  return (
    <form
      noValidate
      className="mt-2 w-full space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (senha.length < 8) return setMsg({ tone: 'error', text: 'Pelo menos 8 caracteres.' });
        const r = await run('usuario_senha', { login, senha });
        if (r.status === 'ok') {
          setOpen(false);
          setSenha('');
        } else setMsg({ tone: 'error', text: replyMessage(r) });
      }}
    >
      <TextField
        id={`senha-${login}`}
        label="Nova senha"
        type="text"
        autoComplete="new-password"
        value={senha}
        onChange={setSenha}
        hint="Passe a senha para a pessoa; ela não aparece de novo."
      />
      <Notice tone={msg?.tone}>{msg?.text}</Notice>
      <div className="flex gap-2">
        <Button type="submit">Salvar senha</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function Users({ list, run }: { list: NonNullable<PanelData['usuarios']>; run: Run }) {
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [papel, setPapel] = useState<Role>('coordenacao');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const create = async () => {
    if (!nome.trim() || !/^[a-z0-9._-]{3,30}$/.test(login) || senha.length < 8) {
      setMsg({
        tone: 'error',
        text: 'Preencha nome, login (minúsculas, sem espaço, 3 a 30) e senha (8 ou mais).',
      });
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await run('usuario_add', { nome: nome.trim(), login, papel, senha });
    setBusy(false);
    if (r.status === 'ok') {
      setMsg({
        tone: 'ok',
        text: `Usuário ${login} criado. Passe o login e a senha para ${nome.trim()}.`,
      });
      setNome('');
      setLogin('');
      setSenha('');
    } else setMsg({ tone: 'error', text: replyMessage(r) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card title="Novo usuário">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void create();
          }}
          className="space-y-4"
        >
          <TextField id="u-nome" label="Nome" value={nome} onChange={setNome} />
          <TextField
            id="u-login"
            label="Login"
            value={login}
            onChange={(v) => setLogin(v.toLowerCase().replace(/\s/g, ''))}
            autoCapitalize="none"
            spellCheck={false}
            hint="Ex.: maria.coord"
          />
          <ChoiceFieldset id="u-papel" label="Pode fazer">
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <ChoiceOption
                key={r}
                name="u-papel"
                type="radio"
                label={ROLE_LABEL[r]}
                checked={papel === r}
                onChange={() => setPapel(r)}
              />
            ))}
          </ChoiceFieldset>
          <TextField
            id="u-senha"
            label="Senha"
            type="text"
            autoComplete="new-password"
            value={senha}
            onChange={setSenha}
            hint="8 ou mais caracteres."
          />
          <Notice tone={msg?.tone}>{msg?.text}</Notice>
          <Button type="submit" disabled={busy} icon="plus">
            {busy ? 'Criando…' : 'Criar usuário'}
          </Button>
        </form>
      </Card>

      <Card title={`Usuários (${list.length})`}>
        <p className="mb-3 text-sm text-fg-muted">
          O login <strong>admin</strong> (senha ADMIN_SENHA do script) sempre entra como direção.
          Use só para emergência.
        </p>
        {list.length === 0 ? (
          <p className="text-fg-muted">Nenhum usuário criado.</p>
        ) : (
          <ul className="divide-y divide-fg/10">
            {list.map((u) => (
              <li key={u.login} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {u.nome}{' '}
                    {!u.ativo && (
                      <span className="text-sm font-normal text-danger">(desativado)</span>
                    )}
                  </span>
                  <span className="text-sm text-fg-muted">
                    {u.login} · {ROLE_LABEL[u.papel] ?? u.papel}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Button
                    variant={u.ativo ? 'danger' : 'ghost'}
                    onClick={() => void run('usuario_ativo', { login: u.login, ativo: !u.ativo })}
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </Button>
                  <PasswordReset login={u.login} run={run} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
