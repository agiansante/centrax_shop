import { Injectable } from '@nestjs/common';
import { EvidenceType, SiteStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { CrawlerService } from './crawler.service';
import { DiscoveryService } from './discovery.service';
import { RulesService } from './rules.service';
import { extractComparableDomain, normalizeUrlForStorage } from './url-normalization.utils';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoveryService,
    private readonly crawler: CrawlerService,
    private readonly rules: RulesService,
    private readonly ai: AiService
  ) {}

  /**
   * Esegue discovery, deduplica e analisi di tutti i siti di una campagna.
   *
   * Usata da:
   * - apps/backend/src/modules/workers/campaign.worker.ts
   *
   * Riceve l'id campagna dal job BullMQ.
   */
  async runCampaign(campaignId: string) {
    const campaign = await this.prisma.searchCampaign.findUniqueOrThrow({ where: { id: campaignId } });
    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        progressStep: 'discovery',
        progressMessage: 'Ricerca siti in corso tramite provider configurato.'
      }
    });

    const results = await this.discovery.search(campaign.query, campaign.country ?? undefined, campaign.maxResults);

    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        discoveredCount: results.length,
        progressStep: 'analysis',
        progressMessage: `Trovati ${results.length} siti. Analisi e crawling in corso.`
      }
    });

    for (const result of results) {
      try {
        const url = normalizeUrlForStorage(result.url);
        const domain = extractComparableDomain(url);
        const site = await this.prisma.discoveredSite.upsert({
          where: { campaignId_domain: { campaignId, domain } },
          update: { url, title: result.title, snippet: result.snippet, source: result.source },
          create: { campaignId, url, domain, title: result.title, snippet: result.snippet, source: result.source }
        });

        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: { progressMessage: `Analisi sito ${domain} in corso.` }
        });

        await this.analyzeSite(site.id, campaign.depth);

        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: { analyzedCount: { increment: 1 } }
        });
      } catch {
        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } }
        });
      }
    }
  }

  /**
   * Esegue crawling, regole locali e analisi AI per un singolo sito.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   * - apps/backend/src/modules/services/services.service.ts
   *
   * Riceve id sito e profondita massima di crawling.
   */
  async analyzeSite(siteId: string, depth = 2) {
    const site = await this.prisma.discoveredSite.findUniqueOrThrow({ where: { id: siteId } });
    const pages = await this.crawler.crawl(site.url, depth);
    const evidence = pages.flatMap((page) => this.rules.extract(page.text, page.url));
    const aiProfile = await this.ai.analyze(site.domain, pages[0]?.title ?? site.title ?? undefined, evidence);

    const profile = await this.prisma.serviceProfile.upsert({
      where: { siteId },
      update: {
        name: aiProfile.name,
        description: aiProfile.description,
        categories: aiProfile.categories,
        supportedCountries: aiProfile.supportedCountries,
        shopifyEvidence: aiProfile.shopifyEvidence,
        pricingSummary: aiProfile.pricingSummary,
        docsUrl: aiProfile.docsUrl,
        confidenceScore: aiProfile.confidenceScore,
        pros: aiProfile.pros,
        cons: aiProfile.cons
      },
      create: {
        siteId,
        name: aiProfile.name,
        description: aiProfile.description,
        categories: aiProfile.categories,
        supportedCountries: aiProfile.supportedCountries,
        shopifyEvidence: aiProfile.shopifyEvidence,
        pricingSummary: aiProfile.pricingSummary,
        docsUrl: aiProfile.docsUrl,
        confidenceScore: aiProfile.confidenceScore,
        pros: aiProfile.pros,
        cons: aiProfile.cons
      }
    });

    await this.prisma.evidenceItem.deleteMany({ where: { profileId: profile.id } });
    if (evidence.length > 0) {
      await this.prisma.evidenceItem.createMany({
        data: evidence.map((item) => ({
          profileId: profile.id,
          type: item.type as EvidenceType,
          url: item.url,
          snippet: item.snippet
        }))
      });
    }
    await this.prisma.analysisRun.create({
      data: { profileId: profile.id, model: this.ai.modelName(), promptVersion: 'v1', status: 'completed' }
    });
    await this.prisma.discoveredSite.update({ where: { id: siteId }, data: { status: SiteStatus.ANALYZED } });
    return profile;
  }
}
