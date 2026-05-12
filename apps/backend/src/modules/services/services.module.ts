import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [AnalysisModule],
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServicesModule {}
