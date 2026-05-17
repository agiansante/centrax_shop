const API_URL = process.env.CENTRAX_API_URL ?? 'http://localhost:3000';
const EMAIL = process.env.CENTRAX_TEST_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.CENTRAX_TEST_PASSWORD ?? 'change-me-please';
const DEFAULT_REQUEST =
  'Trova siti che offrono servizi di drop shiping che bbaiano una integrazione forte con shopify, dammi un riepilogo con url, nome, descrizione, integrazione con shopify presente, descrizione integrazione con shopify, prezzi, tipologie di prodotti, valutazione recensioni e score';

const userRequest = process.argv.slice(2).join(' ').trim() || DEFAULT_REQUEST;

async function main() {
  const auth = await loginOrRegister();
  const headers = {
    authorization: `Bearer ${auth.accessToken}`,
    'content-type': 'application/json'
  };

  const preview = await request('/campaigns/preview-plan', {
    method: 'POST',
    headers,
    body: JSON.stringify({ userRequest, depth: 2, maxResults: 10 })
  });
  const campaign = await request('/campaigns', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userRequest,
      approvedResearchPlan: preview.plan,
      language: 'it',
      depth: 2,
      maxResults: 10
    })
  });

  await request(`/campaigns/${campaign.id}/run`, { method: 'POST', headers });
  const completedCampaign = await waitForCampaign(headers, campaign.id);
  const logs = await request(`/campaigns/${campaign.id}/agent-logs`, { headers });
  const results = await request(`/campaigns/${campaign.id}/results`, { headers });
  const evaluation = evaluateFinalOutput(completedCampaign.agentFinalOutput);

  const report = {
    campaignId: campaign.id,
    userRequest,
    status: completedCampaign.status,
    counts: {
      rawResultCount: completedCampaign.rawResultCount,
      uniqueResultCount: completedCampaign.uniqueResultCount,
      analyzedCount: completedCampaign.analyzedCount,
      qualifiedCount: completedCampaign.qualifiedCount,
      rejectedCount: completedCampaign.rejectedCount,
      failedCount: completedCampaign.failedCount
    },
    stopReason: completedCampaign.agentStopReason,
    approvedResearchPlan: completedCampaign.approvedResearchPlan,
    agentFinalOutput: completedCampaign.agentFinalOutput,
    usefulCount: evaluation.usefulCount,
    evaluatedCount: evaluation.evaluatedCount,
    usefulRate: evaluation.usefulRate,
    passed70: evaluation.usefulRate >= 0.7,
    agentLogs: logs,
    discoveredSites: results
  };

  console.log(JSON.stringify(report, null, 2));
}

async function loginOrRegister() {
  const body = JSON.stringify({ email: EMAIL, password: PASSWORD });
  try {
    return await request('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  } catch {
    return request('/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  }
}

async function waitForCampaign(headers, campaignId) {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    await sleep(2000);
    const campaigns = await request('/campaigns', { headers });
    const campaign = campaigns.find((item) => item.id === campaignId);
    if (campaign?.status === 'COMPLETED' || campaign?.status === 'FAILED') {
      return campaign;
    }
  }

  throw new Error(`Timeout attesa campagna ${campaignId}`);
}

function evaluateFinalOutput(agentFinalOutput) {
  const results = Array.isArray(agentFinalOutput?.results) ? agentFinalOutput.results : [];
  const evaluated = results.map((result) => ({
    result,
    useful: isUsefulShopifyDropshippingResult(result)
  }));
  const usefulCount = evaluated.filter((item) => item.useful).length;
  const evaluatedCount = evaluated.length;

  return {
    usefulCount,
    evaluatedCount,
    usefulRate: evaluatedCount === 0 ? 0 : usefulCount / evaluatedCount
  };
}

function isUsefulShopifyDropshippingResult(result) {
  const text = JSON.stringify(result).toLowerCase();
  const sourceType = String(result.sourceType ?? '').toLowerCase();
  const hasShopify = text.includes('shopify');
  const hasDropshipping = text.includes('dropship') || text.includes('drop ship');
  const hasIntegration = text.includes('integration') || text.includes('integrazione') || text.includes('integrat');
  const isBadSourceType = ['forum_social', 'media_page', 'non_operational'].includes(sourceType);

  return hasShopify && hasDropshipping && hasIntegration && !isBadSourceType;
}

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.text();
  const parsedBody = body ? JSON.parse(body) : null;

  if (!response.ok) {
    throw new Error(parsedBody?.message ?? `HTTP ${response.status} ${path}`);
  }

  return parsedBody;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
