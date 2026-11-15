import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Modal } from '@/components/ui/Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Título">
        <a href="#x">Link interno</a>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('abre como diálogo, prende o foco e devolve ao fechar com Esc', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Título' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');

    // Tab circula só dentro do modal: botão Fechar -> link -> volta ao Fechar.
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Link interno' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });
});
