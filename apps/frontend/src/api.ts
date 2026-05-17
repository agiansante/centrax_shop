const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface Campaign {
  id: string;
  query: string;
  userRequest?: string | null;
  searchPrompt?: string | null;
  outputSchema?: Record<string, unknown> | null;
  approvedResearchPlan?: ResearchExecutionPlan | null;
  country?: string;
  language?: string;
  depth: number;
  maxResults: number;
  status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progressStep?: string;
  progressMessage?: string;
  currentAnalyzedUrl?: string | null;
  discoveredCount: number;
  rawResultCount: number;
  uniqueResultCount: number;
  analyzedCount: number;
  qualifiedCount: number;
  rejectedCount: number;
  failedCount: number;
  agentPlanStatus?: string | null;
  agentStopReason?: string | null;
  agentProviderSummary?: Record<string, unknown> | null;
  agentToolSummary?: Record<string, unknown> | null;
  agentFinalOutput?: Record<string, unknown> | null;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string;
  createdAt: string;
  _count?: { discoveredSites: number };
}

export interface AgentRunLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  step: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ResearchExecutionPlan {
  status: 'fallback' | 'ai_planned';
  userRequest: string;
  goal: string;
  entityType: string;
  searchPrompt: string;
  optimizedQueries: string[];
  requiredSignals: string[];
  negativeSignals: string[];
  blockedDomains: string[];
  allowedSourceTypes: string[];
  outputSchema: Record<string, unknown>;
  tools: string[];
  strategy: string;
  warnings: string[];
  aiGenerated: boolean;
}

export interface CampaignPlanPreview {
  plan: ResearchExecutionPlan;
  summary: {
    goal: string;
    entityType: string;
    importantSignals: string[];
    negativeSignals: string[];
    blockedDomains: string[];
    outputSchema: Record<string, unknown>;
    tools: string[];
    strategy: string;
    warnings: string[];
    aiGenerated: boolean;
  };
}

export interface ResearchConfiguration {
  search: {
    selectedProvider: string;
    isMockMode: boolean;
    configuredProviders: Record<string, boolean>;
  };
  ai: {
    selectedProvider: string;
    selectedModel: string;
    configuredProviders: Record<string, boolean>;
    fallbackMode: boolean;
  };
  tools: Array<{
    name: string;
    description: string;
    configured: boolean;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
  }>;
  limits: {
    normalUserSearchProviders: number;
    premiumUserSearchProviders: number;
  };
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
function createCampaign(payload: {
  userRequest: string;
  approvedResearchPlan?: ResearchExecutionPlan;
  country?: string;
  language?: string;
  depth: number;
  maxResults: number;
}) {
  return request<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(payload) });
}

/**
 * Prepara il piano ricerca prima di creare una campagna.
 *
 * Usata da:
 * - apps/frontend/src/ui/DashboardPage.tsx
 *
 * Riceve richiesta libera, limiti e possibile revisione del piano.
 */
function previewCampaignPlan(payload: {
  userRequest: string;
  currentPlan?: ResearchExecutionPlan;
  revisionRequest?: string;
  depth: number;
  maxResults: number;
}) {
  return request<CampaignPlanPreview>('/campaigns/preview-plan', { method: 'POST', body: JSON.stringify(payload) });
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
 * Carica i log agente di una campagna.
 *
 * Usata da:
 * - apps/frontend/src/ui/DashboardPage.tsx
 *
 * Riceve id campagna e restituisce eventi ordinati per il terminale live.
 */
function loadCampaignAgentLogs(id: string) {
  return request<AgentRunLog[]>(`/campaigns/${id}/agent-logs`);
}

/**
 * Carica configurazione ricerca e AI senza segreti.
 *
 * Usata da:
 * - apps/frontend/src/ui/ConfigurationPage.tsx
 */
function loadResearchConfiguration() {
  return request<ResearchConfiguration>('/research-configuration');
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
  previewCampaignPlan,
  createCampaign,
  runCampaign,
  campaignAgentLogs: loadCampaignAgentLogs,
  campaignResults: loadCampaignResults,
  service: loadServiceProfile,
  reanalyze: reanalyzeServiceProfile,
  researchConfiguration: loadResearchConfiguration
};
