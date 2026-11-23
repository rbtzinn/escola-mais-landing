import { useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { api, replyMessage, type Session } from '@/lib/adminApi';
import { Button, Notice } from './ui';

export function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!login.trim() || !senha) {
      setError('Preencha o login e a senha.');
      return;
    }
    setBusy(true);
    setError('');
    const r = await api('login', { login: login.trim().toLowerCase(), senha });
    setBusy(false);
    if (r.status === 'ok')
      onLogin({
        sessao: String(r.sessao),
        nome: String(r.nome),
        papel: r.papel as Session['papel'],
        exp: Number(r.exp),
      });
    else setError(replyMessage(r));
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void submit();
      }}
      className="mx-auto max-w-sm space-y-5 rounded-2xl border-2 border-fg/15 bg-surface p-6"
    >
      <h2 className="font-display text-3xl font-extrabold">Entrar no painel</h2>
      <TextField
        id="login"
        label="Login"
        value={login}
        onChange={setLogin}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
      />
      <TextField
        id="senha"
        label="Senha"
        type="password"
        value={senha}
        onChange={setSenha}
        autoComplete="current-password"
      />
      <Notice tone="error">{error}</Notice>
      <Button type="submit" className="w-full" disabled={busy} icon={busy ? 'refresh' : 'key'}>
        {busy ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="text-sm text-fg-muted">
        Esqueceu a senha? Peça para a direção trocar no painel.
      </p>
    </form>
  );
}
