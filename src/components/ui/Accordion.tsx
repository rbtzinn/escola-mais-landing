'use client';

import clsx from 'clsx';
import { useId, useRef, useState } from 'react';
import { Icon } from '@/components/icons';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

/** Acordeão acessível: botões com aria-expanded e navegação por ↑ ↓ Home End. */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const uid = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = items.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowUp') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next !== null) {
      e.preventDefault();
      buttons.current[next]?.focus();
    }
  };

  return (
    <div className="divide-y divide-fg/20 border-y border-fg">
      {items.map((item, i) => {
        const open = openId === item.id;
        const btnId = `${uid}-btn-${item.id}`;
        const panelId = `${uid}-panel-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                id={btnId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="group flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left font-display text-xl font-medium sm:text-2xl"
              >
                <span className="decoration-accent decoration-2 underline-offset-4 group-hover:underline">
                  {item.question}
                </span>
                {/* Um "+" que gira e vira "×" ao abrir. */}
                <Icon
                  name="close"
                  size={22}
                  className={clsx(
                    'shrink-0 text-primary transition-transform',
                    !open && 'rotate-45',
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={clsx(
                'grid transition-[grid-template-rows] duration-300 ease-out',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden" inert={!open}>
                <p className="max-w-2xl pb-6 text-lg leading-relaxed text-fg-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
