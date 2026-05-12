/**
 * Normalizza un URL per renderlo confrontabile e stabile nel database.
 *
 * Usata da:
 * - apps/backend/src/modules/analysis/analysis.service.ts
 * - apps/backend/src/modules/analysis/crawler.service.ts
 * - apps/backend/test/url-utils.test.ts
 *
 * Riceve una stringa che puo avere o non avere protocollo.
 * Restituisce un URL assoluto senza query string, hash e slash finali inutili.
 */
export function normalizeUrlForStorage(input: string): string {
  const urlWithProtocol = addHttpsProtocolWhenMissing(input);
  const url = new URL(urlWithProtocol);

  url.hash = '';
  url.search = '';
  url.pathname = removeTrailingSlashFromPath(url.pathname);

  return url.toString();
}

/**
 * Estrae il dominio usato per deduplicare i risultati di ricerca.
 *
 * Usata da:
 * - apps/backend/src/modules/analysis/analysis.service.ts
 * - apps/backend/src/modules/analysis/discovery.service.ts
 * - apps/backend/test/url-utils.test.ts
 *
 * Riceve un URL o dominio grezzo.
 * Restituisce hostname minuscolo senza prefisso `www.`.
 */
export function extractComparableDomain(input: string): string {
  const normalizedUrl = normalizeUrlForStorage(input);
  const hostname = new URL(normalizedUrl).hostname;

  return hostname.replace(/^www\./, '').toLowerCase();
}

/**
 * Deduplica una lista di oggetti che contengono una proprieta `url`.
 *
 * Usata da:
 * - apps/backend/src/modules/analysis/discovery.service.ts
 * - apps/backend/test/url-utils.test.ts
 *
 * Mantiene il primo elemento trovato per ogni dominio confrontabile.
 */
export function keepFirstItemForEachDomain<T extends { url: string }>(items: T[]): T[] {
  const alreadySeenDomains = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    const domain = extractComparableDomain(item.url);

    if (alreadySeenDomains.has(domain)) {
      continue;
    }

    alreadySeenDomains.add(domain);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

/**
 * Aggiunge `https://` quando l'input non contiene gia un protocollo HTTP.
 *
 * Usata da:
 * - normalizeUrlForStorage nello stesso file.
 */
function addHttpsProtocolWhenMissing(input: string): string {
  const alreadyHasHttpProtocol = /^https?:\/\//i.test(input);

  if (alreadyHasHttpProtocol) {
    return input;
  }

  return `https://${input}`;
}

/**
 * Rimuove gli slash finali dal path mantenendo `/` per la homepage.
 *
 * Usata da:
 * - normalizeUrlForStorage nello stesso file.
 */
function removeTrailingSlashFromPath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}
