import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { Worker } from 'bullmq';
import { AnalysisService } from '../analysis/analysis.service';
import { PrismaService } from '../prisma/prisma.service';
import { CAMPAIGN_QUEUE, CampaignQueueService, RUN_CAMPAIGN_JOB } from '../queue/queue.service';

@Injectable()
export class CampaignWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignWorker.name);
  private worker?: Worker;

  constructor(
    private readonly queue: CampaignQueueService,
    private readonly prisma: PrismaService,
    private readonly analysis: AnalysisService
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      CAMPAIGN_QUEUE,
      async (job) => {
        if (job.name !== RUN_CAMPAIGN_JOB) {
          return;
        }
        await this.runCampaign(job.data.campaignId as string);
      },
      { connection: this.queue.connection }
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Campaign job ${job?.id} failed: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async runCampaign(campaignId: string) {
    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.RUNNING,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        progressStep: 'running',
        progressMessage: 'Worker avviato. Preparazione analisi campagna.',
        currentAnalyzedUrl: null
      }
    });

    try {
      await this.analysis.runCampaign(campaignId);
      const campaignAfterAnalysis = await this.prisma.searchCampaign.findUnique({ where: { id: campaignId } });
      const completedMessage = campaignAfterAnalysis?.agentStopReason
        ? `Campagna completata. ${campaignAfterAnalysis.agentStopReason}`
        : 'Campagna completata. I risultati sono disponibili.';
      await this.prisma.searchCampaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
          progressStep: 'completed',
          progressMessage: completedMessage,
          currentAnalyzedUrl: null
        }
      });
    } catch (error) {
      await this.prisma.searchCampaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.FAILED,
          completedAt: new Date(),
          progressStep: 'failed',
          progressMessage: 'Campagna terminata con errore.',
          currentAnalyzedUrl: null,
          error: error instanceof Error ? error.message : 'Unknown campaign error'
        }
      });
      throw error;
    }
  }
}
