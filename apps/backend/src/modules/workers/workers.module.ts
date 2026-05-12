import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { CampaignQueueModule } from '../queue/queue.module';
import { CampaignWorker } from './campaign.worker';

@Module({
  imports: [CampaignQueueModule, AnalysisModule],
  providers: [CampaignWorker]
})
export class WorkersModule {}
