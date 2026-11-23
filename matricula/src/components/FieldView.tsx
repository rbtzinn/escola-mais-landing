import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { Combobox } from '@/components/ui/Combobox';
import { FieldError } from '@/components/ui/Field';
import { Listbox } from '@/components/ui/Listbox';
import { TextField } from '@/components/ui/TextField';
import { fetchCep, searchStreet, type Endereco } from '@/lib/cep';
import { maskCpf } from '@/lib/cpf';
import { emailSuggestion } from '@/lib/email';
import { UFS, fetchCities } from '@/lib/ibge';
import { maskCep, maskDate, maskPhone, maskRg } from '@/lib/masks';
import { cleanName } from '@/lib/names';
import { type Field, OUTRO, type Values, optionsOf } from '@/lib/schema';
import { ChoiceFieldset, ChoiceOption } from './Choices';

export interface FieldProps {
  field: Field;
  values: Values;
  error?: string;
  /** Erro do campo "Outro" (mostrado junto do texto). */
  onChange: (id: string, value: string | string[]) => void;
  onPatch: (patch: Values) => void;
  onBlur: (id: string) => void;
}

const UF_OPTIONS = UFS.map((u) => ({ value: u.sigla, label: `${u.nome} (${u.sigla})` }));
const text = (v: Values, id: string) => (typeof v[id] === 'string' ? (v[id] as string) : '');

/** Cidades do estado escolhido (IBGE). `null` quando a API falhou: a pessoa digita à mão. */
function useCities(uf: string) {
  const [state, setState] = useState<{ uf: string; list: string[] | null } | null>(null);
  useEffect(() => {
    if (!uf) return;
    let alive = true;
    fetchCities(uf).then((list) => {
      if (alive) setState({ uf, list });
    });
    return () => {
      alive = false;
    };
  }, [uf]);
  if (!uf || state?.uf !== uf) return { loading: !!uf, list: [] as string[] | null };
  return { loading: false, list: state.list };
}

function CityField({ field, values, error, onChange, onBlur }: FieldProps) {
  const uf = text(values, field.ufField!);
  const { loading, list } = useCities(uf);
  const value = text(values, field.id);
  if (list === null)
    return (
      <TextField
        id={field.id}
        label={field.label}
        hint="Não conseguimos carregar a lista de cidades. Digite o nome."
        value={value}
        onChange={(v) => onChange(field.id, v)}
        onBlur={() => onBlur(field.id)}
        error={error}
      />
    );
  return (
    <Combobox
      id={field.id}
      name={field.id}
      label={field.label}
      options={list.map((c) => ({ value: c, label: c }))}
      value={value}
      onChange={(v) => {
        onChange(field.id, v);
        onBlur(field.id);
      }}
      placeholder={loading ? 'Carregando cidades…' : uf ? 'Digite para buscar a cidade' : 'Escolha o estado primeiro'}
      emptyText="Nenhuma cidade com esse nome neste estado"
      error={error}
    />
  );
}

/** CEP que preenche o endereço, com a busca pela rua para quem não sabe o CEP. */
function CepField({ field, values, error, onChange, onPatch, onBlur }: FieldProps) {
  const value = text(values, field.id);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'nao-encontrado' | 'falha'>('idle');
  const [searching, setSearching] = useState(false);

  const fill = (e: Endereco) =>
    onPatch({
      end_cep: maskCep(e.cep),
      ...(e.rua && { end_rua: e.rua }),
      ...(e.bairro && { end_bairro: e.bairro }),
      end_uf: e.uf,
      end_cidade: e.cidade,
    });

  const lookup = async (cep: string) => {
    setStatus('loading');
    const r = await fetchCep(cep);
    if (r.status === 'ok') {
      fill(r.endereco);
      setStatus('ok');
    } else setStatus(r.status);
  };

  return (
    <div className="space-y-3">
      <TextField
        id={field.id}
        label={field.label}
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        value={value}
        onChange={(raw) => {
          const masked = maskCep(raw);
          onChange(field.id, masked);
          if (masked.length === 9) void lookup(masked);
          else setStatus('idle');
        }}
        onBlur={() => onBlur(field.id)}
        error={error}
        after={
          <p role="status" className="mt-1.5 min-h-5 text-sm text-fg-muted">
            {status === 'loading' && 'Buscando o endereço…'}
            {status === 'ok' && (
              <span className="text-ok">Endereço encontrado. Confira e complete o número.</span>
            )}
            {status === 'nao-encontrado' && 'Não achamos esse CEP. Confira os números ou preencha o endereço abaixo.'}
            {status === 'falha' && 'A busca do CEP não respondeu. Preencha o endereço abaixo.'}
          </p>
        }
      />
      <button
        type="button"
        onClick={() => setSearching((s) => !s)}
        aria-expanded={searching}
        className="text-sm font-semibold text-primary underline decoration-2 underline-offset-4"
      >
        {searching ? 'Fechar a busca' : 'Não sei meu CEP'}
      </button>
      {searching && (
        <StreetSearch
          onPick={(e) => {
            fill(e);
            setStatus('ok');
            setSearching(false);
          }}
        />
      )}
    </div>
  );
}

function StreetSearch({ onPick }: { onPick: (e: Endereco) => void }) {
  const [uf, setUf] = useState('PE');
  const [cidade, setCidade] = useState('');
  const [rua, setRua] = useState('');
  const [result, setResult] = useState<Endereco[] | null | 'loading'>([]);
  const [searched, setSearched] = useState(false);
  const { list } = useCities(uf);

  const search = async () => {
    setSearched(true);
    setResult('loading');
    setResult(await searchStreet(uf, cidade, rua));
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-fg/15 bg-muted p-4">
      <p className="text-sm text-fg-muted">Escolha o estado e a cidade e digite o nome da rua.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Combobox id="busca-uf" name="busca-uf" label="Estado" options={UF_OPTIONS} value={uf} onChange={(v) => { setUf(v); setCidade(''); }} />
        {list ? (
          <Combobox
            id="busca-cidade"
            name="busca-cidade"
            label="Cidade"
            options={list.map((c) => ({ value: c, label: c }))}
            value={cidade}
            onChange={setCidade}
          />
        ) : (
          <TextField id="busca-cidade" label="Cidade" value={cidade} onChange={setCidade} />
        )}
      </div>
      <TextField
        id="busca-rua"
        label="Nome da rua"
        placeholder="Ex.: Rua do Hospício"
        value={rua}
        onChange={setRua}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void search();
          }
        }}
      />
      <button
        type="button"
        onClick={() => void search()}
        disabled={!cidade || rua.trim().length < 3}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary disabled:opacity-50"
      >
        <Icon name="search" size={18} />
        Buscar CEP
      </button>
      <div role="status" aria-live="polite">
        {result === 'loading' && <p className="text-sm text-fg-muted">Buscando…</p>}
        {result === null && <p className="text-sm text-danger">A busca não respondeu. Tente de novo ou preencha à mão.</p>}
        {Array.isArray(result) && searched && result.length === 0 && (
          <p className="text-sm text-fg-muted">Nenhuma rua encontrada. Tente só uma parte do nome (ex.: &quot;Hospício&quot;).</p>
        )}
      </div>
      {Array.isArray(result) && result.length > 0 && (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {result.map((e) => (
            <li key={`${e.cep}-${e.rua}-${e.bairro}`}>
              <button
                type="button"
                onClick={() => onPick(e)}
                className="w-full rounded-xl border-2 border-fg/15 bg-surface px-4 py-2.5 text-left hover:border-primary"
              >
                <span className="block font-semibold">{e.rua}</span>
                <span className="text-sm text-fg-muted">
                  {e.bairro} · CEP {e.cep}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OtherText({ field, values, onChange, onBlur }: FieldProps) {
  const id = `${field.id}_outro`;
  return (
    <TextField
      id={id}
      label="Qual?"
      value={text(values, id)}
      onChange={(v) => onChange(id, v)}
      onBlur={() => onBlur(field.id)}
    />
  );
}

/** Desenha um campo do esquema conforme o tipo, com máscara e limpeza ao sair do campo. */
export function FieldView(props: FieldProps) {
  const { field, values, error, onChange, onBlur } = props;
  const value = text(values, field.id);
  const common = {
    id: field.id,
    label: field.label,
    hint: field.hint,
    placeholder: field.placeholder,
    value,
    error,
    autoComplete: field.autoComplete ?? 'off',
    onBlur: () => onBlur(field.id),
  };

  switch (field.kind) {
    case 'name':
      return (
        <TextField
          {...common}
          autoCapitalize="words"
          onChange={(v) => onChange(field.id, v)}
          onBlur={() => {
            if (value) onChange(field.id, cleanName(value));
            onBlur(field.id);
          }}
        />
      );
    case 'cpf':
      return (
        <TextField {...common} inputMode="numeric" placeholder="000.000.000-00" onChange={(v) => onChange(field.id, maskCpf(v))} />
      );
    case 'rg':
      return <TextField {...common} inputMode="text" onChange={(v) => onChange(field.id, maskRg(v))} />;
    case 'date':
      return <TextField {...common} inputMode="numeric" placeholder="dd/mm/aaaa" onChange={(v) => onChange(field.id, maskDate(v))} />;
    case 'cellphone':
    case 'phone':
      return (
        <TextField
          {...common}
          type="tel"
          inputMode="tel"
          placeholder={field.kind === 'cellphone' ? '(81) 9 0000-0000' : '(81) 0000-0000'}
          onChange={(v) => onChange(field.id, maskPhone(v))}
        />
      );
    case 'email': {
      const suggestion = emailSuggestion(value);
      return (
        <TextField
          {...common}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="nome@gmail.com"
          onChange={(v) => onChange(field.id, v.replace(/\s/g, ''))}
          onBlur={() => {
            if (value) onChange(field.id, value.trim().toLowerCase());
            onBlur(field.id);
          }}
          after={
            suggestion && (
              <p className="mt-1.5 text-sm">
                Você quis dizer{' '}
                <button
                  type="button"
                  onClick={() => onChange(field.id, suggestion)}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {suggestion}
                </button>
                ?
              </p>
            )
          }
        />
      );
    }
    case 'cep':
      return <CepField {...props} />;
    case 'longtext':
      return (
        <div>
          <label htmlFor={field.id} className="mb-1.5 block text-sm font-semibold">
            {field.label}
          </label>
          <textarea
            id={field.id}
            value={value}
            rows={3}
            maxLength={500}
            onChange={(e) => onChange(field.id, e.target.value)}
            onBlur={() => onBlur(field.id)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${field.id}-error` : undefined}
            className={clsx(
              'w-full rounded-md border bg-surface px-4 py-2.5 text-base text-fg',
              error ? 'border-danger' : 'border-fg/30 hover:border-fg',
            )}
          />
          <FieldError id={field.id} message={error} />
        </div>
      );
    case 'uf':
      return (
        <Combobox
          id={field.id}
          name={field.id}
          label={field.label}
          options={UF_OPTIONS}
          value={value}
          onChange={(v) => {
            // Trocar o estado apaga a cidade escolhida antes (ela é de outro estado).
            const cleared = v !== value ? Object.fromEntries((field.clears ?? []).map((id) => [id, ''])) : {};
            props.onPatch({ [field.id]: v, ...cleared });
            onBlur(field.id);
          }}
          placeholder="Digite o estado ou a sigla"
          emptyText="Nenhum estado encontrado"
          error={error}
        />
      );
    case 'city':
      return <CityField {...props} />;
    case 'select': {
      const options = [...(field.options ?? []), ...(field.other ? [OUTRO] : [])];
      return (
        <div className="space-y-3">
          <Listbox
            id={field.id}
            name={field.id}
            label={field.label}
            options={options.map((o) => ({ value: o, label: o }))}
            value={value}
            onChange={(v) => {
              onChange(field.id, v);
              onBlur(field.id);
            }}
            error={error}
          />
          {field.other && value === OUTRO && <OtherText {...props} />}
        </div>
      );
    }
    case 'choice': {
      const options = [...optionsOf(field, values), ...(field.other ? [OUTRO] : [])];
      const compact = options.every((o) => o.length <= 8);
      return (
        <div className="space-y-3">
          <ChoiceFieldset id={field.id} label={field.label} hint={field.hint} error={error} compact={compact}>
            {options.map((o) => (
              <ChoiceOption
                key={o}
                name={field.id}
                type="radio"
                label={o}
                checked={value === o}
                invalid={!!error}
                onChange={() => {
                  // Trocar a modalidade apaga o curso escolhido antes (ele é da outra lista).
                  const cleared = o !== value ? Object.fromEntries((field.clears ?? []).map((id) => [id, ''])) : {};
                  props.onPatch({ [field.id]: o, ...cleared });
                  onBlur(field.id);
                }}
              />
            ))}
          </ChoiceFieldset>
          {field.other && value === OUTRO && <OtherText {...props} />}
        </div>
      );
    }
    case 'multi': {
      const options = [...(field.options ?? []), ...(field.other ? [OUTRO] : [])];
      const selected = Array.isArray(values[field.id]) ? (values[field.id] as string[]) : [];
      const toggle = (o: string) => {
        let next = selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o];
        if (field.exclusive && o === field.exclusive && next.includes(o)) next = [o];
        else if (field.exclusive && o !== field.exclusive) next = next.filter((s) => s !== field.exclusive);
        onChange(field.id, next);
        onBlur(field.id);
      };
      return (
        <div className="space-y-3">
          <ChoiceFieldset id={field.id} label={field.label} hint={field.hint ?? 'Pode marcar mais de uma.'} error={error} compact={options.every((o) => o.length <= 14)}>
            {options.map((o) => (
              <ChoiceOption key={o} name={field.id} type="checkbox" label={o} checked={selected.includes(o)} invalid={!!error} onChange={() => toggle(o)} />
            ))}
          </ChoiceFieldset>
          {field.other && selected.includes(OUTRO) && <OtherText {...props} />}
        </div>
      );
    }
    case 'grid':
      return (
        <fieldset id={field.id} tabIndex={-1} className="min-w-0 outline-none" aria-describedby={error ? `${field.id}-error` : undefined}>
          <legend className="mb-3 text-sm font-semibold">{field.label}</legend>
          <ul className="divide-y divide-fg/10 rounded-2xl border-2 border-fg/15 bg-surface">
            {(field.rows ?? []).map((r) => {
              const id = `${field.id}:${r}`;
              const current = text(values, id);
              return (
                <li key={r} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold">{r}</span>
                  <div role="radiogroup" aria-label={r} className="grid grid-cols-3 gap-1.5 sm:w-[26rem]">
                    {(field.options ?? []).map((o) => (
                      <label
                        key={o}
                        className={clsx(
                          'flex min-h-10 items-center justify-center rounded-lg border-2 px-2 text-center text-xs leading-tight font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring sm:text-sm',
                          current === o ? 'border-primary bg-primary text-on-primary' : 'border-fg/20 hover:border-fg',
                        )}
                      >
                        <input
                          type="radio"
                          name={id}
                          className="sr-only"
                          checked={current === o}
                          onChange={() => {
                            onChange(id, o);
                            onBlur(field.id);
                          }}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <FieldError id={field.id} message={error} />
        </fieldset>
      );
    case 'consent':
      return (
        <div>
          <label
            className={clsx(
              'flex items-start gap-3 rounded-2xl border-2 bg-surface p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring',
              error ? 'border-danger' : value === 'sim' ? 'border-primary' : 'border-fg/25',
            )}
          >
            <input
              id={field.id}
              type="checkbox"
              checked={value === 'sim'}
              onChange={(e) => {
                onChange(field.id, e.target.checked ? 'sim' : '');
                onBlur(field.id);
              }}
              aria-describedby={error ? `${field.id}-error` : undefined}
              className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
            />
            <span className="leading-relaxed">{field.label}</span>
          </label>
          <FieldError id={field.id} message={error} />
        </div>
      );
    default:
      return <TextField {...common} onChange={(v) => onChange(field.id, v)} />;
  }
}
