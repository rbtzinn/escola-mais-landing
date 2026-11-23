import { onlyDigits } from './cpf';
import { fetchJson } from './fetchJson';

export interface Endereco {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type CepResult =
  | { status: 'ok'; endereco: Endereco }
  | { status: 'nao-encontrado' }
  | { status: 'falha' };

interface ViaCep {
  erro?: boolean | string;
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}
interface BrasilApi {
  cep: string;
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

const fromViaCep = (v: ViaCep): Endereco => ({
  cep: v.cep,
  rua: v.logradouro ?? '',
  bairro: v.bairro ?? '',
  cidade: v.localidade,
  uf: v.uf,
});

/**
 * Busca o endereço pelo CEP no ViaCEP (gratuito); se ele falhar, tenta a BrasilAPI.
 * CEP de cidade pequena pode vir sem rua e bairro: a pessoa completa.
 */
export async function fetchCep(raw: string): Promise<CepResult> {
  const cep = onlyDigits(raw);
  if (cep.length !== 8) return { status: 'nao-encontrado' };
  try {
    const v = await fetchJson<ViaCep>(`https://viacep.com.br/ws/${cep}/json/`);
    if (v.erro) return { status: 'nao-encontrado' };
    return { status: 'ok', endereco: fromViaCep(v) };
  } catch {
    try {
      const b = await fetchJson<BrasilApi>(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      return {
        status: 'ok',
        endereco: { cep: raw, rua: b.street ?? '', bairro: b.neighborhood ?? '', cidade: b.city, uf: b.state },
      };
    } catch (e) {
      // A BrasilAPI responde 404 para CEP inexistente.
      return String(e).includes('404') ? { status: 'nao-encontrado' } : { status: 'falha' };
    }
  }
}

/** "Não sei meu CEP": busca pelo nome da rua dentro da cidade (o ViaCEP pede 3 letras ou mais). */
export async function searchStreet(uf: string, cidade: string, rua: string): Promise<Endereco[] | null> {
  if (!uf || !cidade || rua.trim().length < 3) return [];
  const path = [uf, cidade, rua.trim()].map(encodeURIComponent).join('/');
  try {
    const list = await fetchJson<ViaCep[]>(`https://viacep.com.br/ws/${path}/json/`);
    return Array.isArray(list) ? list.map(fromViaCep) : [];
  } catch {
    return null;
  }
}
