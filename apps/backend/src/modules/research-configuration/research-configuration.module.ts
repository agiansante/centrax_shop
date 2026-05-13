import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { ResearchConfigurationController } from './research-configuration.controller';
import { ResearchConfigurationService } from './research-configuration.service';

@Module({
  imports: [AnalysisModule],
  controllers: [ResearchConfigurationController],
  providers: [ResearchConfigurationService]
})
export class ResearchConfigurationModule {}
