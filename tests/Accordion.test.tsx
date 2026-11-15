import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion } from '@/components/ui/Accordion';

const items = [
  { id: 'a', question: 'Pergunta A', answer: 'Resposta A' },
  { id: 'b', question: 'Pergunta B', answer: 'Resposta B' },
];

describe('Accordion', () => {
  it('abre e fecha com clique, atualizando aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const btn = screen.getByRole('button', { name: 'Pergunta A' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('mantém só um item aberto por vez', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByRole('button', { name: 'Pergunta A' }));
    await user.click(screen.getByRole('button', { name: 'Pergunta B' }));
    expect(screen.getByRole('button', { name: 'Pergunta A' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Pergunta B' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('navega com setas, Home e End', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    screen.getByRole('button', { name: 'Pergunta A' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Pergunta B' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Pergunta A' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Pergunta B' })).toHaveFocus();
  });
});
