ALTER TABLE "SearchCampaign" ADD COLUMN "maxResults" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "SearchCampaign" ADD COLUMN "progressStep" TEXT DEFAULT 'draft';
ALTER TABLE "SearchCampaign" ADD COLUMN "progressMessage" TEXT;
ALTER TABLE "SearchCampaign" ADD COLUMN "discoveredCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SearchCampaign" ADD COLUMN "analyzedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SearchCampaign" ADD COLUMN "failedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SearchCampaign" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "SearchCampaign" ADD COLUMN "completedAt" TIMESTAMP(3);
