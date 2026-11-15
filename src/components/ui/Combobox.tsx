'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { normalizeText, shouldOpenUp } from '@/lib/text';
import { FieldError, FieldLabel, fieldClasses } from './Field';
import type { Option } from './Listbox';
import { PickerPanel } from './PickerPanel';

interface Props {
  id: string;
  name: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  error?: string;
}

/**
 * Dropdown com busca (combobox com lista, padrão WAI-ARIA).
 * A busca ignora acentos e maiúsculas e casa com o rótulo e com o valor (ex.: "PE").
 * Em celulares (< 640 px) o campo vira um botão que abre um painel central com a busca.
 */
export function Combobox({
  id,
  name,
  label,
  options,
  value,
  onChange,
  placeholder = 'Digite para buscar',
  emptyText = 'Nenhum resultado encontrado',
  error,
}: Props) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = não está editando
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = `${id}-list`;
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = normalizeText(query ?? '');
    if (!q) return options;
    return options.filter(
      (o) => normalizeText(o.label).includes(q) || normalizeText(o.value) === q,
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery(null);
  };
  useClickOutside(root, close, open && !mobile);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);

  const openList = () => {
    if (input.current) setOpenUp(shouldOpenUp(input.current));
    setOpen(true);
  };

  const openPanel = () => {
    setQuery('');
    setActive(0);
    setOpen(true);
  };

  const choose = (i: number) => {
    const opt = filtered[i];
    if (!opt) return;
    onChange(opt.value);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        openList();
        setActive(0);
      } else setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Home' && open) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End' && open) {
      e.preventDefault();
      setActive(Math.max(filtered.length - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
    }
  };

  const optionItems = (
    <>
      {filtered.length === 0 && (
        <li role="presentation" className="px-3 py-3 text-base text-fg-muted">
          {emptyText}
        </li>
      )}
      {filtered.map((o, i) => (
        <li
          key={o.value}
          id={`${id}-opt-${i}`}
          role="option"
          aria-selected={o.value === value}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setActive(i)}
          onClick={() => choose(i)}
          className={clsx(
            'flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-base',
            i === active && 'bg-muted',
            o.value === value && 'font-semibold text-primary',
          )}
        >
          {o.label}
          {o.value === value && <Icon name="check" size={18} />}
        </li>
      ))}
    </>
  );

  return (
    <div
      ref={root}
      onBlur={(e) => {
        if (mobile) return; // o foco vai para o painel (portal)
        if (!root.current?.contains(e.relatedTarget as Node)) close();
      }}
    >
      <FieldLabel id={id}>{label}</FieldLabel>
      <input type="hidden" name={name} value={value} />
      {mobile ? (
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}`}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={openPanel}
          className={clsx(
            fieldClasses(!!error),
            'flex items-center justify-between gap-3 text-left',
          )}
        >
          <span className={clsx(!selected && 'text-fg-muted')}>
            {selected?.label ?? placeholder}
          </span>
          <Icon name="search" size={20} className="shrink-0 text-fg-muted" />
        </button>
      ) : (
        <div className="relative">
          <input
            ref={input}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            placeholder={placeholder}
            value={query ?? selected?.label ?? ''}
            onFocus={() => !open && openList()}
            onClick={() => !open && openList()}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              if (!open) openList();
            }}
            onKeyDown={onKeyDown}
            className={clsx(fieldClasses(!!error), 'pr-11')}
          />
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-fg-muted"
          />
          {open && !mobile && (
            <ul
              id={listId}
              role="listbox"
              aria-labelledby={`${id}-label`}
              className={clsx(
                'fade-in absolute z-30 max-h-64 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-card',
                openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
              )}
            >
              {optionItems}
            </ul>
          )}
        </div>
      )}
      {open && mobile && (
        <PickerPanel title={label} align="top" initialFocus="input" onClose={close}>
          <div className="px-4 pb-2">
            <input
              type="text"
              role="combobox"
              autoComplete="off"
              aria-label={`Buscar ${label}`}
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
              placeholder={placeholder}
              value={query ?? ''}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className={fieldClasses(false)}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="overflow-auto px-2"
          >
            {optionItems}
          </ul>
        </PickerPanel>
      )}
      <FieldError id={id} message={error} />
    </div>
  );
}
