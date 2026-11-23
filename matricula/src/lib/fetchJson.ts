/** fetch com tempo-limite: em internet ruim, desiste em `ms` e deixa a pessoa digitar à mão. */
export async function fetchJson<T>(url: string, ms = 5000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
