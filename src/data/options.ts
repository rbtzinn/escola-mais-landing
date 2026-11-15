import type { Option } from '@/components/ui/Listbox';

const UF_DATA: [string, string][] = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
];

export const UFS: Option[] = UF_DATA.map(([sigla, nome]) => ({
  value: sigla,
  label: `${sigla} — ${nome}`,
}));

export const CARGOS: Option[] = [
  { value: 'diretor', label: 'Diretor(a)' },
  { value: 'vice-diretor', label: 'Vice-diretor(a)' },
  { value: 'coordenador', label: 'Coordenador(a) pedagógico(a)' },
  { value: 'secretario-escolar', label: 'Secretário(a) escolar' },
  { value: 'outro', label: 'Outro' },
];

export const TAMANHOS_ESCOLA: Option[] = [
  { value: 'ate-200', label: 'Até 200 alunos' },
  { value: '201-500', label: '201 a 500 alunos' },
  { value: '501-1000', label: '501 a 1.000 alunos' },
  { value: 'mais-1000', label: 'Mais de 1.000 alunos' },
];
