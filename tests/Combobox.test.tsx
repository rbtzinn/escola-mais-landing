import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Combobox } from '@/components/ui/Combobox';
import { UFS } from '@/data/options';
import { mockMobile } from './helpers';

function Harness() {
  const [v, setV] = useState('');
  return (
    <Combobox
      id="uf"
      name="uf"
      label="UF"
      options={UFS}
      value={v}
      onChange={setV}
      emptyText="Nenhuma UF encontrada"
    />
  );
}

describe('Combobox', () => {
  it('filtra por nome ignorando acentos e seleciona com Enter', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'UF' });
    await user.type(input, 'sao pa');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('SP — São Paulo');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('encontra pela sigla', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('combobox'), 'pe');
    expect(screen.getByRole('option', { name: /Pernambuco/ })).toBeInTheDocument();
  });

  it('mostra mensagem quando não há resultado', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('Nenhuma UF encontrada')).toBeInTheDocument();
  });

  it('Esc fecha a lista e restaura o valor selecionado', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'pern{Enter}');
    await user.clear(input);
    await user.type(input, 'xx{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('PE — Pernambuco');
  });
});

describe('Combobox no celular', () => {
  beforeEach(() => mockMobile());

  it('abre painel com busca, filtra e seleciona', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: /UF/ });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'UF' });
    expect(dialog).toBeInTheDocument();
    const search = screen.getByRole('combobox', { name: 'Buscar UF' });
    expect(search).toHaveFocus();
    await user.type(search, 'pern');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('PE — Pernambuco');
  });

  it('mostra mensagem sem resultado e fecha pelo X sem escolher', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: /UF/ });
    await user.click(trigger);
    await user.type(screen.getByRole('combobox', { name: 'Buscar UF' }), 'zzz');
    expect(screen.getByText('Nenhuma UF encontrada')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).not.toHaveTextContent('—');
  });
});
