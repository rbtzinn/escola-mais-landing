import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Listbox } from '@/components/ui/Listbox';

const options = [
  { value: 'a', label: 'Alfa' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gama' },
];

function Harness() {
  const [v, setV] = useState('');
  return <Listbox id="x" name="x" label="Letra" options={options} value={v} onChange={setV} />;
}

describe('Listbox', () => {
  it('abre com Enter, navega com setas e seleciona', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('combobox', { name: /Letra/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(trigger).toHaveTextContent('Beta');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('fecha com Esc sem alterar o valor', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Selecione');
  });

  it('seleciona por clique e marca aria-selected', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Gama' }));
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Gama' })).toHaveAttribute('aria-selected', 'true');
  });

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button>fora</button>
      </>,
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'fora' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
