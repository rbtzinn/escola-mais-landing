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
  { value: 'secretario', label: 'Secretário(a) de Educação' },
  { value: 'diretor', label: 'Diretor(a) de escola' },
  { value: 'coordenador', label: 'Coordenador(a) pedagógico(a)' },
  { value: 'tecnico', label: 'Técnico(a) da secretaria' },
  { value: 'outro', label: 'Outro' },
];

export const PORTES: Option[] = [
  { value: 'pequena', label: 'Pequena (até 20 escolas)' },
  { value: 'media', label: 'Média (21 a 100 escolas)' },
  { value: 'grande', label: 'Grande (101 a 500 escolas)' },
  { value: 'muito-grande', label: 'Muito grande (mais de 500 escolas)' },
];
