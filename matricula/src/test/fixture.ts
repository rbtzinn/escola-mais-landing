import { CONFIG } from '@/config';
import { buildSteps, type Values } from '@/lib/schema';

/** Uma matrícula completa e válida (dados fictícios), para testes que começam no fim. */
export function fullValues(): Values {
  const v: Values = {
    consentimento: 'sim',
    modalidade: 'Integrado',
    curso: 'Nutrição e Dietética',
    aluno_nome: 'Ana Souza Lima',
    aluno_nascimento: '15/03/2010',
    aluno_sexo: 'Feminino',
    aluno_cor: 'Parda',
    aluno_cpf: '529.982.247-25',
    aluno_rg: '1234567',
    aluno_rg_orgao: 'SDS-PE',
    aluno_rg_uf: 'PE',
    aluno_rg_data: '10/01/2020',
    nasc_pais: 'Brasil',
    nasc_uf: 'PE',
    nasc_cidade: 'Recife',
    aluno_celular: '(81) 9 9999-0001',
    aluno_email: 'ana@gmail.com',
    end_cep: '50050-050',
    end_rua: 'Rua do Hospício',
    end_numero: '10',
    end_bairro: 'Boa Vista',
    end_uf: 'PE',
    end_cidade: 'Recife',
    saude_deficiencia: 'Não',
    saude_alergia: 'Não',
    saude_medicacao: 'Não',
    uniforme: 'M',
    mora_com: ['Mãe'],
    emerg_nome: 'Maria Souza',
    emerg_parentesco: 'mãe',
    emerg_telefone: '(81) 9 9999-0002',
    mae_situacao: 'Falecida',
    pai_situacao: 'Não consta na certidão',
    resp_quem: 'Outra pessoa',
    resp_nome: 'Maria Souza',
    resp_parentesco: 'Avó',
    resp_cpf: '111.444.777-35',
    resp_celular: '(81) 9 9999-0002',
    resp_escolaridade: 'Médio completo',
    resp_profissao: 'Cozinheira',
    fim_de_semana: 'Futebol',
    quer_ser: 'Nutricionista',
    superior: 'Sim',
    superior_area: 'Saúde',
  };
  // Perguntas socioculturais: primeira opção de cada uma.
  for (const s of buildSteps(CONFIG))
    for (const f of s.fields) {
      if (v[f.id] !== undefined) continue;
      if (f.kind === 'grid') for (const r of f.rows ?? []) v[`${f.id}:${r}`] = f.options![0];
      else if (f.kind === 'multi') v[f.id] = [f.options![0]];
      else if ((f.kind === 'choice' || f.kind === 'select') && s.id.startsWith('socio')) v[f.id] = f.options![0];
    }
  return v;
}
