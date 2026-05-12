const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface Campaign {
  id: string;
  query: string;
  country?: string;
  language?: string;
  depth: number;
  maxResults: number;
  status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progressStep?: string;
  progressMessage?: string;
  discoveredCount: number;
  analyzedCount: number;
  failedCount: number;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string;
  createdAt: string;
  _count?: { discoveredSites: number };
}

export interface ServiceProfile {
  id: string;
  name: string;
  description: string;
  categories: string[];
  supportedCountries: string[];
  shopifyEvidence?: string | null;
  pricingSummary?: string | null;
  docsUrl?: string | null;
  confidenceScore: number;
  pros: string[];
  cons: string[];
  evidenceItems?: EvidenceItem[];
  site?: DiscoveredSite;
}

export interface EvidenceItem {
  id: string;
  type: string;
  url: string;
  snippet: string;
}

export interface DiscoveredSite {
  id: string;
  url: string;
  domain: string;
  source: string;
  status: string;
  title?: string;
  snippet?: string;
  profile?: ServiceProfile | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Chiama l'endpoint di login del backend.
 *
 * Usata da:
 * - apps/frontend/src/ui/LoginPage.tsx
 *
 * Riceve email e password dal form e restituisce token piu utente.
 */
function loginUser(email: string, password: string) {
  return request<{ accessToken: string; user: { email: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

/**
 * Chiama l'endpoint di registrazione del backend.
 *
 * Usata da:
 * - apps/frontend/src/ui/LoginPage.tsx
 *
 * Riceve email e password dal form e restituisce token piu utente.
 */
function registerUser(email: string, password: string) {
  return request<{ accessToken: string; user: { email: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

/**
 * Carica tutte le campagne visibili all'utente autenticato.
 *
 * Usata da:
 * - apps/frontend/src/ui/DashboardPage.tsx
 */
function loadCampaigns() {
  return request<Campaign[]>('/campaigns');
}

/**
 * Crea una nuova campagna di ricerca nel backend.
 *
 * Usata da:
 * - apps/frontend/src/ui/DashboardPage.tsx
 *
 * Riceve query, paese opzionale, lingua e profondita crawl.
 */
function createCampaign(payload: { query: string; country?: string; language?: string; depth: number; maxResults: number }) {
  return request<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(payload) });
}

/**
 * Avvia una campagna gia creata inserendola nella coda backend.
 *
 * Usata da:
 * - apps/frontend/src/ui/DashboardPage.tsx
 *
 * Riceve l'id campagna selezionata.
 */
function runCampaign(id: string) {
  return request<Campaign>(`/campaigns/${id}/run`, { method: 'POST' });
}

/**
 * Carica i risultati analizzati di una campagna.
 *
 * Usata da:
 * - apps/frontend/src/ui/CampaignDetailPage.tsx
 *
 * Riceve l'id campagna dalla route.
 */
function loadCampaignResults(id: string) {
  return request<DiscoveredSite[]>(`/campaigns/${id}/results`);
}

/**
 * Carica il dettaglio completo di un servizio analizzato.
 *
 * Usata da:
 * - apps/frontend/src/ui/ServiceDetailPage.tsx
 *
 * Riceve l'id profilo servizio dalla route.
 */
function loadServiceProfile(id: string) {
  return request<ServiceProfile>(`/services/${id}`);
}

/**
 * Richiede al backend una nuova analisi di un servizio.
 *
 * Usata da:
 * - apps/frontend/src/ui/ServiceDetailPage.tsx
 *
 * Riceve l'id profilo servizio da rianalizzare.
 */
function reanalyzeServiceProfile(id: string) {
  return request<ServiceProfile>(`/services/${id}/reanalyze`, { method: 'POST' });
}

export const api = {
  login: loginUser,
  register: registerUser,
  campaigns: loadCampaigns,
  createCampaign,
  runCampaign,
  campaignResults: loadCampaignResults,
  service: loadServiceProfile,
  reanalyze: reanalyzeServiceProfile
};
