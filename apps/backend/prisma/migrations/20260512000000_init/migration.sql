CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "SiteStatus" AS ENUM ('DISCOVERED', 'CRAWLED', 'ANALYZED', 'FAILED');
CREATE TYPE "EvidenceType" AS ENUM ('SHOPIFY', 'PRICING', 'DOCUMENTATION', 'DROPSHIPPING', 'FULFILLMENT', 'GENERAL');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchCampaign" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "country" TEXT,
  "language" TEXT DEFAULT 'it',
  "depth" INTEGER NOT NULL DEFAULT 2,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerId" TEXT NOT NULL,
  CONSTRAINT "SearchCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscoveredSite" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" "SiteStatus" NOT NULL DEFAULT 'DISCOVERED',
  "title" TEXT,
  "snippet" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "campaignId" TEXT NOT NULL,
  CONSTRAINT "DiscoveredSite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "categories" TEXT[],
  "supportedCountries" TEXT[],
  "shopifyEvidence" TEXT,
  "pricingSummary" TEXT,
  "docsUrl" TEXT,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pros" TEXT[],
  "cons" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "ServiceProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceItem" (
  "id" TEXT NOT NULL,
  "type" "EvidenceType" NOT NULL,
  "url" TEXT NOT NULL,
  "snippet" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "profileId" TEXT NOT NULL,
  CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalysisRun" (
  "id" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "profileId" TEXT NOT NULL,
  CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "DiscoveredSite_campaignId_domain_key" ON "DiscoveredSite"("campaignId", "domain");
CREATE UNIQUE INDEX "ServiceProfile_siteId_key" ON "ServiceProfile"("siteId");

ALTER TABLE "SearchCampaign" ADD CONSTRAINT "SearchCampaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DiscoveredSite" ADD CONSTRAINT "DiscoveredSite_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SearchCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceProfile" ADD CONSTRAINT "ServiceProfile_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "DiscoveredSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ServiceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ServiceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
