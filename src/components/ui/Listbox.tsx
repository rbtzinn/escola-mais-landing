'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { useClickOutside } from '@/hooks/useClickOutside';
import { shouldOpenUp } from '@/lib/text';
import { FieldError, FieldLabel, fieldClasses } from './Field';

export interface Option {
  value: string;
  label: string;
}

interface Props {
  id: string;
  name: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

/**
 * Dropdown customizado (select-only combobox, padrão WAI-ARIA).
 * Teclado: Enter/Espaço/↓ abrem; ↑ ↓ Home End navegam; letras buscam; Esc fecha.
 */
export function Listbox({
  id,
  name,
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const typed = useRef({ text: '', timer: 0 });
  const listId = `${id}-list`;
  const selected = options.find((o) => o.value === value);

  useClickOutside(root, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);

  const openList = () => {
    if (trigger.current) setOpenUp(shouldOpenUp(trigger.current));
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(a + 1, last));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const t = typed.current;
          window.clearTimeout(t.timer);
          t.text += e.key.toLowerCase();
          t.timer = window.setTimeout(() => (t.text = ''), 500);
          const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
          if (hit >= 0) setActive(hit);
        }
    }
  };

  return (
    <div
      ref={root}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <FieldLabel id={id}>{label}</FieldLabel>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <button
          ref={trigger}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${id}-label ${id}`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className={clsx(
            fieldClasses(!!error),
            'flex items-center justify-between gap-3 text-left',
          )}
        >
          <span className={clsx(!selected && 'text-fg-muted')}>
            {selected?.label ?? placeholder}
          </span>
          <Icon
            name="chevron"
            size={20}
            className={clsx('shrink-0 transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            tabIndex={-1}
            className={clsx(
              'fade-in absolute z-30 max-h-64 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-card',
              openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            )}
          >
            {options.map((o, i) => (
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
          </ul>
        )}
      </div>
      <FieldError id={id} message={error} />
    </div>
  );
}
