import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DemoSample } from '@/components/sections/DemoSample';
import { demoStore } from '@/lib/demoStore';

describe('DemoSample (amostra da demo na landing)', () => {
  it('abre no painel da escola de exemplo e troca a turma selecionada', async () => {
    const user = userEvent.setup();
    render(<DemoSample />);
    expect(screen.getByRole('tab', { name: /Painel da planilha/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText(/alunos precisam de atenção/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /6º A/ }));
    expect(screen.getByRole('region', { name: 'Turma 6º A' })).toHaveTextContent(
      'Nenhum aluno em risco nesta turma.',
    );
  });

  it('leva o atraso registrado no celular até a coordenação, sem tocar no estado da demo', async () => {
    const user = userEvent.setup();
    render(<DemoSample />);

    await user.click(screen.getByRole('tab', { name: /QR da entrada/ }));
    const panel = screen.getByRole('tabpanel');
    await user.click(within(panel).getAllByRole('button')[0]);
    await user.click(within(panel).getByRole('button', { name: 'Registrar chegada atrasada' }));
    expect(within(panel).getByText(/Chegada registrada às 7h12/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Merenda e avisos/ }));
    await user.click(screen.getByRole('button', { name: /Avisar a família/ }));
    expect(screen.getByText('Aviso enviado')).toBeInTheDocument();
    expect(screen.getByText(/Aqui é da coordenação da escola/)).toBeInTheDocument();

    // A /demo continua começando pelo envio da planilha.
    expect(demoStore.get().school).toBeNull();
    expect(demoStore.get().records).toHaveLength(0);
  });

  it('desconta da merenda quem faltou na chamada e navega pelas abas com as setas', async () => {
    const user = userEvent.setup();
    render(<DemoSample />);

    await user.click(screen.getByRole('tab', { name: /Merenda e avisos/ }));
    const total = () => Number(screen.getByText('refeições').previousElementSibling?.textContent);
    const antes = total();

    screen.getByRole('tab', { name: /Merenda e avisos/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /Chamada e horário/ })).toHaveFocus();
    await user.click(screen.getAllByRole('button', { name: 'Presente' })[0]);

    await user.click(screen.getByRole('tab', { name: /Merenda e avisos/ }));
    expect(total()).toBe(antes - 1);
  });
});
