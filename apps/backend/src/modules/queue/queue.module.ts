import { Global, Module } from '@nestjs/common';
import { CampaignQueueService } from './queue.service';

@Global()
@Module({
  providers: [CampaignQueueService],
  exports: [CampaignQueueService]
})
export class CampaignQueueModule {}
