import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const CAMPAIGN_QUEUE = 'campaign-analysis';
export const RUN_CAMPAIGN_JOB = 'run-campaign';

@Injectable()
export class CampaignQueueService implements OnModuleDestroy {
  readonly connection: IORedis;
  readonly queue: Queue;

  constructor(config: ConfigService) {
    this.connection = new IORedis({
      host: config.get<string>('REDIS_HOST') ?? 'localhost',
      port: config.get<number>('REDIS_PORT') ?? 6379,
      maxRetriesPerRequest: null
    });
    this.queue = new Queue(CAMPAIGN_QUEUE, { connection: this.connection });
  }

  enqueueCampaign(campaignId: string) {
    return this.queue.add(RUN_CAMPAIGN_JOB, { campaignId }, { removeOnComplete: 50, removeOnFail: 100 });
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
