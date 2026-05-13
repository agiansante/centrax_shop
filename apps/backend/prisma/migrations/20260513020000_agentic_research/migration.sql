-- Campi campagna necessari per il cervello ricerca agentico.
ALTER TABLE "SearchCampaign"
ADD COLUMN "searchPrompt" TEXT,
ADD COLUMN "outputSchema" JSONB,
ADD COLUMN "rawResultCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "uniqueResultCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rejectedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "agentPlanStatus" TEXT,
ADD COLUMN "agentStopReason" TEXT,
ADD COLUMN "agentProviderSummary" JSONB,
ADD COLUMN "agentToolSummary" JSONB,
ADD COLUMN "agentFinalOutput" JSONB;

-- Log leggibili mostrati nel terminale agente del frontend.
CREATE TABLE "AgentRunLog" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'info',
  "step" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgentRunLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentRunLog_campaignId_createdAt_idx" ON "AgentRunLog"("campaignId", "createdAt");

ALTER TABLE "AgentRunLog"
ADD CONSTRAINT "AgentRunLog_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "SearchCampaign"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
