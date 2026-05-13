import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { CampaignQueueModule } from '../queue/queue.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [CampaignQueueModule, AnalysisModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService]
})
export class CampaignsModule {}
