import cidadesPe from './cidades-pe.json';
import { fetchJson } from './fetchJson';

export const UFS: { sigla: string; nome: string }[] = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'],
  ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'],
  ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'],
  ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
  ['SE', 'Sergipe'], ['TO', 'Tocantins'],
].map(([sigla, nome]) => ({ sigla, nome }));

const cache = new Map<string, string[]>([['PE', cidadesPe as string[]]]);

/**
 * Cidades de um estado, da API de localidades do IBGE (gratuita). Pernambuco já vem no site,
 * para funcionar mesmo sem internet boa. Devolve null se a API não respondeu.
 */
export async function fetchCities(uf: string): Promise<string[] | null> {
  const hit = cache.get(uf);
  if (hit) return hit;
  try {
    const key = `ibge:${uf}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const list = JSON.parse(saved) as string[];
      cache.set(uf, list);
      return list;
    }
  } catch {
    // sessionStorage indisponível: segue para a API.
  }
  try {
    const data = await fetchJson<{ nome: string }[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    );
    const list = data.map((m) => m.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    cache.set(uf, list);
    try {
      sessionStorage.setItem(`ibge:${uf}`, JSON.stringify(list));
    } catch {
      // sem cache persistente, tudo bem.
    }
    return list;
  } catch {
    return null;
  }
}

/** Só para testes. */
export const clearCitiesCache = () => {
  for (const k of [...cache.keys()]) if (k !== 'PE') cache.delete(k);
};
